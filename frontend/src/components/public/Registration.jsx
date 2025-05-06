import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../api'; // Use the centralized api instance
import { toast } from 'react-hot-toast';
import { Mail, Lock, User as UserIcon, Phone, CheckSquare, Square, Loader2, Home } from 'lucide-react'; // Added Home icon
import logo from '../../assets/youneed_logo_black.png'; // Adjust path if needed

// Validation Schema for Client Registration
const ClientRegistrationSchema = Yup.object().shape({
  firstName: Yup.string().required('Imię jest wymagane'),
  lastName: Yup.string().required('Nazwisko jest wymagane'),
  email: Yup.string().email('Nieprawidłowy format email').required('Email jest wymagany'),
  phone: Yup.string()
      .matches(/^[0-9]{9}$/, 'Numer telefonu musi składać się z 9 cyfr')
      .required('Numer telefonu jest wymagany'),
  password: Yup.string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .matches(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną wielką literę')
    .matches(/[a-z]/, 'Hasło musi zawierać co najmniej jedną małą literę')
    .matches(/[0-9]/, 'Hasło musi zawierać co najmniej jedną cyfrę')
    .matches(/[\W_]/, 'Hasło musi zawierać co najmniej jeden znak specjalny')
    .required('Hasło jest wymagane'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Hasła muszą być takie same')
    .required('Potwierdzenie hasła jest wymagane'),
  // Address fields (make them optional or required as needed)
  street: Yup.string().optional().trim(),
  city: Yup.string().optional().trim(),
  zipCode: Yup.string().optional().trim().matches(/^[0-9]{2}-[0-9]{3}$/, 'Nieprawidłowy format kodu pocztowego (np. 00-000)'),
  country: Yup.string().optional().trim(),
  // Consents
  acceptTerms: Yup.boolean().oneOf([true], 'Akceptacja regulaminu jest wymagana'),
  marketingConsent: Yup.boolean(),
  partnerConsent: Yup.boolean(),
});

function Registration() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    setApiError('');
    const registrationToast = toast.loading('Rejestrowanie...');

    // Prepare data structure expected by backend validation
    const registrationData = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      phone: values.phone, // Send phone number
      role: 'client', // Explicitly set role for client registration
      // Address object
      address: {
          street: values.street || null, // Send null if empty
          city: values.city || null,
          zipCode: values.zipCode || null,
          country: values.country || null,
      },
      // Nested terms object as expected by backend validation
      terms: {
          acceptTerms: values.acceptTerms,
          marketingConsent: values.marketingConsent,
          partnerConsent: values.partnerConsent,
      },
      // Other fields (not needed for client registration via this form)
      // industry: null,
      // companyName: null,
      // tutorial: false,
    };

    console.log("Sending registration data:", registrationData); // Debug log

    try {
      // Use the standard registration endpoint
      const response = await api.post('/auth/register', registrationData);
      console.log("Registration response:", response); // Debug log

      if (response.data.status === 'success') {
        toast.success('Rejestracja pomyślna! Możesz się teraz zalogować.', { id: registrationToast, duration: 4000 });
        navigate('/login?role=client');
      } else {
         // Handle specific backend errors if available
         if (response.data?.errors) {
             const errorMessages = response.data.errors.map(e => e.msg).join(' ');
             throw new Error(errorMessages || response.data.message || 'Nie udało się zarejestrować');
         } else {
             throw new Error(response.data.message || 'Nie udało się zarejestrować');
         }
      }
    } catch (err) {
      console.error("Błąd rejestracji:", err);
      // Log the detailed error response if available
      if (err.response) {
          console.error("Backend error response:", err.response.data);
      }
      const message = err.response?.data?.message || err.message || 'Wystąpił błąd podczas rejestracji.';
      const validationErrors = err.response?.data?.errors; // Get validation errors array

      setApiError(message);

      // Map backend validation errors to Formik fields if possible
      if (validationErrors && Array.isArray(validationErrors)) {
          const formikErrors = {};
          let generalErrorMessage = message; // Default to general message

          validationErrors.forEach(e => {
              // Map specific known paths
              if (e.path === 'email') formikErrors.email = e.msg;
              else if (e.path === 'password') formikErrors.password = e.msg;
              else if (e.path === 'phone') formikErrors.phone = e.msg;
              else if (e.path === 'firstName') formikErrors.firstName = e.msg;
              else if (e.path === 'lastName') formikErrors.lastName = e.msg;
              else if (e.path === 'terms.acceptTerms') formikErrors.acceptTerms = e.msg;
              // Add mappings for address fields if backend validates them
              else if (e.path === 'address.street') formikErrors.street = e.msg;
              else if (e.path === 'address.city') formikErrors.city = e.msg;
              else if (e.path === 'address.zipCode') formikErrors.zipCode = e.msg;
              else if (e.path === 'address.country') formikErrors.country = e.msg;
              else {
                  // Collect unmapped errors for a general message
                  if (!formikErrors.api) formikErrors.api = '';
                  formikErrors.api += `${e.msg}. `;
              }
          });

          // If specific errors were mapped, use those primarily
          if (Object.keys(formikErrors).length > 0) {
              setErrors(formikErrors);
              // Update the general API error message to be more specific if possible
              generalErrorMessage = formikErrors.api || 'Popraw błędy w formularzu.';
              setApiError(generalErrorMessage); // Update the displayed general error
          } else {
               setErrors({ api: message }); // Set general formik error if specific mapping fails
          }

          toast.error(`Błąd rejestracji: ${generalErrorMessage}`, { id: registrationToast });

      } else {
          // If no specific validation errors array, show the general message
          setErrors({ api: message }); // Set general formik error
          toast.error(`Błąd rejestracji: ${message}`, { id: registrationToast });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-sky-900 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex justify-center mb-8">
            <img src={logo} alt="YouNeed Logo" className="h-14 w-auto" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">
            Zarejestruj się jako Klient
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Znajdź najlepszych specjalistów w swojej okolicy.
          </p>

          {apiError && !formik.errors.api && ( // Show general API error only if no specific formik API error is set
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {apiError}
            </div>
          )}

          <Formik
            initialValues={{
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              password: '',
              confirmPassword: '',
              street: '', // Address fields
              city: '',
              zipCode: '',
              country: '',
              acceptTerms: false,
              marketingConsent: false,
              partnerConsent: false,
            }}
            validationSchema={ClientRegistrationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched, values, setFieldValue }) => (
              <Form className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imię*</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        type="text"
                        name="firstName"
                        id="firstName"
                        placeholder="Jan"
                        className={`pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.firstName && touched.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      />
                    </div>
                    <ErrorMessage name="firstName" component="p" className="mt-1 text-xs text-red-500" />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nazwisko*</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <UserIcon className="h-5 w-5 text-gray-400" />
                       </div>
                      <Field
                        type="text"
                        name="lastName"
                        id="lastName"
                        placeholder="Kowalski"
                        className={`pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.lastName && touched.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      />
                    </div>
                    <ErrorMessage name="lastName" component="p" className="mt-1 text-xs text-red-500" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email*</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Field
                      type="email"
                      name="email"
                      id="email"
                      placeholder="twoj@email.com"
                      className={`pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.email && touched.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                  </div>
                  <ErrorMessage name="email" component="p" className="mt-1 text-xs text-red-500" />
                </div>

                 {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon*</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <Field
                      type="tel"
                      name="phone"
                      id="phone"
                      placeholder="123456789"
                      className={`pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.phone && touched.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                  </div>
                  <ErrorMessage name="phone" component="p" className="mt-1 text-xs text-red-500" />
                </div>

                {/* Address Section */}
                <fieldset className="border border-gray-300 dark:border-gray-600 rounded-md p-4">
                    <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">Adres (opcjonalnie)</legend>
                    <div className="space-y-4">
                        {/* Street */}
                        <div>
                            <label htmlFor="street" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ulica i numer</label>
                            <div className="relative">
                                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Field
                                    type="text"
                                    name="street"
                                    id="street"
                                    placeholder="ul. Przykładowa 10/5"
                                    className={`pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.street && touched.street ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                />
                            </div>
                            <ErrorMessage name="street" component="p" className="mt-1 text-xs text-red-500" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* City */}
                            <div>
                                <label htmlFor="city" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Miasto</label>
                                <Field
                                    type="text"
                                    name="city"
                                    id="city"
                                    placeholder="Warszawa"
                                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.city && touched.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                />
                                <ErrorMessage name="city" component="p" className="mt-1 text-xs text-red-500" />
                            </div>
                            {/* Zip Code */}
                            <div>
                                <label htmlFor="zipCode" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kod pocztowy</label>
                                <Field
                                    type="text"
                                    name="zipCode"
                                    id="zipCode"
                                    placeholder="00-001"
                                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.zipCode && touched.zipCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                />
                                <ErrorMessage name="zipCode" component="p" className="mt-1 text-xs text-red-500" />
                            </div>
                            {/* Country */}
                            <div>
                                <label htmlFor="country" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kraj</label>
                                <Field
                                    type="text"
                                    name="country"
                                    id="country"
                                    placeholder="Polska"
                                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.country && touched.country ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                />
                                <ErrorMessage name="country" component="p" className="mt-1 text-xs text-red-500" />
                            </div>
                        </div>
                    </div>
                </fieldset>


                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hasło*</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Field
                      type="password"
                      name="password"
                      id="password"
                      placeholder="••••••••"
                      className={`pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.password && touched.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                  </div>
                  <ErrorMessage name="password" component="p" className="mt-1 text-xs text-red-500" />
                   {/* Display password requirements helper text */}
                   {(!errors.password || !touched.password) && (
                       <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                           Min. 8 znaków, duża/mała litera, cyfra, znak specjalny.
                       </p>
                   )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Potwierdź Hasło*</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Field
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      placeholder="••••••••"
                      className={`pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                  </div>
                  <ErrorMessage name="confirmPassword" component="p" className="mt-1 text-xs text-red-500" />
                </div>

                {/* Consents */}
                <div className="space-y-3">
                  {/* Terms */}
                  <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                       <Field
                           type="checkbox"
                           id="acceptTerms"
                           name="acceptTerms"
                           className="hidden" // Hide default checkbox
                       />
                       <label
                           htmlFor="acceptTerms"
                           className={`flex items-center cursor-pointer ${errors.acceptTerms && touched.acceptTerms ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}
                       >
                           {values.acceptTerms ? (
                               <CheckSquare className="h-5 w-5 text-sky-600 mr-2 flex-shrink-0" />
                           ) : (
                               <Square className={`h-5 w-5 ${errors.acceptTerms && touched.acceptTerms ? 'text-red-500' : 'text-gray-400'} mr-2 flex-shrink-0`} />
                           )}
                           <span className="text-sm">
                               Akceptuję <Link to="/terms" target="_blank" className="font-medium text-sky-600 hover:text-sky-500">Regulamin*</Link> i <Link to="/privacy" target="_blank" className="font-medium text-sky-600 hover:text-sky-500">Politykę Prywatności*</Link>
                           </span>
                       </label>
                    </div>
                     {/* Display error message specifically for acceptTerms */}
                     <ErrorMessage name="acceptTerms" component="p" className="mt-1 text-xs text-red-500 absolute left-0 top-full" />
                  </div>

                  {/* Marketing */}
                  <div className="relative flex items-start">
                     <div className="flex h-6 items-center">
                       <Field
                           type="checkbox"
                           id="marketingConsent"
                           name="marketingConsent"
                           className="hidden"
                       />
                       <label
                           htmlFor="marketingConsent"
                           className="flex items-center cursor-pointer text-gray-700 dark:text-gray-300"
                       >
                           {values.marketingConsent ? (
                               <CheckSquare className="h-5 w-5 text-sky-600 mr-2 flex-shrink-0" />
                           ) : (
                               <Square className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                           )}
                           <span className="text-sm">Zgoda na przetwarzanie danych w celach marketingowych (opcjonalnie)</span>
                       </label>
                     </div>
                  </div>

                   {/* Partners */}
                  <div className="relative flex items-start">
                     <div className="flex h-6 items-center">
                       <Field
                           type="checkbox"
                           id="partnerConsent"
                           name="partnerConsent"
                           className="hidden"
                       />
                       <label
                           htmlFor="partnerConsent"
                           className="flex items-center cursor-pointer text-gray-700 dark:text-gray-300"
                       >
                           {values.partnerConsent ? (
                               <CheckSquare className="h-5 w-5 text-sky-600 mr-2 flex-shrink-0" />
                           ) : (
                               <Square className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                           )}
                           <span className="text-sm">Zgoda na otrzymywanie informacji od partnerów (opcjonalnie)</span>
                       </label>
                     </div>
                  </div>
                </div>

                 {/* API Error for Formik */}
                 <ErrorMessage name="api" component="p" className="text-red-500 text-sm text-center mt-2" />


                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                            Rejestrowanie...
                        </>
                    ) : (
                        'Zarejestruj się'
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Masz już konto?{' '}
            <Link to="/login" className="font-medium text-sky-600 hover:text-sky-500">
              Zaloguj się
            </Link>
          </p>
           <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
             Jesteś usługodawcą?{' '}
             <Link to="/register/provider" className="font-medium text-sky-600 hover:text-sky-500">
               Zarejestruj się tutaj
             </Link>
           </p>
        </div>
      </div>
    </div>
  );
}

export default Registration;
