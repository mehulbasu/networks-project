const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
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

// FTP upload endpoint
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
        // Connect to FTP server
        socket = net.createConnection(parseInt(ftpPort), ftpServer);

        // Wait for welcome message
        await new Promise((resolve, reject) => {
            socket.once('data', data => {
                console.log('FTP Server: ' + data.toString());
                resolve();
            });
            socket.once('error', reject);
            socket.once('close', () => reject(new Error('Connection closed')));
        });

        // Upload files to user directory
        const results = [];
        for (const file of files) {
            // Create user directory command
            socket.write(`UPLOAD_TO ${userId} ${file.originalname}\n`);

            // Send file size
            const fileSize = fs.statSync(file.path).size;
            socket.write(fileSize.toString());

            // Wait for READY response
            const readyResponse = await new Promise((resolve) => {
                socket.once('data', data => {
                    resolve(data.toString());
                });
            });

            if (readyResponse.trim() === 'READY') {
                // Send file data
                const fileStream = fs.createReadStream(file.path);
                await new Promise((resolve, reject) => {
                    fileStream.pipe(socket, { end: false });
                    fileStream.on('end', resolve);
                    fileStream.on('error', reject);
                });

                // Get upload result
                const result = await new Promise((resolve) => {
                    socket.once('data', data => {
                        resolve(data.toString());
                    });
                });

                results.push({
                    filename: file.originalname,
                    status: 'success',
                    message: result.trim()
                });
            } else {
                results.push({
                    filename: file.originalname,
                    status: 'error',
                    message: 'Server not ready'
                });
            }

            // Clean up temporary file
            await unlinkAsync(file.path);
        }

        // Close connection
        socket.write('QUIT\n');
        socket.end();

        res.json({
            success: true,
            message: 'Files uploaded to FTP server',
            files: results
        });

    } catch (error) {
        console.error('FTP upload error:', error);
        // Clean up any remaining temp files
        for (const file of files) {
            try {
                await unlinkAsync(file.path);
            } catch (e) {
                // Ignore clean-up errors
            }
        }

        if (socket) {
            try {
                socket.end();
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