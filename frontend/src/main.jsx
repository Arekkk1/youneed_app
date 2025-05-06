import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; // Import HelmetProvider
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; // Import ThemeProvider
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider> {/* Wrap the entire app with HelmetProvider */}
      <Router>
        <AuthProvider>
          <ThemeProvider> {/* Wrap App with ThemeProvider */}
            <App />
            <Toaster position="top-right" reverseOrder={false} />
          </ThemeProvider> {/* Close ThemeProvider */}
        </AuthProvider>
      </Router>
    </HelmetProvider> {/* Close HelmetProvider */}
  </React.StrictMode>,
);
