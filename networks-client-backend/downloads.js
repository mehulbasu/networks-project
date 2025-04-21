const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const net = require('net');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

// Helper function to determine content type from filename
function getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        case '.bmp':
            return 'image/bmp';
        case '.webp':
            return 'image/webp';
        default:
            return 'application/octet-stream';
    }
}

// Endpoint to list files in a user's directory on the FTP server
router.get('/list/:userId', async (req, res) => {
    const { userId } = req.params;
    const { ftpServer, ftpPort } = req.query;

    if (!ftpServer || !ftpPort) {
        return res.status(400).json({ error: 'Missing FTP server information' });
    }

    let socket;
    try {
        console.log(`Listing files for user ${userId} from FTP server ${ftpServer}:${ftpPort}`);
        // Connect to FTP server
        socket = net.createConnection(parseInt(ftpPort), ftpServer);

        // Wait for welcome message
        const welcomeMessage = await new Promise((resolve, reject) => {
            socket.once('data', data => {
                console.log('FTP Server: ' + data.toString());
                resolve(data.toString());
            });
            socket.once('error', reject);
            socket.once('close', () => reject(new Error('Connection closed')));
        });
        
        console.log(`Received welcome: ${welcomeMessage.trim()}`);

        // Get list of files from user's directory
        console.log(`Sending command: LIST ${userId}`);
        socket.write(`LIST ${userId}\n`);
        
        // Get file list response
        const fileListResponse = await new Promise((resolve) => {
            socket.once('data', data => {
                resolve(data.toString().trim());
            });
        });
        
        console.log(`File list response: ${fileListResponse}`);

        // Don't close connection immediately
        console.log("Sending QUIT command");
        socket.write('QUIT\n');
        
        // Wait briefly for server to process QUIT
        await new Promise(resolve => setTimeout(resolve, 500));
        
        socket.end();
        console.log("Socket ended");

        // Parse file list
        const files = fileListResponse === 'Directory not found' || fileListResponse === '' 
            ? [] 
            : fileListResponse.split('\n');

        res.json({ files });

    } catch (error) {
        console.error('FTP list error:', error);
        
        if (socket) {
            try {
                socket.write('QUIT\n');
                setTimeout(() => {
                    try {
                        socket.end();
                    } catch (e) { /* ignore */ }
                }, 500);
            } catch (e) {
                // Ignore socket close errors
            }
        }

        res.status(500).json({
            success: false,
            message: 'Failed to list files from FTP server',
            error: error.message
        });
    }
});

// Endpoint to download a single file from the FTP server using DOWNLOAD_ALL_FROM
router.get('/file/:userId/:filename', async (req, res) => {
    const { userId, filename } = req.params;
    const { ftpServer, ftpPort } = req.query;

    if (!ftpServer || !ftpPort) {
        return res.status(400).json({ error: 'Missing FTP server information' });
    }

    let socket;
    try {
        console.log(`Downloading file ${filename} from ${userId} directory`);
        // Connect to FTP server
        socket = net.createConnection(parseInt(ftpPort), ftpServer);

        // Wait for welcome message
        const welcomeMessage = await new Promise((resolve, reject) => {
            socket.once('data', data => {
                console.log('FTP Server: ' + data.toString());
                resolve(data.toString());
            });
            socket.once('error', reject);
            socket.once('close', () => reject(new Error('Connection closed')));
        });
        
        console.log(`Received welcome: ${welcomeMessage.trim()}`);

        // Send DOWNLOAD_ALL_FROM command (we'll handle just one file)
        console.log(`Sending command: DOWNLOAD_ALL_FROM ${userId}`);
        socket.write(`DOWNLOAD_ALL_FROM ${userId}\n`);
        
        // Get number of files
        const numFilesResponse = await new Promise((resolve) => {
            socket.once('data', data => {
                resolve(data.toString().trim());
            });
        });
        
        console.log(`Number of files response: ${numFilesResponse}`);
        const numFiles = parseInt(numFilesResponse);
        
        if (numFiles <= 0) {
            console.log('No files found on server');
            socket.write('QUIT\n');
            setTimeout(() => socket.end(), 500);
            return res.status(404).json({ error: 'No files found on server' });
        }

        // Tell server we're ready to receive the file list
        console.log('Sending READY');
        socket.write('READY');

        // Look for our specific file in the responses
        let targetFileInfo = null;
        let targetFileSize = 0;
        
        for (let i = 0; i < numFiles; i++) {
            // Get filename and size info
            const fileInfoResponse = await new Promise((resolve) => {
                socket.once('data', data => {
                    resolve(data.toString().trim());
                });
            });
            
            console.log(`File info: ${fileInfoResponse}`);
            const [currentFilename, fileSizeStr] = fileInfoResponse.split(':');
            
            if (currentFilename === filename) {
                // This is the file we want
                targetFileInfo = fileInfoResponse;
                targetFileSize = parseInt(fileSizeStr);
                
                // Tell server we're ready for this specific file
                console.log('Found target file, sending READY');
                socket.write('READY');
                
                // Collect file data
                let bytesReceived = 0;
                const chunks = [];
                
                // Set up data handler for this file
                while (bytesReceived < targetFileSize) {
                    const chunk = await new Promise((resolve) => {
                        socket.once('data', data => {
                            resolve(data);
                        });
                    });
                    
                    bytesReceived += chunk.length;
                    chunks.push(chunk);
                    console.log(`Received ${bytesReceived}/${targetFileSize} bytes`);
                }
                
                // We've got our file, tell server we're ready for next (even if we don't want it)
                console.log('File transfer complete, sending NEXT');
                socket.write('NEXT');
                
                // Skip remaining files but respond to protocol
                for (let j = i + 1; j < numFiles; j++) {
                    const remainingFileInfo = await new Promise((resolve) => {
                        socket.once('data', data => {
                            resolve(data.toString().trim());
                        });
                    });
                    
                    console.log(`Skipping file: ${remainingFileInfo}`);
                    socket.write('READY'); // Tell server we're ready
                    
                    // Skip the file data by telling server we want next without reading
                    const [_, skipFileSizeStr] = remainingFileInfo.split(':');
                    const skipFileSize = parseInt(skipFileSizeStr);
                    
                    // Read and discard this file's data
                    let skipBytesReceived = 0;
                    while (skipBytesReceived < skipFileSize) {
                        const skipChunk = await new Promise((resolve) => {
                            socket.once('data', data => {
                                resolve(data);
                            });
                        });
                        skipBytesReceived += skipChunk.length;
                    }
                    
                    socket.write('NEXT');
                }
                
                // Get final message
                const finalMessage = await new Promise((resolve) => {
                    socket.once('data', data => {
                        resolve(data.toString().trim());
                    });
                });
                console.log(`Final message: ${finalMessage}`);
                
                // Clean up
                console.log('Sending QUIT');
                socket.write('QUIT\n');
                setTimeout(() => socket.end(), 500);
                
                // Send file to client
                const fileData = Buffer.concat(chunks, bytesReceived);
                res.setHeader('Content-Type', getContentType(filename));
                res.setHeader('Content-Length', targetFileSize);
                res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
                return res.end(fileData);
            } else {
                // Not our file, tell server we're ready but we'll skip this one
                socket.write('READY');
                
                // Skip file data by reading it but not storing
                const skipFileSize = parseInt(fileSizeStr);
                let skipBytesReceived = 0;
                
                while (skipBytesReceived < skipFileSize) {
                    const skipChunk = await new Promise((resolve) => {
                        socket.once('data', data => {
                            resolve(data);
                        });
                    });
                    skipBytesReceived += skipChunk.length;
                }
                
                // Tell server we're ready for next file
                console.log(`Skipped file ${currentFilename}, sending NEXT`);
                socket.write('NEXT');
            }
        }
        
        // If we get here, we didn't find our file
        // Clean up
        const finalMessage = await new Promise((resolve) => {
            socket.once('data', data => {
                resolve(data.toString().trim());
            });
        });
        console.log(`Final message: ${finalMessage}`);
        
        console.log('Sending QUIT');
        socket.write('QUIT\n');
        setTimeout(() => socket.end(), 500);
        
        return res.status(404).json({ error: 'Requested file not found on server' });

    } catch (error) {
        console.error('FTP download error:', error);
        
        if (socket) {
            try {
                socket.write('QUIT\n');
                setTimeout(() => {
                    try {
                        socket.end();
                    } catch (e) { /* ignore */ }
                }, 500);
            } catch (e) {
                // Ignore socket close errors
            }
        }

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to download file from FTP server',
                error: error.message
            });
        }
    }
});

module.exports = router;