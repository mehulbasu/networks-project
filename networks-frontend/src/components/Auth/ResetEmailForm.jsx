import { Text, TextInput, Button } from '@mantine/core';

// TODO: Option to return to login form 
const ResetEmailForm = ({ emailSent, emailReset, handleReset }) => {
    return (
        <>
            {emailSent ? (
                <Text align='center' mb='md' fz='md' c='gray'>
                    An email has been sent to reset your password.
                </Text>
            ) : (
                <>
                    <Text align='center' mb='md' fz='md' c='gray'>
                        Enter your email address to reset your password.
                    </Text>
                    <form onSubmit={emailReset.onSubmit((values) => handleReset(values.email))}>
                        <TextInput
                            required
                            size='md'
                            placeholder='Email *'
                            radius='xl'
                            key={emailReset.key('email')}
                            error={emailReset.errors}
                            {...emailReset.getInputProps('email')}
                        />
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginTop: '1rem',
                            }}>
                            <Button
                                type='submit'
                                miw='12rem'
                                size='md'
                                radius='xl'>
                                Send email
                            </Button>
                        </div>
                    </form>
                </>
            )}
        </>
    );
};

export default ResetEmailForm;
