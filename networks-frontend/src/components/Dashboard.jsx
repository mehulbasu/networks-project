import { Container, Title, Divider, Stack, Group, Button } from '@mantine/core';
import { auth } from '../utils/firebase';
import UploadButton from './UploadButton';
import './Dashboard.scss';

function Dashboard() {

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
                    <UploadButton />
                    <Divider />
                </Stack>
            </Container>
        </>
    )
}

export default Dashboard;