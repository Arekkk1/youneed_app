import React, { useState, useEffect } from 'react'; // Added useEffect
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import GoogleIcon from '../../assets/icon/Google.svg';
import FacebookIcon from '../../assets/icon/Facebook.svg';
import { googleLogin, facebookLogin } from '../../services/AuthService'; // Import social login functions

// Ścieżka API z zmiennej środowiskowej lub domyślna
const API_URL = 'http://49.13.68.62:5000/api'; // Use /api prefix

// Schemat walidacji dla logowania
const validationSchema = Yup.object({
  email: Yup.string().email('Nieprawidłowy email').required('Email jest wymagany'),
  password: Yup.string().required('Hasło jest wymagane'),
});

// Schemat walidacji dla resetowania hasła
const forgotPasswordSchema = Yup.object({
  email: Yup.string().email('Nieprawidłowy email').required('Email jest wymagany'),
});

function Login({ setRole }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roleFromUrl = params.get('role');
  const sessionExpired = params.get('sessionExpired'); // Check for session expiry flag
  const [role, setLocalRole] = useState(roleFromUrl || localStorage.getItem('role') || 'client');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginError, setLoginError] = useState(''); // State for general login errors
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(''); // State for success message

  // Update role state if URL changes
  useEffect(() => {
    if (roleFromUrl) {
      setLocalRole(roleFromUrl);
      localStorage.setItem('role', roleFromUrl); // Persist role from URL
    }
  }, [roleFromUrl]);

  // Show session expired message
   useEffect(() => {
     if (sessionExpired) {
       setLoginError('Sesja wygasła. Zaloguj się ponownie.');
       // Clean the URL
       window.history.replaceState(null, '', `/login?role=${role}`);
     }
   }, [sessionExpired, role]);

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    setLoginError(''); // Clear previous errors
    try {
      // Use the correct endpoint from the refactored backend
      const res = await axios.post(`${API_URL}/auth/login`, { ...values, role }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Odpowiedź serwera (Logowanie):', res.data); // Log for debug

      // Backend response structure: { status: 'success', data: { user: {...}, token: '...' } }
      if (res.data.status === 'success' && res.data.data?.token && res.data.data?.user) {
        const { token, user } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role);
        localStorage.setItem('userId', user.id);
        setRole(user.role); // Update App state
        navigate(`/dashboard/${user.role}`);
      } else {
        // Handle unexpected success response structure
        console.error('Unexpected login response structure:', res.data);
        setLoginError(res.data.message || 'Otrzymano nieoczekiwaną odpowiedź z serwera.');
        setErrors({ api: res.data.message || 'Otrzymano nieoczekiwaną odpowiedź z serwera.' });
      }
    } catch (err) {
      console.error('Błąd logowania:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Błąd logowania. Sprawdź dane lub połączenie.';
      setLoginError(errorMessage); // Set general error message
      setErrors({ api: errorMessage }); // Set formik error
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (values, { setSubmitting, setErrors, resetForm }) => {
    setLoginError(''); // Clear previous errors
    setForgotPasswordSuccess(''); // Clear previous success message
    try {
      // Use the correct endpoint
      await axios.post(`${API_URL}/auth/forgot-password`, { ...values, role }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      resetForm();
      setShowForgotPassword(false);
      setForgotPasswordSuccess('Jeśli konto istnieje, link do resetowania hasła został wysłany na Twój email.');
      // alert('Link do resetowania hasła został wysłany na Twój email.'); // Use state message instead
    } catch (err) {
      console.error('Błąd resetowania hasła:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Błąd wysyłania linku resetowania hasła';
      setLoginError(errorMessage); // Set general error message
      setErrors({ api: errorMessage }); // Set formik error
    } finally {
      setSubmitting(false);
    }
  };

  // Use AuthService functions for social login
  const handleSocialLoginClick = (provider) => {
    setLoginError(''); // Clear errors before redirecting
    if (provider === 'google') {
      googleLogin(role);
    } else if (provider === 'facebook') {
      facebookLogin(role);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Logowanie {role === 'provider' ? 'Usługodawcy' : role === 'admin' ? 'Administratora' : 'Zleceniodawcy'}
        </h2>

        {/* Display general errors or success messages */}
        {loginError && <p className="text-red-500 text-sm text-center mb-4">{loginError}</p>}
        {forgotPasswordSuccess && <p className="text-green-600 text-sm text-center mb-4">{forgotPasswordSuccess}</p>}

        {!showForgotPassword ? (
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors }) => (
              <Form className="flex flex-col gap-4">
                <div>
                  <Field
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="w-full p-3 rounded-lg border border-Grayscale-Gray60 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <ErrorMessage name="email" component="p" className="text-red-500 text-xs mt-1" />
                </div>
                <div>
                  <Field
                    type="password"
                    name="password"
                    placeholder="Hasło"
                    className="w-full p-3 rounded-lg border border-Grayscale-Gray60 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <ErrorMessage name="password" component="p" className="text-red-500 text-xs mt-1" />
                </div>
                {/* Formik error for API */}
                <ErrorMessage name="api" component="p" className="text-red-500 text-xs text-center" />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-sky-500 text-white py-3 rounded-lg font-bold hover:bg-sky-600 transition duration-300 disabled:opacity-50"
                >
                  {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
                </button>
                <p className="text-center text-sm text-Grayscale-Gray60 my-2">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setLoginError(''); setForgotPasswordSuccess(''); }}
                    className="underline text-sky-500 hover:text-sky-400"
                  >
                    Nie pamiętasz hasła?
                  </button>
                </p>
                <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t border-Grayscale-Gray40"></div>
                    <span className="flex-shrink mx-4 text-Grayscale-Gray60 text-sm">lub</span>
                    <div className="flex-grow border-t border-Grayscale-Gray40"></div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialLoginClick('google')}
                    className="bg-white text-black py-3 rounded-lg font-bold border border-Grayscale-Gray40 flex justify-center items-center gap-2 hover:bg-neutral-100 transition duration-300"
                  >
                    <img src={GoogleIcon} alt="Google" className="w-5 h-5" />
                    Zaloguj się przez Google
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLoginClick('facebook')}
                    className="bg-blue-600 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition duration-300"
                  >
                    <img src={FacebookIcon} alt="Facebook" className="w-5 h-5" />
                    Zaloguj się przez Facebook
                  </button>
                </div>
                <p className="text-center text-sm text-Grayscale-Gray60 mt-4">
                  Nie masz konta?{' '}
                  <Link
                    // Navigate to the correct registration page based on role
                    to={role === 'provider' ? '/register/provider' : '/register/client'}
                    className="underline text-sky-500 hover:text-sky-400"
                  >
                    Zarejestruj się
                  </Link>
                </p>
                <p className="text-center text-sm text-Grayscale-Gray60 mt-2">
                  <Link to="/" className="underline text-sky-500 hover:text-sky-400">
                    Wróć do strony głównej
                  </Link>
                </p>
              </Form>
            )}
          </Formik>
        ) : (
          // Forgot Password Form
          <Formik
            initialValues={{ email: '' }}
            validationSchema={forgotPasswordSchema}
            onSubmit={handleForgotPassword}
          >
            {({ isSubmitting, errors }) => (
              <Form className="flex flex-col gap-4">
                 <p className="text-sm text-Grayscale-Gray60 text-center">Wprowadź swój adres email, aby otrzymać link do resetowania hasła.</p>
                <div>
                  <Field
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="w-full p-3 rounded-lg border border-Grayscale-Gray60 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <ErrorMessage name="email" component="p" className="text-red-500 text-xs mt-1" />
                </div>
                 {/* Formik error for API */}
                 <ErrorMessage name="api" component="p" className="text-red-500 text-xs text-center" />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-sky-500 text-white py-3 rounded-lg font-bold hover:bg-sky-600 transition duration-300 disabled:opacity-50"
                >
                  {isSubmitting ? 'Wysyłanie...' : 'Wyślij link resetowania'}
                </button>
                <p className="text-center text-sm text-Grayscale-Gray60 mt-4">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setLoginError(''); setForgotPasswordSuccess(''); }}
                    className="underline text-sky-500 hover:text-sky-400"
                  >
                    Wróć do logowania
                  </button>
                </p>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
}

export default Login;
