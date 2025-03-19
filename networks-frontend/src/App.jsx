import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import RequireAuth from './RequireAuth';
import Home from './components/Home'
import Dashboard from './components/Dashboard';

export default function App() {
    return <MantineProvider>
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={
                    <RequireAuth>
                        <Dashboard />
                    </RequireAuth>
                } />
            </Routes>
        </Router>
    </MantineProvider>;
}