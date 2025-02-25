// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import Home from './components/Home'

import { MantineProvider } from '@mantine/core';

export default function App() {
  return <MantineProvider>
    <Home/>
  </MantineProvider>;
}