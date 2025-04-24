import { useState, useEffect } from 'react';
import { SimpleGrid, Image, Text, Loader, Center, Paper, AspectRatio, Button, Group, Space, ActionIcon, Tooltip, Modal } from '@mantine/core';
import { IconRefresh, IconTrash, IconX } from '@tabler/icons-react';
import { auth } from '../../utils/firebase';
import { notifications } from '@mantine/notifications';

function GalleryView( { ftpServer, ftpPort, setShowServerConfig } ) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingImages, setDeletingImages] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  const fetchUserImages = async () => {
    if (!auth.currentUser) {
      setError('You must be logged in to view images');
      setLoading(false);
      return;
    }

    if (!ftpServer) {
      setError('Please configure the FTP server address first');
      setShowServerConfig(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = auth.currentUser.uid;
      const response = await fetch(
        `http://localhost:3000/download/list/${userId}?ftpServer=${encodeURIComponent(ftpServer)}&ftpPort=${encodeURIComponent(ftpPort)}`
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.files || data.files.length === 0) {
        setImages([]);
        setLoading(false);
        return;
      }

      // Create image objects with URLs pointing to our backend
      const imageObjects = data.files.map(filename => ({
        name: filename,
        url: `http://localhost:3000/download/file/${userId}/${encodeURIComponent(filename)}?ftpServer=${encodeURIComponent(ftpServer)}&ftpPort=${encodeURIComponent(ftpPort)}`,
        path: `${userId}/${filename}`,
      }));

      setImages(imageObjects);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(`Failed to load images: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (filename) => {
    if (!auth.currentUser) {
      notifications.show({
        title: 'Error',
        message: 'You must be logged in to delete images',
        color: 'red',
        icon: <IconX />
      });
      return;
    }

    const userId = auth.currentUser.uid;
    
    // Mark this image as being deleted
    setDeletingImages(prev => ({ ...prev, [filename]: true }));
    
    try {
      const response = await fetch(`http://localhost:3000/download/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          filename,
          ftpServer,
          ftpPort
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      
      notifications.show({
        title: 'Success',
        message: `${filename} has been deleted`,
        color: 'green'
      });
      
      // Refresh the image list
      fetchUserImages();
    } catch (err) {
      console.error('Error deleting image:', err);
      notifications.show({
        title: 'Error',
        message: `Failed to delete image: ${err.message}`,
        color: 'red',
        icon: <IconX />
      });
    } finally {
      // Clear deleting state
      setDeletingImages(prev => {
        const updated = {...prev};
        delete updated[filename];
        return updated;
      });
      setConfirmDelete(null);
    }
  };

  useEffect(() => {
    fetchUserImages();
  }, []);

  return (
    <>
        <Button 
          size='md'
          radius='md'
          m="auto"
          w='40%'
          variant='light'
          leftSection={<IconRefresh size="1rem" />}
          onClick={fetchUserImages}
        >
          Refresh Gallery
        </Button>
      
      <Space h="0" />

      {loading ? (
        <Center style={{ height: 200 }}>
          <Loader size="lg" />
        </Center>
      ) : error ? (
        <Center>
          <Text c="red">{error}</Text>
        </Center>
      ) : images.length === 0 ? (
        <Center style={{ height: 200 }}>
          <Text>No images found. Try uploading some images first.</Text>
        </Center>
      ) : (
        <SimpleGrid
          cols={3}
          spacing="md"
          breakpoints={[
            { maxWidth: 'md', cols: 2 },
            { maxWidth: 'sm', cols: 1 },
          ]}
        >
          {images.map((image) => (
            <Paper
              key={image.path}
              shadow="sm"
              p="xs"
              withBorder
            >
              <div style={{ position: 'relative' }}>
                <AspectRatio ratio={1}>
                  <Image
                    src={image.url}
                    alt={image.name}
                    fit="cover"
                    radius="sm"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.open(image.url, '_blank')}
                  />
                </AspectRatio>
                <Tooltip label="Delete image">
                  <ActionIcon 
                    color="red" 
                    variant="filled" 
                    size="md"
                    style={{ 
                      position: 'absolute', 
                      top: '8px', 
                      right: '8px',
                      zIndex: 10 
                    }}
                    loading={deletingImages[image.name]}
                    onClick={() => setConfirmDelete(image)}
                  >
                    <IconTrash size="1rem" />
                  </ActionIcon>
                </Tooltip>
              </div>
              <Text size="sm" mt="xs" align="center" lineClamp={1}>
                {image.name}
              </Text>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      {/* Confirmation Modal */}
      <Modal
        opened={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Confirm Deletion"
        centered
      >
        <Text mb="md">
          Are you sure you want to delete the image "{confirmDelete?.name}"? This action cannot be undone.
        </Text>
        <Group position="right">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button 
            color="red" 
            onClick={() => deleteImage(confirmDelete?.name)}
            loading={confirmDelete && deletingImages[confirmDelete.name]}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
}

export default GalleryView;