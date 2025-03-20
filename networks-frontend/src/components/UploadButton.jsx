import { useState } from 'react';
import { FileButton, Button, Group, Text, Progress, Stack, Notification } from '@mantine/core';
import { IconUpload, IconCheck, IconX } from '@tabler/icons-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../utils/firebase';

function UploadButton() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState(null);

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadStatus(null);
    
    const userId = auth.currentUser.uid;
    const uploadPromises = files.map(file => {
      // Create a reference with the proper path structure
      const storageRef = ref(storage, `${userId}/${file.name}`);
      
      // Start upload task
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Set up progress monitoring
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          },
          (error) => {
            console.error("Upload error:", error);
            reject(error);
          },
          async () => {
            // Upload completed successfully
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              name: file.name,
              url: downloadURL,
              path: `${userId}/${file.name}`
            });
          }
        );
      });
    });

    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Might want to save these references to your backend
      console.log("All files uploaded:", uploadedFiles);
      
      setUploadStatus({ type: 'success', message: 'All files uploaded successfully!' });
      // Reset files after successful upload
      setFiles([]);
    } catch (error) {
      console.error("Error in batch upload:", error);
      setUploadStatus({ type: 'error', message: 'Error uploading files. Please try again.' });
    } finally {
      setUploading(false);
      // Clear progress after a delay
      setTimeout(() => setUploadProgress({}), 2000);
    }
  };

  return (
    <Stack spacing="md">
      <Group justify="center">
        <FileButton onChange={setFiles} accept="image/png,image/jpeg" multiple>
          {(props) => <Button {...props} size='md' radius='md' leftSection={<IconUpload />}>Select Images</Button>}
        </FileButton>
        
        {files.length > 0 && (
          <Button 
            onClick={handleUpload} 
            size='md' 
            radius='md' 
            color="green" 
            disabled={uploading}
          >
            Upload {files.length} {files.length === 1 ? 'file' : 'files'}
          </Button>
        )}
      </Group>

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