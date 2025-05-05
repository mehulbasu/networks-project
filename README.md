# Flix - Image Storage Web Application

Flix is a full-stack web application that allows users to store images using a custom FTP server implementation. The project demonstrates client-server architecture with a modern React frontend, Express.js backend middleware, and a Python-based FTP server.

## Project Architecture

The project consists of three main components:

1. **Frontend (React)** - User interface for authentication, file uploads, and image gallery
2. **Client Backend (Express.js)** - Middleware that handles communication between the frontend and FTP server
3. **FTP Server (Python)** - Custom FTP server implementation for file storage

## Features

- **User Authentication**: Email/password and Google Sign-In (using Firebase)
- **Image Upload**: Upload multiple images to the FTP server
- **Image Gallery**: View all uploaded images with a responsive grid layout
- **Image Management**: Delete unwanted images
- **FTP Configuration**: Configurable FTP server connection settings

## Technologies Used

- **Frontend**:
  - React 19
  - Mantine UI Components
  - Firebase Authentication
  - React Router
  - Vite (build tool)
  - SCSS for styling

- **Client Backend**:
  - Express.js
  - Multer (file handling)
  - Node.js net module (for FTP communication)

- **FTP Server**:
  - Python 3
  - Socket programming
  - Threading for handling multiple clients

## Setup and Installation

### Prerequisites

- Node.js (v16+)
- Python 3.7+
- npm or yarn

### FTP Server Setup

1. Navigate to the FTP server directory:
   ```bash
   cd ftp_server
   ```

2. Run the Python FTP server:
   ```bash
   python ftp_server.py
   ```
   
   The server will start on port 2121 by default.

### Client Backend Setup

1. Navigate to the client backend directory:
   ```bash
   cd networks-client-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   
   The backend server will run on http://localhost:3000.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd networks-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   
   The frontend will be available at http://localhost:5173.

## Usage

1. **Authentication**:
   - Create an account using email/password or Google Sign-In
   - Login with existing credentials

2. **Uploading Images**:
   - Click "Select Images" to choose files from your device
   - Configure FTP server settings if needed (default: 24.240.36.203:2121)
   - Click "Upload" to send files to the FTP server

3. **Viewing and Managing Images**:
   - The gallery displays all your uploaded images
   - Click on an image to view it in full size
   - Use the delete button (trash icon) to remove images
   - Click "Refresh Gallery" to update the image list

## FTP Protocol Commands

The custom FTP server implements the following commands:

- `LIST <directory>` - List files in a directory
- `UPLOAD_TO <directory> <filename>` - Upload a single file
- `UPLOAD_ALL_TO <directory> <count>` - Upload multiple files in batch
- `DOWNLOAD_FROM <directory> <filename>` - Download a file
- `DOWNLOAD_ALL_FROM <directory>` - Download all files from a directory
- `DELETE_FROM <directory> <filename>` - Delete a file
- `QUIT` - Close the connection

## Project Structure

```
networks-project/
├── ftp_server/            # Python FTP server implementation
│   └── ftp_server.py
│
├── networks-client-backend/  # Express.js middleware
│   ├── app.js
│   ├── uploads.js         # File upload handlers
│   ├── downloads.js       # File download and management handlers
│   └── bin/www            # Server startup
│
└── networks-frontend/     # React frontend
    ├── src/
    │   ├── components/    # UI components
    │   │   ├── Auth/      # Authentication components
    │   │   └── Gallery/   # Gallery view components
    │   ├── utils/
    │   │   └── firebase.js # Firebase configuration
    │   ├── App.jsx        # Main application component
    │   └── main.jsx       # Application entry point
    └── public/            # Static assets
```

## Network Communication Flow

1. User interacts with the React frontend
2. Frontend makes requests to the Express backend
3. Backend communicates with the Python FTP server using sockets
4. FTP server processes commands and manages files in the server_files directory
5. Results are sent back through the chain to the frontend

## Security Considerations

- User authentication is handled by Firebase
- Path traversal protection is implemented on the FTP server
- Each user gets their own directory on the FTP server
- Files are validated before upload

## Contributors

- Anirudh Yarram - yarram@wisc.edu
- Mehul Basu - mehul.basu@wisc.edu
- Sanjay Reddy Nagarimadugu - snagarimadug@wisc.edu
- Siddhant Denzil Srinivas - sdsrinivas@wisc.edu

---

This project was created for educational purposes to demonstrate client-server architecture and network programming principles.