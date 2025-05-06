import React, { useState } from 'react';
import api from '../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Eye, EyeOff } from 'lucide-react'; // Icons for password visibility

// Password validation schema
const passwordValidationSchema = Yup.object({
  currentPassword: Yup.string().required('Aktualne hasło jest wymagane'),
  newPassword: Yup.string()
    .required('Nowe hasło jest wymagane')
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .matches(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną dużą literę')
    .matches(/[a-z]/, 'Hasło musi zawierać co najmniej jedną małą literę')
    .matches(/[0-9]/, 'Hasło musi zawierać co najmniej jedną cyfrę')
    .matches(/[\W_]/, 'Hasło musi zawierać co najmniej jeden znak specjalny'), // \W matches non-word characters (opposite of \w which is A-Za-z0-9_)
  confirmPassword: Yup.string()
    .required('Potwierdzenie hasła jest wymagane')
    .oneOf([Yup.ref('newPassword'), null], 'Hasła muszą być takie same'),
});

const ChangePasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Use the specific change-password endpoint
      await api.post('/profile/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      setSuccess('Hasło zostało zmienione pomyślnie!');
      toast.success('Hasło zmienione!');
      resetForm(); // Clear form fields
    } catch (err) {
      console.error("Password change error:", err);
      const message = err.response?.data?.message || err.message || 'Błąd zmiany hasła.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
      validationSchema={passwordValidationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, errors, touched }) => (
        <Form className="space-y-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Zmiana hasła</h3>
          {error && <p className="text-sm text-red-600 bg-red-100 dark:bg-red-900/30 p-2 rounded">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-100 dark:bg-green-900/30 p-2 rounded">{success}</p>}

          {/* Current Password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Aktualne hasło
            </label>
            <div className="relative mt-1">
              <Field
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                id="currentPassword"
                required
                className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none sm:text-sm dark:bg-gray-700 dark:text-white ${
                  errors.currentPassword && touched.currentPassword
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label={showCurrentPassword ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <ErrorMessage name="currentPassword" component="p" className="mt-1 text-xs text-red-600 dark:text-red-400" />
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Nowe hasło
            </label>
             <div className="relative mt-1">
              <Field
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                id="newPassword"
                required
                className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none sm:text-sm dark:bg-gray-700 dark:text-white ${
                  errors.newPassword && touched.newPassword
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500'
                }`}
              />
               <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label={showNewPassword ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <ErrorMessage name="newPassword" component="p" className="mt-1 text-xs text-red-600 dark:text-red-400" />
            {/* Optional: Display password requirements */}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Musi zawierać min. 8 znaków, dużą i małą literę, cyfrę oraz znak specjalny.
            </p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Potwierdź nowe hasło
            </label>
             <div className="relative mt-1">
              <Field
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                id="confirmPassword"
                required
                className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none sm:text-sm dark:bg-gray-700 dark:text-white ${
                  errors.confirmPassword && touched.confirmPassword
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500'
                }`}
              />
               <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label={showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <ErrorMessage name="confirmPassword" component="p" className="mt-1 text-xs text-red-600 dark:text-red-400" />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
            >
              {isLoading || isSubmitting ? 'Zmienianie...' : 'Zmień hasło'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default ChangePasswordForm;
