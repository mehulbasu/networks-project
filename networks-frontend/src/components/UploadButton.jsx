import { useState, useRef } from 'react';
import { FileButton, Button, Group, Text, Progress, Stack, Notification, TextInput } from '@mantine/core';
import { IconUpload, IconCheck, IconX, IconServer } from '@tabler/icons-react';
import { auth } from '../utils/firebase';

function UploadButton() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState(null);
  const [ftpServer, setFtpServer] = useState("");
  const [ftpPort, setFtpPort] = useState("2121");
  const [showServerConfig, setShowServerConfig] = useState(false);
  
  // Get the server configuration from localStorage if available
  const savedServerRef = useRef(localStorage.getItem('ftpServer') || "");
  const savedPortRef = useRef(localStorage.getItem('ftpPort') || "2121");

  // Initialize from saved values
  useState(() => {
    if (savedServerRef.current) setFtpServer(savedServerRef.current);
    if (savedPortRef.current) setFtpPort(savedPortRef.current);
  }, []);

  const handleUpload = async () => {
    if (files.length === 0 || !auth.currentUser) return;
    if (!ftpServer) {
      setUploadStatus({ 
        type: 'error', 
        message: 'Please configure the FTP server address first' 
      });
      setShowServerConfig(true);
      return;
    }
    
    // Save server config to localStorage
    localStorage.setItem('ftpServer', ftpServer);
    localStorage.setItem('ftpPort', ftpPort);
    
    setUploading(true);
    setUploadStatus(null);
    
    const userId = auth.currentUser.uid;
    
    // Initialize progress for all files
    const initialProgress = {};
    files.forEach(file => {
      initialProgress[file.name] = 0;
    });
    setUploadProgress(initialProgress);
    
    // Create FormData with files and metadata
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Add FTP connection info and userId for directory structure
    formData.append('ftpServer', ftpServer);
    formData.append('ftpPort', ftpPort);
    formData.append('userId', userId);

    try {
      // Use your backend API as a proxy to the FTP server
      const API_URL = 'http://localhost:3000/upload'; // Adjust to your actual backend URL
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', API_URL, true);
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const overallProgress = Math.round((event.loaded / event.total) * 100);
          
          // Distribute progress equally among all files for simplicity
          const updatedProgress = {};
          files.forEach(file => {
            updatedProgress[file.name] = overallProgress;
          });
          
          setUploadProgress(updatedProgress);
        }
      };
      
      // Handle completion
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          
          setUploadStatus({ 
            type: 'success', 
            message: 'Files successfully uploaded to FTP server!' 
          });
          setFiles([]);
          
          // Set all files to 100% progress
          const completeProgress = {};
          files.forEach(file => {
            completeProgress[file.name] = 100;
          });
          setUploadProgress(completeProgress);
          
          setTimeout(() => setUploadProgress({}), 2000);
        } else {
          throw new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`);
        }
        setUploading(false);
      };
      
      // Handle errors
      xhr.onerror = () => {
        setUploadStatus({ 
          type: 'error', 
          message: 'Error connecting to server. Check your FTP settings.' 
        });
        setUploading(false);
      };
      
      xhr.send(formData);
      
    } catch (error) {
      console.error("Error in FTP upload:", error);
      setUploadStatus({ 
        type: 'error', 
        message: `Error uploading files: ${error.message}` 
      });
      setUploading(false);
    }
  };

  return (
    <Stack spacing="md">
      <Group justify="center">
        <FileButton onChange={setFiles} accept="image/png,image/jpeg" multiple>
          {(props) => <Button {...props} size='md' radius='md' leftSection={<IconUpload />}>Select Images</Button>}
        </FileButton>
        
        <Button
          onClick={() => setShowServerConfig(!showServerConfig)}
          size='md'
          radius='md'
          variant="outline"
          leftSection={<IconServer size="1rem" />}
        >
          FTP Settings
        </Button>
      </Group>

      {showServerConfig && (
        <Group grow mb="md">
          <TextInput
            label="FTP Server"
            placeholder="24.240.36.203"
            value={ftpServer}
            onChange={(e) => setFtpServer(e.target.value)}
          />
          <TextInput
            label="Port"
            placeholder="2121"
            value={ftpPort}
            onChange={(e) => setFtpPort(e.target.value)}
          />
        </Group>
      )}
      
      {files.length > 0 && (
        <Button 
          onClick={handleUpload} 
          size='md' 
          radius='md' 
          color="green" 
          disabled={uploading}
        >
          Upload {files.length} {files.length === 1 ? 'file' : 'files'} to FTP Server
        </Button>
      )}

      {Object.entries(uploadProgress).map(([fileName, progress]) => (
        <div key={fileName}>
          <Group position="apart" mb={5}>
            <Text size="sm">{fileName}</Text>
            <Text size="sm">{progress}%</Text>
          </Group>
          <Progress value={progress} size="sm" mb={15} />
        </div>
      ))}

      {uploadStatus && (
        <Notification
          icon={uploadStatus.type === 'success' ? <IconCheck size="1.1rem" /> : <IconX size="1.1rem" />}
          color={uploadStatus.type === 'success' ? 'teal' : 'red'}
          withBorder
          radius='md'
          onClose={() => setUploadStatus(null)}
        >
          {uploadStatus.message}
        </Notification>
      )}
    </Stack>
  );
}

export default UploadButton;