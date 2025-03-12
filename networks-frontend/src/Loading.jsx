import { Loader, Container, Center } from '@mantine/core';

function Loading() {
    return (
        <>
            <Container h='100vh'>
                <Center h='100%'>
                <Loader color="blue" size="lg" type="bars" />
                </Center>
            </Container>
        </>
    );
}

export default Loading;
