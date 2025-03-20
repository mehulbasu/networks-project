import { useState, useEffect } from 'react';
import { SimpleGrid, Image, Text, Loader, Center, Paper, AspectRatio } from '@mantine/core';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../../utils/firebase';

function GalleryView() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserImages = async () => {
      if (!auth.currentUser) {
        setError('You must be logged in to view images');
        setLoading(false);
        return;
      }

      try {
        const userId = auth.currentUser.uid;
        const userFolderRef = ref(storage, `${userId}`);
        
        // List all items in the user's folder
        const result = await listAll(userFolderRef);
        
        if (result.items.length === 0) {
          setLoading(false);
          return;
        }

        // Get the download URL for each item
        const imageUrls = await Promise.all(
          result.items.map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            return {
              name: itemRef.name,
              url,
              path: itemRef.fullPath,
              // Extract creation time from metadata if needed
              // You could add getMetadata(itemRef) here if you need additional info
            };
          })
        );

        setImages(imageUrls);
      } catch (err) {
        console.error('Error fetching images:', err);
        setError('Failed to load images. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserImages();
  }, []);

  if (loading) {
    return (
      <Center style={{ height: 200 }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center>
        <Text color="red">{error}</Text>
      </Center>
    );
  }

  if (images.length === 0) {
    return (
      <Center style={{ height: 200 }}>
        <Text>No images found.</Text>
      </Center>
    );
  }

  return (
    <div>
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
    </div>
  );
}

export default GalleryView;