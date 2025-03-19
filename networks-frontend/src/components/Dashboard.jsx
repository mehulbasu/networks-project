import { Container, Title, Divider, Stack } from '@mantine/core';
import UploadButton from './UploadButton';
import './Dashboard.scss';

function Dashboard() {
    return (
        <>
            <Container className='page-container'>
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