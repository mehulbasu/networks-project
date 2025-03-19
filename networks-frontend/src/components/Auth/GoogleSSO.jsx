import { useEffect, useContext } from 'react';
import {
   signInWithPopup,
   GoogleAuthProvider,
   setPersistence,
   browserLocalPersistence,
} from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { Button } from '@mantine/core';
import { IconBrandGoogleFilled } from '@tabler/icons-react';

// If you encounter issues on mobile, it may be because local domain has not been authorized in Firebase.
function GoogleSSO({ setAuthCompleted }) {
   const signInWithGoogle = async () => {
      setAuthCompleted(true);
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      signInWithPopup(auth, provider).catch((error) => {
         setAuthCompleted(false);
         console.error(error.code, error.message);
      });
   };

   return (
      <>
         <Button
            leftSection={<IconBrandGoogleFilled size='20'/>}
            variant='light'
            size='md'
            radius='xl'
            onClick={signInWithGoogle}>
            Continue with Google
         </Button>
      </>
   );
}

export default GoogleSSO;
