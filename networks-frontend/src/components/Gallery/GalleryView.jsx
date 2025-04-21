import { useState, useEffect, useRef } from 'react';
import { SimpleGrid, Image, Text, Loader, Center, Paper, AspectRatio, Button, Group, TextInput } from '@mantine/core';
import { IconServer, IconRefresh } from '@tabler/icons-react';
import { auth } from '../../utils/firebase';

function GalleryView() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ftpServer, setFtpServer] = useState("");
  const [ftpPort, setFtpPort] = useState("2121");
  const [showServerConfig, setShowServerConfig] = useState(false);
  
  // Get the server configuration from localStorage if available
  const savedServerRef = useRef(localStorage.getItem('ftpServer') || "");
  const savedPortRef = useRef(localStorage.getItem('ftpPort') || "2121");

  // Initialize from saved values
  useEffect(() => {
    if (savedServerRef.current) setFtpServer(savedServerRef.current);
    if (savedPortRef.current) setFtpPort(savedPortRef.current);
  }, []);

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

    // Save FTP settings
    localStorage.setItem('ftpServer', ftpServer);
    localStorage.setItem('ftpPort', ftpPort);

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

  useEffect(() => {
    fetchUserImages();
  }, []);

  return (
    <div>
      <Group mb="md">
        <Button 
          leftSection={<IconServer size="1rem" />}
          onClick={() => setShowServerConfig(!showServerConfig)}
          variant="outline"
        >
          {showServerConfig ? 'Hide FTP Settings' : 'FTP Settings'} 
        </Button>
        <Button 
          leftSection={<IconRefresh size="1rem" />}
          onClick={fetchUserImages}
        >
          Refresh Gallery
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
      
      {loading ? (
        <Center style={{ height: 200 }}>
          <Loader size="lg" />
        </Center>
      ) : error ? (
        <Center>
          <Text color="red">{error}</Text>
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
              style={{ cursor: 'pointer' }}
              onClick={() => window.open(image.url, '_blank')}
            >
              <AspectRatio ratio={1}>
                <Image
                  src={image.url}
                  alt={image.name}
                  fit="cover"
                  radius="sm"
                />
              </AspectRatio>
              <Text size="sm" mt="xs" align="center" lineClamp={1}>
                {image.name}
              </Text>
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </div>
  );
}

export default GalleryView;