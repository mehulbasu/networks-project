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

// Endpoint to download a single file from the FTP server using DOWNLOAD_FROM
router.get('/file/:userId/:filename', async (req, res) => {
    const { userId, filename } = req.params;
    const { ftpServer, ftpPort } = req.query;

    if (!ftpServer || !ftpPort) {
        return res.status(400).json({ error: 'Missing FTP server information' });
    }

    let socket;
    try {
        console.log(`Downloading file ${filename} from ${userId} directory`);
        socket = net.createConnection(parseInt(ftpPort), ftpServer);

        // Wait for welcome message
        await new Promise((resolve, reject) => {
            socket.once('data', data => {
                resolve();
            });
            socket.once('error', reject);
            socket.once('close', () => reject(new Error('Connection closed')));
        });

        // Send DOWNLOAD_FROM command
        socket.write(`DOWNLOAD_FROM ${userId} ${filename}\n`);

        // Get file size response
        const fileSizeResponse = await new Promise((resolve) => {
            socket.once('data', data => {
                resolve(data.toString().trim());
            });
        });

        const fileSize = parseInt(fileSizeResponse);

        if (fileSize === -1) {
            socket.write('QUIT\n');
            setTimeout(() => socket.end(), 500);
            return res.status(404).json({ error: 'File not found on server' });
        }

        // Tell server we're ready to receive the file
        socket.write('READY');

        // Set headers before streaming
        res.setHeader('Content-Type', getContentType(filename));
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        // Pipe the socket directly to the response, up to fileSize bytes
        let bytesReceived = 0;
        socket.on('data', chunk => {
            if (bytesReceived + chunk.length > fileSize) {
                // Only send up to fileSize bytes
                const remaining = fileSize - bytesReceived;
                res.write(chunk.slice(0, remaining));
                bytesReceived += remaining;
                res.end();
                socket.destroy();
            } else {
                res.write(chunk);
                bytesReceived += chunk.length;
                if (bytesReceived === fileSize) {
                    res.end();
                    socket.destroy();
                }
            }
        });

        socket.on('end', () => {
            if (!res.writableEnded) res.end();
        });

        socket.on('error', err => {
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to download file from FTP server',
                    error: err.message
                });
            } else {
                res.destroy();
            }
        });

    } catch (error) {
        if (socket) {
            try {
                socket.write('QUIT\n');
                setTimeout(() => socket.end(), 500);
            } catch (e) {}
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

// Endpoint to delete a file from the FTP server
router.delete('/delete', async (req, res) => {
    const { userId, filename, ftpServer, ftpPort } = req.body;
  
    if (!userId || !filename || !ftpServer || !ftpPort) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    let socket;
    try {
      console.log(`Deleting file ${filename} from ${userId} directory`);
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
  
      // Send DELETE_FROM command
      console.log(`Sending command: DELETE_FROM ${userId} ${filename}`);
      socket.write(`DELETE_FROM ${userId} ${filename}\n`);
      
      // Get response
      const response = await new Promise((resolve) => {
        socket.once('data', data => {
          resolve(data.toString().trim());
        });
      });
      
      console.log(`Delete response: ${response}`);
  
      // Send QUIT command
      console.log("Sending QUIT command");
      socket.write('QUIT\n');
      
      // Wait briefly for server to process QUIT
      await new Promise(resolve => setTimeout(resolve, 500));
      
      socket.end();
      console.log("Socket ended");
  
      // Check response
      if (response.includes('deleted successfully')) {
        res.json({ success: true, message: response });
      } else {
        res.status(404).json({ success: false, message: response });
      }
    } catch (error) {
      console.error('FTP delete error:', error);
      
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
        message: 'Failed to delete file from FTP server',
        error: error.message
      });
    }
  });

module.exports = router;