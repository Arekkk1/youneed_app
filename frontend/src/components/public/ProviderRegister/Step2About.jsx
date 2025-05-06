import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';

// Validation for fields collected in THIS step + terms
const validationSchema = Yup.object({
  firstName: Yup.string().required('Imię jest wymagane'),
  lastName: Yup.string().required('Nazwisko jest wymagane'),
  companyName: Yup.string().required('Nazwa firmy jest wymagana'), // Assuming company name is required for providers
  acceptTerms: Yup.boolean().oneOf([true], 'Akceptacja regulaminu jest wymagana'),
  marketingConsent: Yup.boolean(),
  partnerConsent: Yup.boolean(),
});

const Step2About = ({ formData, onSubmitRegistration, onPrevious }) => {

  // Helper function to find a specific backend validation error message
  const getBackendError = (backendErrors, path) => {
    if (!backendErrors || !Array.isArray(backendErrors)) {
      return null;
    }
    return backendErrors.find(err => err.path === path)?.msg || null;
  };

  const handleSubmit = (values, { setSubmitting }) => {
    // Call the main registration handler passed from the parent
    onSubmitRegistration({
        firstName: values.firstName,
        lastName: values.lastName,
        companyName: values.companyName,
        acceptTerms: values.acceptTerms,
        marketingConsent: values.marketingConsent,
        partnerConsent: values.partnerConsent,
    }).finally(() => {
        // Ensure submitting state is reset even if parent handler has async logic
        setSubmitting(false);
    });
  };

  return (
    <Formik
      initialValues={{
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        companyName: formData.companyName || '',
        acceptTerms: formData.acceptTerms || false,
        marketingConsent: formData.marketingConsent || false,
        partnerConsent: formData.partnerConsent || false,
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize // Important to update initialValues if formData changes
    >
      {({ isSubmitting, errors, touched }) => {
        // Get backend errors for specific fields after potential submission attempt
        const backendErrorFirstName = getBackendError(formData.backendErrors, 'firstName');
        const backendErrorLastName = getBackendError(formData.backendErrors, 'lastName');
        const backendErrorCompanyName = getBackendError(formData.backendErrors, 'companyName');
        const backendErrorAcceptTerms = getBackendError(formData.backendErrors, 'terms.acceptTerms');
        // Add others if needed (e.g., marketingConsent, partnerConsent if backend validates them)

        return (
          <Form className="flex flex-col gap-4">
            <p className="text-sm text-center text-Grayscale-Gray50 mb-2">Uzupełnij swoje dane i zaakceptuj warunki.</p>

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Imię*</label>
              <Field
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Jan"
                // Apply error ring if Yup error OR backend error exists
                className={`w-full px-4 py-2 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 ${
                  (errors.firstName && touched.firstName) || backendErrorFirstName
                    ? 'ring-red-500 border-red-500' // Add border for consistency
                    : 'focus:ring-sky-500 border-transparent' // Ensure border is managed
                } border`} // Add base border class
              />
              {/* Show Yup error OR backend error */}
              <ErrorMessage name="firstName" component="p" className="text-red-500 text-xs mt-1" />
              {backendErrorFirstName && !(errors.firstName && touched.firstName) && (
                <p className="text-red-500 text-xs mt-1">{backendErrorFirstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Nazwisko*</label>
              <Field
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Kowalski"
                className={`w-full px-4 py-2 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 ${
                  (errors.lastName && touched.lastName) || backendErrorLastName
                    ? 'ring-red-500 border-red-500'
                    : 'focus:ring-sky-500 border-transparent'
                } border`}
              />
              <ErrorMessage name="lastName" component="p" className="text-red-500 text-xs mt-1" />
              {backendErrorLastName && !(errors.lastName && touched.lastName) && (
                <p className="text-red-500 text-xs mt-1">{backendErrorLastName}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Nazwa Firmy*</label>
              <Field
                type="text"
                id="companyName"
                name="companyName"
                placeholder="Jan Kowalski Usługi Remontowe"
                className={`w-full px-4 py-2 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 ${
                  (errors.companyName && touched.companyName) || backendErrorCompanyName
                    ? 'ring-red-500 border-red-500'
                    : 'focus:ring-sky-500 border-transparent'
                } border`}
              />
              <ErrorMessage name="companyName" component="p" className="text-red-500 text-xs mt-1" />
              {backendErrorCompanyName && !(errors.companyName && touched.companyName) && (
                <p className="text-red-500 text-xs mt-1">{backendErrorCompanyName}</p>
              )}
            </div>

            {/* Terms and Consents */}
            <div className="flex flex-col gap-3 text-xs text-Grayscale-Gray50 mt-4">
              {/* Accept Terms */}
              <div className="flex flex-col"> {/* Wrap label and error message */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <Field
                    type="checkbox"
                    name="acceptTerms"
                    // Apply error style if Yup error OR backend error exists
                    className={`form-checkbox h-4 w-4 text-sky-500 bg-Grayscale-Gray70 border-Grayscale-Gray60 rounded focus:ring-sky-500 mt-0.5 ${
                      (errors.acceptTerms && touched.acceptTerms) || backendErrorAcceptTerms
                        ? 'ring-1 ring-red-500 border-red-500' // Use ring-1 for checkbox
                        : ''
                    }`}
                  />
                  {/* Apply error style to text */}
                  <span className={`${
                    (errors.acceptTerms && touched.acceptTerms) || backendErrorAcceptTerms
                      ? 'text-red-400'
                      : ''
                  }`}>
                    Akceptuję <Link to="/terms" target="_blank" rel="noopener noreferrer" className="underline text-sky-500 hover:text-sky-400">Regulamin</Link> Platformy YouNeed*
                  </span>
                </label>
                {/* Show Yup error OR backend error */}
                <ErrorMessage name="acceptTerms" component="p" className="text-red-500 text-xs mt-1 ml-6" />
                {backendErrorAcceptTerms && !(errors.acceptTerms && touched.acceptTerms) && (
                  <p className="text-red-500 text-xs mt-1 ml-6">{backendErrorAcceptTerms}</p>
                )}
              </div>

              {/* Marketing Consent */}
              <label className="flex items-start gap-2 cursor-pointer">
                <Field type="checkbox" name="marketingConsent" className="form-checkbox h-4 w-4 text-sky-500 bg-Grayscale-Gray70 border-Grayscale-Gray60 rounded focus:ring-sky-500 mt-0.5" />
                <span>Wyrażam zgodę na przetwarzanie moich danych osobowych w celach marketingowych przez YouNeed Spółka Cywilna zgodnie z <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-sky-500 hover:text-sky-400">Polityką Prywatności</Link>.</span>
              </label>

              {/* Partner Consent */}
              <label className="flex items-start gap-2 cursor-pointer">
                <Field type="checkbox" name="partnerConsent" className="form-checkbox h-4 w-4 text-sky-500 bg-Grayscale-Gray70 border-Grayscale-Gray60 rounded focus:ring-sky-500 mt-0.5" />
                <span>Wyrażam zgodę na otrzymywanie informacji handlowych drogą elektroniczną od partnerów YouNeed Spółka Cywilna zgodnie z <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-sky-500 hover:text-sky-400">Polityką Prywatności</Link>.</span>
              </label>
            </div>

            {/* Display general registration error (non-field specific) from parent state */}
            {/* Only show if no specific backend field errors exist */}
            {formData.registrationError && !isSubmitting && !formData.backendErrors && (
              <p className="text-red-500 text-sm text-center mt-2">{formData.registrationError}</p>
            )}

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={onPrevious}
                className="btn-lg bg-Grayscale-Gray60 text-white py-2 px-6 rounded-lg font-bold hover:bg-Grayscale-Gray50 duration-300"
              >
                Wstecz
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-lg bg-sky-500 text-white py-2 px-6 rounded-lg font-bold hover:bg-sky-600 duration-300 disabled:opacity-50"
              >
                {isSubmitting ? 'Rejestrowanie...' : 'Zarejestruj i Kontynuuj'}
              </button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

// Update PropTypes to include backendErrors
Step2About.propTypes = {
  formData: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    companyName: PropTypes.string,
    acceptTerms: PropTypes.bool,
    marketingConsent: PropTypes.bool,
    partnerConsent: PropTypes.bool,
    registrationError: PropTypes.string, // General error message
    backendErrors: PropTypes.arrayOf(PropTypes.shape({ // Specific field errors from backend
        type: PropTypes.string,
        value: PropTypes.any,
        msg: PropTypes.string,
        path: PropTypes.string,
        location: PropTypes.string,
    })),
    // Include other formData props if they exist and are used
  }).isRequired,
  onSubmitRegistration: PropTypes.func.isRequired,
  onPrevious: PropTypes.func.isRequired,
};

export default Step2About;
