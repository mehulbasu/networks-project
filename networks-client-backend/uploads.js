const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

// Configure multer for temporary file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join(__dirname, 'temp_uploads');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// FTP upload endpoint using UPLOAD_ALL_TO protocol
router.post('/', upload.array('files'), async (req, res) => {
    const { ftpServer, ftpPort, userId } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    if (!ftpServer || !ftpPort || !userId) {
        return res.status(400).json({ error: 'Missing FTP server information or user ID' });
    }

    let socket;
    try {
        console.log(`Connecting to FTP server at ${ftpServer}:${ftpPort}`);
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
        
        console.log(`Got welcome message: ${welcomeMessage.trim()}`);

        // Use UPLOAD_ALL_TO for batch upload
        socket.write(`UPLOAD_ALL_TO ${userId} ${files.length}\n`);
        // Wait for server ready
        const readyResponse = await new Promise((resolve) => {
            socket.once('data', data => {
                resolve(data.toString().trim());
            });
        });
        
        console.log(`Server response: ${readyResponse}`);
        
        if (readyResponse === 'READY') {
            // Process each file
            for (const file of files) {
                try {
                    console.log(`Processing file: ${file.originalname}`);
                    const fileSize = fs.statSync(file.path).size;
                    
                    // Send filename and size
                    console.log(`Sending file info: ${file.originalname}:${fileSize}`);
                    socket.write(`${file.originalname}:${fileSize}\n`);
                    
                    // Wait for server ready for this file
                    const fileReadyResponse = await new Promise((resolve) => {
                        socket.once('data', data => {
                            resolve(data.toString().trim());
                        });
                    });
                    
                    console.log(`Server file response: ${fileReadyResponse}`);
                    
                    if (fileReadyResponse === 'READY') {
                        // Read and send file content in chunks
                        const fileBuffer = await readFileAsync(file.path);
                        let bytesSent = 0;
                        const chunkSize = 4096;
                        
                        console.log(`Sending file data for: ${file.originalname}`);
                        while (bytesSent < fileSize) {
                            const chunk = fileBuffer.slice(bytesSent, bytesSent + chunkSize);
                            socket.write(chunk);
                            bytesSent += chunk.length;
                            process.stdout.write(`\rSent ${bytesSent}/${fileSize} bytes (${Math.round(bytesSent/fileSize*100)}%)`);
                        }
                        console.log(); // New line after progress output
                        
                        // Wait for server's NEXT signal
                        const nextResponse = await new Promise((resolve) => {
                            socket.once('data', data => {
                                resolve(data.toString().trim());
                            });
                        });
                        
                        console.log(`Server next response: ${nextResponse}`);
                    }
                } catch (fileError) {
                    console.error(`Error processing file ${file.originalname}:`, fileError);
                } finally {
                    // Clean up temp file
                    try {
                        if (fs.existsSync(file.path)) {
                            await unlinkAsync(file.path);
                        }
                    } catch (e) {
                        console.error(`Error deleting temp file: ${e.message}`);
                    }
                }
            }
            
            // Get final completion message
            const completionMessage = await new Promise((resolve) => {
                socket.once('data', data => {
                    resolve(data.toString().trim());
                });
            });
            
            console.log(`Final server message: ${completionMessage}`);
            
            // Clean exit
            console.log('Sending QUIT');
            socket.write('QUIT\n');
            
            // Wait for goodbye
            const goodbyeMsg = await new Promise((resolve) => {
                socket.once('data', data => {
                    resolve(data.toString().trim());
                });
                setTimeout(() => resolve('No response'), 2000);
            });
            
            console.log(`Server goodbye: ${goodbyeMsg}`);
            socket.end();
            
            res.json({
                success: true,
                message: completionMessage,
                filesUploaded: files.length
            });
        } else {
            throw new Error(`Server not ready for batch upload: ${readyResponse}`);
        }
    } catch (error) {
        console.error('FTP upload error:', error);
        
        // Clean up any remaining temp files
        for (const file of files) {
            try {
                if (fs.existsSync(file.path)) {
                    await unlinkAsync(file.path);
                }
            } catch (e) {
                // Ignore clean-up errors
            }
        }

        if (socket) {
            try {
                socket.write('QUIT\n');
                setTimeout(() => socket.end(), 500);
            } catch (e) {
                // Ignore socket close errors
            }
        }

        res.status(500).json({
            success: false,
            message: 'Failed to upload files to FTP server',
            error: error.message
        });
    }
});

module.exports = router;