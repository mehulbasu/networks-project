import { TextInput, PasswordInput, Button, Text, Divider, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';
import GoogleSSO from './GoogleSSO';

const SignupLoginForm = ({
    credentials,
    handleAuth,
    exists,
    setReset,
    setExists,
    authCompleted,
    setAuthCompleted,
}) => {
    const switchLogin = (value) => {
        credentials.clearErrors();
        setExists(value);
    };

    return (
        <>
            <form
                onSubmit={credentials.onSubmit((values) => handleAuth(values.email, values.password))}>
                <TextInput
                    required
                    size='md'
                    placeholder='Email *'
                    radius='xl'
                    key={credentials.key('email')}
                    error={credentials.errors}
                    {...credentials.getInputProps('email')}
                />
                <PasswordInput
                    required
                    size='md'
                    placeholder='Password *'
                    radius='xl'
                    mt='md'
                    key={credentials.key('password')}
                    error={credentials.errors}
                    {...credentials.getInputProps('password')}
                />
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
                    <Button
                        className='auth-button'
                        type='submit'
                        loading={authCompleted}
                        size='md'
                        radius='xl'>
                        {exists ? 'Log in' : 'Sign up'}
                    </Button>
                </div>
            </form>
            <Divider mx='sm' my='lg' label='OR' labelPosition='center' />
            <Stack align='stretch'>
                <GoogleSSO setAuthCompleted={setAuthCompleted} close={close} />
                {exists ? (
                    <Text ta='center'>
                        Don&apos;t have an account?{' '}
                        <Link className='links' onClick={() => switchLogin(false)}>
                            Sign up
                        </Link>
                    </Text>
                ) : (
                    <Text ta='center'>
                        Already have an account?{' '}
                        <Link className='links' onClick={() => switchLogin(true)}>
                            Log in
                        </Link>
                    </Text>
                )}
                {exists ? (
                    <Text ta='center'>
                        <Link className='links' onClick={() => setReset(true)}>
                            Forgot password?
                        </Link>
                    </Text>
                ) : null}
            </Stack>
        </>
    );
};

export default SignupLoginForm;
