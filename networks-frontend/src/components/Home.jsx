import { Container, Title } from '@mantine/core';
import Auth from './Auth/Auth';
import './Home.scss';

// TODO: Navbar
function Home() {
    return (
        <>
            <Container className='page-container'>
                <Title ta='center'>Welcome to Flix</Title>
                <Auth />
            </Container>
        </>
    )
}

export default Home;