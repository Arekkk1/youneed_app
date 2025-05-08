import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../api'; // Use the centralized api instance
import { toast } from 'react-hot-toast';
import { Mail, Lock, User as UserIcon, Phone, CheckSquare, Square, Loader2, Home } from 'lucide-react';
import logo from '../../assets/youneed_logo_black.png';

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
  street: Yup.string().optional().trim(),
  city: Yup.string().optional().trim(),
  zipCode: Yup.string().optional().trim().matches(/^[0-9]{2}-[0-9]{3}$/, 'Nieprawidłowy format kodu pocztowego (np. 00-000)'),
  country: Yup.string().optional().trim(),
  acceptTerms: Yup.boolean().oneOf([true], 'Akceptacja regulaminu jest wymagana'),
  marketingConsent: Yup.boolean(),
  partnerConsent: Yup.boolean(),
});

function Registration() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState(''); // Used for toasts

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    const registrationToast = toast.loading('Rejestrowanie...');

    const registrationData = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      phone: values.phone,
      role: 'client',
      address: {
          street: values.street || null,
          city: values.city || null,
          zipCode: values.zipCode || null,
          country: values.country || null,
      },
      terms: {
          acceptTerms: values.acceptTerms,
          marketingConsent: values.marketingConsent,
          partnerConsent: values.partnerConsent,
      },
    };

    console.log("Sending registration data:", registrationData);

    try {
      const response = await api.post('/auth/register', registrationData);
      console.log("Registration response:", response);

      if (response.data.status === 'success') {
        toast.success('Rejestracja pomyślna! Możesz się teraz zalogować.', { id: registrationToast, duration: 4000 });
        navigate('/login?role=client');
      } else {
         if (response.data?.errors) {
             const errorMessages = response.data.errors.map(e => e.msg).join(' ');
             throw new Error(errorMessages || response.data.message || 'Nie udało się zarejestrować');
         } else {
             throw new Error(response.data.message || 'Nie udało się zarejestrować');
         }
      }
    } catch (err) {
      console.error("Błąd rejestracji (obiekt błędu):", err);
      if (err.response) {
          console.error("Backend error response (data):", err.response.data);
      }

      let primaryErrorMessage = 'Wystąpił błąd podczas rejestracji.';
      if (err.response?.data?.message) {
          primaryErrorMessage = err.response.data.message;
      } else if (err.message) {
          // For Axios errors, err.message might be "Request failed with status code 400"
          // We prefer the backend's specific message if available.
          if (err.response?.data?.message) {
            primaryErrorMessage = err.response.data.message;
          } else {
            primaryErrorMessage = err.message; // Fallback to Axios or generic error message
          }
      }
      
      const backendValidationErrors = err.response?.data?.errors;
      let formErrorsToSet = { api: primaryErrorMessage }; // Default to a general API error

      if (backendValidationErrors && Array.isArray(backendValidationErrors) && backendValidationErrors.length > 0) {
          const specificFieldErrors = {};
          let unmappedErrorMessages = '';

          backendValidationErrors.forEach(e => {
              const field = e.path || e.param; // 'path' is common, 'param' is fallback
              const msg = e.msg || 'Nieprawidłowa wartość.';

              if (field && typeof field === 'string') {
                  if (field === 'email') specificFieldErrors.email = msg;
                  else if (field === 'password') specificFieldErrors.password = msg;
                  else if (field === 'phone') specificFieldErrors.phone = msg;
                  else if (field === 'firstName') specificFieldErrors.firstName = msg;
                  else if (field === 'lastName') specificFieldErrors.lastName = msg;
                  else if (field === 'terms.acceptTerms') specificFieldErrors.acceptTerms = msg;
                  else if (field === 'address.street') specificFieldErrors.street = msg;
                  else if (field === 'address.city') specificFieldErrors.city = msg;
                  else if (field === 'address.zipCode') specificFieldErrors.zipCode = msg;
                  else if (field === 'address.country') specificFieldErrors.country = msg;
                  else {
                      unmappedErrorMessages += `${msg} `;
                  }
              } else {
                  unmappedErrorMessages += `${msg} `;
              }
          });

          if (Object.keys(specificFieldErrors).length > 0) {
              formErrorsToSet = { ...specificFieldErrors };
              if (unmappedErrorMessages.trim()) {
                  formErrorsToSet.api = `${unmappedErrorMessages.trim()} ${primaryErrorMessage}`.trim();
              }
          } else if (unmappedErrorMessages.trim()) {
              formErrorsToSet.api = `${unmappedErrorMessages.trim()} ${primaryErrorMessage}`.trim();
          }
          // If no specific errors and no unmapped errors, formErrorsToSet remains { api: primaryErrorMessage }
      }
      
      console.log("Setting Formik errors:", formErrorsToSet);
      if (typeof setErrors === 'function') {
        setErrors(formErrorsToSet);
      } else {
        console.error("setErrors is not a function. This is unexpected.");
      }
      
      const toastErrorMessage = formErrorsToSet.api || primaryErrorMessage;
      // setApiError(toastErrorMessage); // This state is mainly for toasts, toast.error handles it directly.
                                     // Keeping it might be redundant if toast is the only consumer.
                                     // For now, let's rely on the direct toast message.

      toast.error(`Błąd: ${toastErrorMessage}`, { id: registrationToast, duration: 5000 });

    } finally {
      if (typeof setSubmitting === 'function') {
        setSubmitting(false);
      } else {
        console.error("setSubmitting is not a function. This is unexpected.");
      }
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

          <Formik
            initialValues={{
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              password: '',
              confirmPassword: '',
              street: '',
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
                        className={`pl-10 block w-full rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.firstName && touched.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
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
                        className={`pl-10 block w-full rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.lastName && touched.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
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
                      className={`pl-10 block w-full rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.email && touched.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
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
                      className={`pl-10 block w-full rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.phone && touched.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
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
                                    className={`pl-10 block w-full rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.street && touched.street ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
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
                                    className={`block w-full rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.city && touched.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
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
                                    className={`block w-full rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.zipCode && touched.zipCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
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
                                    className={`block w-full rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.country && touched.country ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
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
                      className={`pl-10 block w-full rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.password && touched.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                  </div>
                  <ErrorMessage name="password" component="p" className="mt-1 text-xs text-red-500" />
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
                      className={`pl-10 block w-full rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                  </div>
                  <ErrorMessage name="confirmPassword" component="p" className="mt-1 text-xs text-red-500" />
                </div>

                {/* Consents */}
                <div className="space-y-3">
                  <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                       <Field
                           type="checkbox"
                           id="acceptTerms"
                           name="acceptTerms"
                           className="hidden"
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
                     <ErrorMessage name="acceptTerms" component="p" className="mt-1 text-xs text-red-500 absolute left-0 top-full" />
                  </div>

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

                 {/* 
                    API Error for Formik - TYMCZASOWO ZAKOMENTOWANE DO CELÓW DIAGNOSTYCZNYCH
                    Jeśli błąd 'formik is not defined' zniknie, problem leży w tym komponencie
                    lub jego interakcji ze stanem Formika.
                 */}
                 {/* <ErrorMessage name="api" component="p" className="text-red-500 text-sm text-center mt-2" /> */}
                 {errors.api && (
                    <p className="text-red-500 text-sm text-center mt-2">{errors.api}</p>
                 )}


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
