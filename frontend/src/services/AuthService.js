import axios from 'axios';

// URL backendu - używaj /api prefix
const API_URL = 'http://49.13.68.62:5000/api'; // Corrected base URL

// Logowanie przez Google
export const googleLogin = async (role = 'client') => { // Pass role if needed
  try {
    // Przekierowanie do endpointu Google API
    window.location.href = `${API_URL}/auth/google?role=${role}`; // Corrected URL with /api and role
  } catch (error) {
    console.error('Szczegóły błędu Google:', error);
    throw new Error('Błąd logowania Google: ' + error.message);
  }
};

// Logowanie przez Facebook
export const facebookLogin = async (role = 'client') => { // Pass role if needed
  try {
    // Przekierowanie do endpointu Facebooka API
    // No need for axios call here, just redirect
    window.location.href = `${API_URL}/auth/facebook?role=${role}`; // Corrected URL with /api and role
  } catch (error) {
    console.error('Szczegóły błędu Facebook:', error);
    throw new Error('Błąd logowania Facebook: ' + error.message);
  }
};

// Function to handle the OAuth callback
export const handleAuthCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const userId = params.get('userId');
  const role = params.get('role');
  const error = params.get('error');
  const provider = params.get('provider'); // 'google' or 'facebook'

  if (error) {
    console.error(`Błąd logowania przez ${provider || 'OAuth'}:`, error);
    // Optionally display error message to user
    // Redirect back to login page with error shown
    window.location.href = `/login?error=${error}`;
    return null; // Indicate failure
  }

  if (token && userId && role) {
    console.log(`Logowanie przez ${provider} zakończone sukcesem.`);
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('role', role);
    // Redirect to the appropriate dashboard
    window.location.href = `/dashboard/${role}`; // Redirect after successful login
    return { token, userId, role }; // Indicate success
  }

  // If no token/error, maybe redirect to login or handle appropriately
  console.warn('Auth callback called without token or error.');
  // window.location.href = '/login'; // Redirect if state is unexpected
  return null; // Indicate unexpected state
};
