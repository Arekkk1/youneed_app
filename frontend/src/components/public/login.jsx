import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../api'; // Import scentralizowanej instancji API
import GoogleIcon from '../../assets/icon/Google.svg';
import FacebookIcon from '../../assets/icon/Facebook.svg';
import { googleLogin, facebookLogin } from '../../services/AuthService'; // Poprawny import
import { useAuth } from '../../context/AuthContext'; // Import useAuth

// Logowanie VITE_API_URL dla debugowania (może być usunięte po weryfikacji)
console.log('[Login.jsx DEBUG] VITE_API_URL from import.meta.env:', import.meta.env.VITE_API_URL);

// Schemat walidacji dla logowania
const validationSchema = Yup.object({
  email: Yup.string().email('Nieprawidłowy email').required('Email jest wymagany'),
  password: Yup.string().required('Hasło jest wymagane'),
});

// Schemat walidacji dla resetowania hasła
const forgotPasswordSchema = Yup.object({
  email: Yup.string().email('Nieprawidłowy email').required('Email jest wymagany'),
});

function Login({ setRole }) { // setRole is a prop from App.jsx
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth(); // Get auth context methods
  const params = new URLSearchParams(location.search);
  const roleFromUrl = params.get('role');
  const sessionExpired = params.get('sessionExpired');
  const [role, setLocalRole] = useState(roleFromUrl || localStorage.getItem('role') || 'client');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');

  useEffect(() => {
    if (roleFromUrl) {
      setLocalRole(roleFromUrl);
      localStorage.setItem('role', roleFromUrl);
    }
  }, [roleFromUrl]);

  useEffect(() => {
    if (sessionExpired) {
      setLoginError('Sesja wygasła. Zaloguj się ponownie.');
      const currentQuery = new URLSearchParams(location.search);
      currentQuery.delete('sessionExpired');
      navigate(`${location.pathname}?${currentQuery.toString()}`, { replace: true });
    }
  }, [sessionExpired, location.search, location.pathname, navigate]);

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    setLoginError('');
    // Endpoint jest teraz ścieżką względną do baseURL zdefiniowanego w api.js
    const loginEndpoint = '/auth/login';
    console.log('[Login.jsx DEBUG] Attempting to login to endpoint:', loginEndpoint, 'with base URL from api.js');

    try {
      // Użycie scentralizowanej instancji api
      const res = await api.post(loginEndpoint, { ...values, role });
      console.log('[Login.jsx DEBUG] Odpowiedź serwera (Logowanie):', res.data);

      if (res.data.status === 'success' && res.data.data?.token && res.data.data?.user) {
        const { token: tokenValue, user: userData } = res.data.data;
        console.log('[Login.jsx DEBUG] Login successful. User data from backend:', JSON.stringify(userData, null, 2));
        console.log('[Login.jsx DEBUG] User role from backend:', userData.role);

        await auth.login(userData, tokenValue);
        console.log('[Login.jsx DEBUG] auth.login() from AuthContext called.');
        console.log('[Login.jsx DEBUG] localStorage role after auth.login():', localStorage.getItem('role'));
        console.log('[Login.jsx DEBUG] localStorage token after auth.login():', localStorage.getItem('token') ? 'Present' : 'Absent');

        if (typeof setRole === 'function') {
            setRole(userData.role);
            console.log('[Login.jsx DEBUG] App.jsx role state updated via setRole prop.');
        } else {
            console.warn('[Login.jsx DEBUG] setRole prop is not a function.');
        }

        console.log(`[Login.jsx DEBUG] Navigating to: /dashboard/${userData.role}`);
        navigate(`/dashboard/${userData.role}`);
      } else {
        const errorMessage = res.data.message || 'Otrzymano nieoczekiwaną odpowiedź z serwera.';
        console.error('[Login.jsx DEBUG] Unexpected login response structure:', res.data);
        setLoginError(errorMessage);
        setErrors({ api: errorMessage });
      }
    } catch (err) {
      console.error('[Login.jsx DEBUG] Błąd logowania:', err.response?.data || err.message, err);
      const errorMessage = err.response?.data?.message || 'Błąd logowania. Sprawdź dane lub połączenie.';
      setLoginError(errorMessage);
      setErrors({ api: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (values, { setSubmitting, setErrors, resetForm }) => {
    setLoginError('');
    setForgotPasswordSuccess('');
    // Endpoint jest teraz ścieżką względną do baseURL zdefiniowanego w api.js
    const forgotPasswordEndpoint = '/auth/forgot-password';
    console.log('[Login.jsx DEBUG] Attempting forgot password to endpoint:', forgotPasswordEndpoint, 'with base URL from api.js');

    try {
      // Użycie scentralizowanej instancji api
      await api.post(forgotPasswordEndpoint, { ...values, role });
      resetForm();
      setShowForgotPassword(false);
      setForgotPasswordSuccess('Jeśli konto istnieje, link do resetowania hasła został wysłany na Twój email.');
    } catch (err) {
      console.error('Błąd resetowania hasła:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Błąd wysyłania linku resetowania hasła';
      setLoginError(errorMessage);
      setErrors({ api: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialLoginClick = (provider) => {
    setLoginError('');
    // Funkcje googleLogin i facebookLogin pochodzą z AuthService i używają VITE_API_URL
    // który powinien być teraz poprawnie ustawiony na https://api.youneed.com.pl/api
    if (provider === 'google') {
      googleLogin(role); // Wywołanie funkcji z AuthService
    } else if (provider === 'facebook') {
      facebookLogin(role); // Wywołanie funkcji z AuthService
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Logowanie {role === 'provider' ? 'Usługodawcy' : role === 'admin' ? 'Administratora' : 'Zleceniodawcy'}
        </h2>

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
