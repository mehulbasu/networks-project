import { Container, Center, Title } from '@mantine/core';
import './Home.scss';

// TODO: Navbar
function Home() {
    return (
        <>
            <Container className='page-container'>
                <Center>
                    <Title>Welcome to Flix</Title>
                </Center>
            </Container>
        </>
    )
}

export default Home;