import { useState, useRef } from 'react';
import { Container, Title, Divider, Stack, Group, Button, Space } from '@mantine/core';
import { auth } from '../utils/firebase';
import UploadButton from './UploadButton';
import GalleryView from './Gallery/GalleryView';
import './Dashboard.scss';

function Dashboard() {
    const [ftpServer, setFtpServer] = useState("24.240.36.203");
    const [ftpPort, setFtpPort] = useState("2121");
    const [showServerConfig, setShowServerConfig] = useState(false);

    // Get the server configuration from localStorage if available
    const savedServerRef = useRef(localStorage.getItem('ftpServer') || "24.240.36.203");
    const savedPortRef = useRef(localStorage.getItem('ftpPort') || "2121");

    // Initialize from saved values
    useState(() => {
        if (savedServerRef.current) setFtpServer(savedServerRef.current);
        if (savedPortRef.current) setFtpPort(savedPortRef.current);
    }, []);

    const signOut = () => {
        auth.signOut().then(() => {
            console.log("User signed out");
        }).catch((error) => {
            console.error(error.code, error.message);
        });
    }

    return (
        <>
            <Container className='page-container'>
                <Group justify="flex-end" mb="md">
                    <Button variant='light' color='red' onClick={signOut}>Log Out</Button>
                </Group>
                <Stack spacing='xl'>
                    <Title ta='center'>Flix</Title>
                    <UploadButton
                        ftpServer={ftpServer}
                        ftpPort={ftpPort}
                        setFtpServer={setFtpServer}
                        setFtpPort={setFtpPort}
                        showServerConfig={showServerConfig}
                        setShowServerConfig={setShowServerConfig}
                    />
                    <Divider my='md'/>
                    <GalleryView
                        ftpServer={ftpServer}
                        ftpPort={ftpPort}
                        setFtpServer={setFtpServer}
                        setFtpPort={setFtpPort}
                        showServerConfig={showServerConfig}
                        setShowServerConfig={setShowServerConfig}
                    />
                </Stack>
            </Container>
        </>
    )
}

export default Dashboard;