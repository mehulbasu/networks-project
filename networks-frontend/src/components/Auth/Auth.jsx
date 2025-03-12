import { useState } from 'react';
import { Text, Container } from '@mantine/core';
import {
    createUserWithEmailAndPassword,
    browserLocalPersistence,
    setPersistence,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { useForm } from '@mantine/form';
import { auth } from '../../utils/firebase';
import ResetEmailForm from './ResetEmailForm';
import SignupLoginForm from './SignupLoginForm';
import './Auth.scss';

// TODO: Navigate after auth
/**
 * Renders modals with a form for signing up, logging in, or resetting password
 */
function Auth() {
    const [exists, setExists] = useState(true);
    const [reset, setReset] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [authCompleted, setAuthCompleted] = useState(false);

    // Form for email and password signing up or logging in
    const credentials = useForm({
        mode: 'uncontrolled',
        initialValues: {
            email: '',
            password: '',
        },

        validate: {
            email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Invalid email'),
            password: (value) =>
                value.length >= 8 ? null : 'Password must be at least 8 characters long',
        },
    });

    // Form for email input when resetting password
    const emailReset = useForm({
        mode: 'uncontrolled',
        initialValues: {
            email: '',
        },

        validate: {
            email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Invalid email'),
        },
    });

    // Using form inputs to sign up or log in
    const handleAuth = async (email, password) => {
        try {
            setAuthCompleted(true);
            await setPersistence(auth, browserLocalPersistence);
            await (exists
                ? signInWithEmailAndPassword(auth, email, password)
                : createUserWithEmailAndPassword(auth, email, password));
        } catch (error) {
            // Setting errors to 'credentials' form fields
            setAuthCompleted(false);
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            switch (errorCode) {
                case 'auth/email-already-in-use':
                    credentials.setFieldError('email', 'Email already in use');
                    break;
                case 'auth/invalid-credential':
                    credentials.setFieldError('password', 'Invalid email or password');
                    break;
                default:
                    window.alert('Something went wrong. Please try again later.');
            }
        }
    };

    // Sending password reset email
    const handleReset = async (email) => {
        sendPasswordResetEmail(auth, email)
            .then(() => {
                setEmailSent(true);
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log(errorCode, errorMessage);
            });
    };

    return (
        <>
            <Container className='auth-container'>
                {reset ? (
                    <ResetEmailForm
                        emailSent={emailSent}
                        emailReset={emailReset}
                        handleReset={handleReset}
                    />
                ) : (
                    <SignupLoginForm
                        credentials={credentials}
                        handleAuth={handleAuth}
                        exists={exists}
                        setReset={setReset}
                        setExists={setExists}
                        authCompleted={authCompleted}
                        setAuthCompleted={setAuthCompleted}
                    />
                )}
            </Container>
        </>
    );
}

export default Auth;
