import React, { useState, useEffect } from 'react';
        import PropTypes from 'prop-types';
        import { Formik, Form, Field, ErrorMessage } from 'formik';
        import * as Yup from 'yup';
        import toast from 'react-hot-toast'; // Import toast
        import api from '../../../api'; // Corrected path
        import { Mail, MessageSquare } from 'lucide-react'; // Icons

        // Validation schema - code is always required, phone only for SMS
        const validationSchema = Yup.object({
          verificationMethod: Yup.string().required(), // 'sms' or 'email'
          phoneNumber: Yup.string().when('verificationMethod', {
            is: 'sms',
            then: schema => schema
              .matches(/^\+48\d{9}$/, 'Numer telefonu musi być w formacie +48xxxxxxxxx')
              .required('Numer telefonu jest wymagany dla weryfikacji SMS'),
            otherwise: schema => schema.notRequired(),
          }),
          verificationCode: Yup.string() // Renamed from smsCode
            .matches(/^\d{6}$/, 'Kod weryfikacyjny musi składać się z 6 cyfr')
            .required('Kod weryfikacyjny jest wymagany'),
        });

        const Step3SmsCode = ({ formData, userId, onVerified, onPrevious }) => {
          const [verificationMethod, setVerificationMethod] = useState('sms'); // 'sms' or 'email'
          const [isCodeSent, setIsCodeSent] = useState(false);
          const [isLoading, setIsLoading] = useState(false);
          const [error, setError] = useState('');
          const [resendTimer, setResendTimer] = useState(0);

          // Fetch user's email from formData for display
          const userEmail = formData?.email || 'Nieznany email';

          useEffect(() => {
            let interval;
            if (resendTimer > 0) {
              interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
              }, 1000);
            }
            return () => clearInterval(interval);
          }, [resendTimer]);

          // Reset state when verification method changes
          useEffect(() => {
            setIsCodeSent(false);
            setError('');
            setResendTimer(0);
            // Optionally clear the code input field if desired
            // setFieldValue('verificationCode', ''); // Requires access to setFieldValue from Formik context
          }, [verificationMethod]);

          const handleSendCode = async (values) => {
            setIsLoading(true);
            setError('');
            setIsCodeSent(false); // Reset sent status on new attempt

            try {
              if (verificationMethod === 'sms') {
                const trimmedPhoneNumber = values.phoneNumber.replace(/\s+/g, '');
                if (!/^\+48\d{9}$/.test(trimmedPhoneNumber)) {
                  setError('Nieprawidłowy format numeru telefonu. Użyj +48xxxxxxxxx.');
                  setIsLoading(false);
                  return;
                }
                await api.post('/sms/send-code', { userId, phoneNumber: trimmedPhoneNumber });
                toast.success('Kod SMS został wysłany.'); // Use toast for feedback
              } else { // email
                // Backend gets email from userId, no need to send it
                await api.post('/email/send-code', { userId });
                toast.success('Kod weryfikacyjny został wysłany na email.'); // Use toast
              }
              setIsCodeSent(true);
              setResendTimer(60); // Start 60 second timer
            } catch (err) {
              const message = err.response?.data?.message || `Nie udało się wysłać kodu (${verificationMethod === 'sms' ? 'SMS' : 'Email'}). Sprawdź logi serwera.`; // Updated error message
              console.error(`Send ${verificationMethod === 'sms' ? 'SMS' : 'Email'} Error:`, err.response || err);
              setError(message);
              toast.error(message); // Show error in toast
              setIsCodeSent(false); // Ensure user can try again
            } finally {
              setIsLoading(false);
            }
          };

          const handleVerifyCode = async (values) => {
            const trimmedCode = values.verificationCode.replace(/\s+/g, '');
            if (!/^\d{6}$/.test(trimmedCode)) {
              setError('Kod weryfikacyjny musi składać się z 6 cyfr.');
              return;
            }

            setIsLoading(true);
            setError('');
            try {
              if (verificationMethod === 'sms') {
                await api.post('/sms/verify-code', { userId, code: trimmedCode });
              } else { // email
                await api.post('/email/verify-code', { userId, code: trimmedCode });
              }
              toast.success('Weryfikacja zakończona pomyślnie!');
              onVerified(); // Call parent's success handler to move to next step
            } catch (err) {
              const message = err.response?.data?.message || `Nieprawidłowy kod ${verificationMethod === 'sms' ? 'SMS' : 'Email'} lub błąd weryfikacji.`;
              console.error(`Verify ${verificationMethod === 'sms' ? 'SMS' : 'Email'} Error:`, err.response || err);
              setError(message);
              toast.error(message);
            } finally {
              setIsLoading(false);
            }
          };

          return (
            <Formik
              initialValues={{
                verificationMethod: 'sms',
                phoneNumber: formData.phoneNumber || '+48',
                verificationCode: '', // Renamed from smsCode
              }}
              validationSchema={validationSchema}
              onSubmit={handleVerifyCode} // Form submission triggers verification
              enableReinitialize // Allows initialValues to update if formData changes
            >
              {({ values, errors, touched, isSubmitting, setFieldValue }) => {
                // Update internal state when Formik's verificationMethod changes
                useEffect(() => {
                  setVerificationMethod(values.verificationMethod);
                }, [values.verificationMethod]);

                // Determine button disabled state for functionality
                const isVerifyButtonDisabled = !isCodeSent || isLoading || isSubmitting || !!errors.verificationCode || values.verificationCode.replace(/\s+/g, '').length !== 6;
                // Determine if the button should LOOK visually disabled (faded)
                const shouldVerifyButtonLookDisabled = !isCodeSent || !!errors.verificationCode || values.verificationCode.replace(/\s+/g, '').length !== 6;
                // Determine if send code button is disabled
                const isSendCodeDisabled = isLoading || isCodeSent || resendTimer > 0 ||
                                           (values.verificationMethod === 'sms' && (!!errors.phoneNumber || !values.phoneNumber.match(/^\+48\d{9}$/)));


                return (
                  <Form className="flex flex-col gap-4">
                    <p className="text-lg font-semibold text-center text-Grayscale-Gray10 mb-2">Weryfikacja Konta</p>
                    <p className="text-sm text-center text-Grayscale-Gray50 mb-4">
                      Wybierz metodę weryfikacji, aby kontynuować.
                    </p>

                    {/* Verification Method Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-Grayscale-Gray20 mb-2">Metoda Weryfikacji*</label>
                      <div role="group" aria-labelledby="verification-method-group" className="flex gap-4">
                        <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${values.verificationMethod === 'sms' ? 'bg-sky-900 border-sky-500 text-white' : 'bg-Grayscale-Gray70 border-Grayscale-Gray60 hover:bg-Grayscale-Gray60'}`}>
                          <Field type="radio" name="verificationMethod" value="sms" className="form-radio text-sky-500 focus:ring-sky-500" />
                          <MessageSquare size={18} />
                          SMS
                        </label>
                        <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${values.verificationMethod === 'email' ? 'bg-sky-900 border-sky-500 text-white' : 'bg-Grayscale-Gray70 border-Grayscale-Gray60 hover:bg-Grayscale-Gray60'}`}>
                          <Field type="radio" name="verificationMethod" value="email" className="form-radio text-sky-500 focus:ring-sky-500" />
                          <Mail size={18} />
                          Email
                        </label>
                      </div>
                    </div>

                    {/* Phone Number Input (Conditional) */}
                    {values.verificationMethod === 'sms' && (
                      <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Numer telefonu*</label>
                        <div className="flex gap-2">
                          <Field
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            placeholder="+48xxxxxxxxx"
                            disabled={isCodeSent || isLoading} // Disable after sending code
                            onBlur={(e) => { // Trim spaces on blur
                              const trimmedValue = e.target.value.replace(/\s+/g, '');
                              setFieldValue('phoneNumber', trimmedValue);
                            }}
                            className={`flex-grow px-4 py-2 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 ${errors.phoneNumber && touched.phoneNumber ? 'ring-red-500' : 'focus:ring-sky-500'} ${isCodeSent ? 'disabled:opacity-50' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleSendCode(values)} // Pass all values
                            disabled={isSendCodeDisabled}
                            className="btn bg-sky-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-sky-600 duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading && !isCodeSent ? 'Wysyłanie...' : (resendTimer > 0 ? `Wyślij ponownie (${resendTimer}s)` : 'Wyślij kod SMS')}
                          </button>
                        </div>
                        <ErrorMessage name="phoneNumber" component="p" className="text-red-500 text-xs mt-1" />
                      </div>
                    )}

                    {/* Email Display (Conditional) */}
                    {values.verificationMethod === 'email' && (
                      <div>
                        <label htmlFor="emailDisplay" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Adres Email</label>
                        <div className="flex gap-2">
                           <input
                             type="email"
                             id="emailDisplay"
                             name="emailDisplay"
                             value={userEmail}
                             readOnly
                             disabled
                             className="flex-grow px-4 py-2 rounded-lg bg-Grayscale-Gray80 text-Grayscale-Gray40 focus:outline-none ring-1 ring-Grayscale-Gray60 cursor-not-allowed"
                           />
                           <button
                             type="button"
                             onClick={() => handleSendCode(values)} // Pass all values
                             disabled={isSendCodeDisabled}
                             className="btn bg-sky-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-sky-600 duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                             {isLoading && !isCodeSent ? 'Wysyłanie...' : (resendTimer > 0 ? `Wyślij ponownie (${resendTimer}s)` : 'Wyślij kod Email')}
                           </button>
                        </div>
                         <p className="text-xs text-Grayscale-Gray50 mt-1">Kod zostanie wysłany na Twój zarejestrowany adres email.</p>
                      </div>
                    )}


                    {/* Verification Code Input (appears after code is sent) */}
                    {isCodeSent && (
                      <div className="mt-4">
                        <label htmlFor="verificationCode" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">
                          Kod Weryfikacyjny* ({values.verificationMethod === 'sms' ? 'z SMS' : 'z Email'})
                        </label>
                        <Field
                          type="text"
                          id="verificationCode"
                          name="verificationCode"
                          placeholder="xxxxxx"
                          maxLength="6" // Keep maxLength for direct input
                          disabled={isLoading}
                          onBlur={(e) => { // Trim spaces on blur
                            const trimmedValue = e.target.value.replace(/\s+/g, '');
                            setFieldValue('verificationCode', trimmedValue);
                          }}
                          onInput={(e) => { // Allow only digits and limit length conceptually
                             e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                             // Manually trigger validation if needed, Formik usually handles this
                             setFieldValue('verificationCode', e.target.value);
                          }}
                          className={`w-full px-4 py-2 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 ${errors.verificationCode && touched.verificationCode ? 'ring-red-500' : 'focus:ring-sky-500'}`}
                        />
                        <ErrorMessage name="verificationCode" component="p" className="text-red-500 text-xs mt-1" />
                      </div>
                    )}

                    {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}

                    <div className="flex justify-between mt-6">
                       <button
                          type="button"
                          onClick={onPrevious}
                          disabled={isLoading}
                          className="btn-lg bg-Grayscale-Gray60 text-white py-2 px-6 rounded-lg font-bold hover:bg-Grayscale-Gray50 duration-300 disabled:opacity-50"
                       >
                          Wstecz
                       </button>
                       {/* Verify button: functionally disabled based on isVerifyButtonDisabled, visually faded based on shouldVerifyButtonLookDisabled */}
                       <button
                          type="submit" // Submit the form to trigger handleVerifyCode
                          disabled={isVerifyButtonDisabled}
                          className={`
                            btn-lg bg-sky-500 text-white py-2 px-6 rounded-lg font-bold hover:bg-sky-600 duration-300
                            transition-opacity ease-in-out
                            ${shouldVerifyButtonLookDisabled ? 'opacity-50' : 'opacity-100'}
                            ${isVerifyButtonDisabled ? 'cursor-not-allowed' : ''}
                            ${(isLoading || isSubmitting) ? 'cursor-wait' : ''}
                          `}
                       >
                          {isLoading ? 'Weryfikowanie...' : 'Zweryfikuj i Kontynuuj'}
                       </button>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          );
        };

        Step3SmsCode.propTypes = {
          formData: PropTypes.object.isRequired, // Contains user's email, potentially phone
          userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, // User ID needed for API calls
          onVerified: PropTypes.func.isRequired, // Callback on successful verification
          onPrevious: PropTypes.func.isRequired,
        };

        export default Step3SmsCode;
