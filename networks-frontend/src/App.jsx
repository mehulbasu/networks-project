import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import Home from './components/Home'

export default function App() {
  return <MantineProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  </MantineProvider>;
}