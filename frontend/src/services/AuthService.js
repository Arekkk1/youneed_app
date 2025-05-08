import api from '../api'; // Assuming api.js exports the base axios instance

// The VITE_API_URL should be the base URL of your backend API
// e.g., https://api.youneed.com.pl/api
const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Initiates Google login flow.
 * @param {string} role - The role ('client' or 'provider') the user is trying to log in as.
 */
export const googleLogin = (role) => {
  if (!API_BASE_URL) {
    console.error('VITE_API_URL is not defined. Cannot initiate Google login.');
    // Optionally, show an error to the user
    return;
  }
  // Redirects the browser to the backend Google OAuth endpoint.
  // The backend will handle the authentication with Google and then redirect back to the frontend.
  window.location.href = `${API_BASE_URL}/auth/google?role=${encodeURIComponent(role)}`;
};

/**
 * Initiates Facebook login flow.
 * @param {string} role - The role ('client' or 'provider') the user is trying to log in as.
 */
export const facebookLogin = (role) => {
  if (!API_BASE_URL) {
    console.error('VITE_API_URL is not defined. Cannot initiate Facebook login.');
    // Optionally, show an error to the user
    return;
  }
  // Redirects the browser to the backend Facebook OAuth endpoint.
  window.location.href = `${API_BASE_URL}/auth/facebook?role=${encodeURIComponent(role)}`;
};

// You can add other authentication-related functions here if needed,
// for example, a function to handle the token after successful OAuth callback.
// export const handleOAuthCallback = async (provider, queryParams) => { ... }
