import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Loading from './Loading';

/**
 * Wrapper for routes that require being an authenticated user
 * @param {*} children - React children to render
 */
function RequireAuth({ children }) {
    const [authed, setAuthed] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthed(!!user);
        });

        return () => unsubscribe();
    }, []);

    if (authed === null) {
        return <Loading />;
    }

    return authed ? children : <Navigate to='/' replace state={{ path: location.pathname }} />;
}

export default RequireAuth;
