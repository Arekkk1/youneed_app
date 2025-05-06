import React, { useState } from 'react'; // Import useState
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff } from 'lucide-react'; // Import eye icons

const industries = [
  'Hydraulika', 'Elektryka', 'Malarstwo', 'Stolarstwo', 'Ogrodnictwo',
  'Remonty', 'Sprzątanie', 'IT', 'Transport', 'Opieka', 'Inne',
];

// Validation Schema with strong password rules and confirmation
const validationSchema = Yup.object({
  industry: Yup.string().required('Branża jest wymagana'),
  email: Yup.string().email('Nieprawidłowy adres email').required('Email jest wymagany'),
  password: Yup.string()
    .required('Hasło jest wymagane')
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .matches(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną dużą literę')
    .matches(/[a-z]/, 'Hasło musi zawierać co najmniej jedną małą literę')
    .matches(/[0-9]/, 'Hasło musi zawierać co najmniej jedną cyfrę')
    .matches(/[\W_]/, 'Hasło musi zawierać co najmniej jeden znak specjalny'), // Strong password validation
  confirmPassword: Yup.string()
    .required('Potwierdzenie hasła jest wymagane')
    .oneOf([Yup.ref('password'), null], 'Hasła muszą być takie same'),
});

const Step1Industry = ({ formData, onNext, updateFormData }) => { // Added updateFormData prop
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (values) => {
    // Update the central formData state
    updateFormData({
      industry: values.industry,
      email: values.email,
      password: values.password,
      // Don't store confirmPassword
    });
    // Proceed to the next step
    onNext();
  };

  return (
    <Formik
      initialValues={{
        industry: formData.industry || '',
        email: formData.email || '',
        password: formData.password || '', // Keep password if user goes back
        confirmPassword: '', // Always start empty
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize // Update if formData changes (e.g., going back)
    >
      {({ errors, touched }) => (
        <Form className="flex flex-col gap-4">
          <p className="text-sm text-center text-Grayscale-Gray50 mb-2">Podaj podstawowe informacje, wybierz branżę i utwórz hasło.</p>

          {/* Industry */}
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Branża*</label>
            <Field
              as="select"
              id="industry"
              name="industry"
              className={`w-full px-4 py-2 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 ${errors.industry && touched.industry ? 'ring-red-500' : 'focus:ring-sky-500'}`}
            >
              <option value="">-- Wybierz branżę --</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </Field>
            <ErrorMessage name="industry" component="p" className="text-red-500 text-xs mt-1" />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Email*</label>
            <Field
              type="email"
              id="email"
              name="email"
              placeholder="adres@email.com"
              className={`w-full px-4 py-2 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 ${errors.email && touched.email ? 'ring-red-500' : 'focus:ring-sky-500'}`}
            />
            <ErrorMessage name="email" component="p" className="text-red-500 text-xs mt-1" />
             {/* Display backend email error if passed via formData */}
             {formData.backendErrors?.email && <p className="text-red-500 text-xs mt-1">{formData.backendErrors.email}</p>}
          </div>

          {/* Password */}
          <div>
             <label htmlFor="password" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Hasło*</label>
             <div className="relative">
                <Field
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="********"
                    className={`w-full px-4 py-2 pr-10 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 ${errors.password && touched.password ? 'ring-red-500' : 'focus:ring-sky-500'}`}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-Grayscale-Gray50 hover:text-Grayscale-Gray20"
                    aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
             </div>
            <ErrorMessage name="password" component="p" className="text-red-500 text-xs mt-1" />
             {/* Display password requirements helper text */}
             {(!errors.password || !touched.password) && (
                <p className="mt-1 text-xs text-Grayscale-Gray50">
                    Min. 8 znaków, duża/mała litera, cyfra, znak specjalny.
                </p>
             )}
             {/* Display backend password error if passed via formData */}
             {formData.backendErrors?.password && <p className="text-red-500 text-xs mt-1">{formData.backendErrors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword"className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Potwierdź Hasło*</label>
             <div className="relative">
              <Field
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="********"
                className={`w-full px-4 py-2 pr-10 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 ${errors.confirmPassword && touched.confirmPassword ? 'ring-red-500' : 'focus:ring-sky-500'}`}
              />
               <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-Grayscale-Gray50 hover:text-Grayscale-Gray20"
                aria-label={showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <ErrorMessage name="confirmPassword" component="p" className="text-red-500 text-xs mt-1" />
          </div>


          <div className="flex justify-end mt-6">
             {/* No "Back" button on Step 1 */}
             <button
                type="submit"
                className="btn-lg bg-sky-500 text-white py-2 px-6 rounded-lg font-bold hover:bg-sky-600 duration-300 w-full md:w-auto" // Full width on mobile
             >
                Dalej
             </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

Step1Industry.propTypes = {
  formData: PropTypes.object.isRequired,
  onNext: PropTypes.func.isRequired,
  updateFormData: PropTypes.func.isRequired, // Added prop type
};

export default Step1Industry;
