import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom'; // Added Link
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../api'; // Use the centralized api instance
import { toast } from 'react-hot-toast'; // Use toast for notifications

const validationSchema = Yup.object({
  newPassword: Yup.string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .required('Nowe hasło jest wymagane'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Hasła muszą się zgadzać')
    .required('Potwierdzenie hasła jest wymagane'),
});

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const email = params.get('email');
  const role = params.get('role');
  const token = params.get('token');
  const [apiError, setApiError] = useState('');

  if (!email || !role || !token) {
    // Consider redirecting or showing a more user-friendly message
    return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                 <h2 className="text-2xl font-bold mb-6 text-red-600">Błąd Linku</h2>
                 <p className="text-gray-700 mb-4">Link do resetowania hasła jest nieprawidłowy lub wygasł.</p>
                 <p className="text-gray-700">Spróbuj ponownie poprosić o reset hasła na stronie logowania.</p>
                 <Link to="/login" className="mt-6 inline-block bg-sky-500 text-white py-2 px-4 rounded-lg font-bold hover:bg-sky-600 duration-300">
                    Wróć do Logowania
                 </Link>
            </div>
        </div>
    );
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    setApiError(''); // Clear previous errors
    const toastId = toast.loading('Resetowanie hasła...');
    try {
      // Use the centralized api instance
      // Backend endpoint /auth/reset-password MUST handle the 'role' correctly
      await api.post('/auth/reset-password', {
        email,
        role,
        token,
        newPassword: values.newPassword,
      });
      toast.success('Hasło zostało pomyślnie zresetowane. Możesz teraz się zalogować.', { id: toastId });
      navigate(`/login?role=${role}`); // Navigate to the correct login page
    } catch (err) {
      const message = err.response?.data?.message || 'Błąd podczas resetowania hasła. Sprawdź link lub spróbuj ponownie.';
      console.error("Reset Password Error:", err.response || err);
      setApiError(message);
      toast.error(message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Resetowanie hasła</h2>
        <p className="text-sm text-center text-gray-600 mb-4">Wprowadź nowe hasło dla konta: <span className="font-medium">{email}</span> ({role === 'provider' ? 'Usługodawca' : 'Klient'}).</p>
        <Formik
          initialValues={{ newPassword: '', confirmPassword: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="flex flex-col gap-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">Nowe hasło</label>
                <Field
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  placeholder="Minimum 8 znaków"
                  className={`w-full p-3 rounded-lg border ${errors.newPassword && touched.newPassword ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent`}
                />
                <ErrorMessage name="newPassword" component="p" className="text-red-600 text-xs mt-1" />
              </div>
              <div>
                 <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Potwierdź hasło</label>
                <Field
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Wpisz ponownie nowe hasło"
                  className={`w-full p-3 rounded-lg border ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent`}
                />
                <ErrorMessage name="confirmPassword" component="p" className="text-red-600 text-xs mt-1" />
              </div>
              {apiError && <p className="text-red-600 text-sm text-center bg-red-100 p-2 rounded">{apiError}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-sky-500 text-white py-3 rounded-lg font-bold hover:bg-sky-600 duration-300 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Resetowanie...' : 'Zresetuj hasło'}
              </button>
              <p className="text-center text-sm text-gray-600 mt-4">
                Pamiętasz hasło?{' '}
                <Link to={`/login?role=${role}`} className="underline text-sky-600 hover:text-sky-500">
                  Wróć do logowania
                </Link>
              </p>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default ResetPassword;
