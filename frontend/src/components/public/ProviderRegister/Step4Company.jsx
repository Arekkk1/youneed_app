import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Validation for fields in this step
const validationSchema = Yup.object({
  // Re-validate companyName if it can be changed here, otherwise remove
  // companyName: Yup.string().required('Nazwa firmy jest wymagana'),
  addressStreet: Yup.string().required('Ulica i numer są wymagane'),
  addressApartment: Yup.string(), // Optional
  addressCity: Yup.string().required('Miasto jest wymagane'),
  addressPostalCode: Yup.string()
    .matches(/^\d{2}-\d{3}$/, 'Kod pocztowy musi być w formacie xx-xxx')
    .required('Kod pocztowy jest wymagany'),
  // Add validation for serviceLocation if it's a structured input
});

const Step4Company = ({ formData, onNext, onPrevious }) => {

  const handleSubmit = (values) => {
    // Pass data collected in this step to the parent
    onNext({
      // companyName: values.companyName, // Only if changeable here
      addressStreet: values.addressStreet,
      addressApartment: values.addressApartment,
      addressCity: values.addressCity,
      addressPostalCode: values.addressPostalCode,
      // serviceLocation: values.serviceLocation, // If collected here
    });
  };

  return (
    <Formik
      initialValues={{
        // companyName: formData.companyName || '', // Only if changeable
        addressStreet: formData.addressStreet || '',
        addressApartment: formData.addressApartment || '',
        addressCity: formData.addressCity || '',
        addressPostalCode: formData.addressPostalCode || '',
        // serviceLocation: formData.serviceLocation || '', // Adjust initial value
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ isSubmitting, errors, touched }) => (
        <Form className="flex flex-col gap-4">
          <p className="text-sm text-center text-Grayscale-Gray50 mb-2">Podaj dane adresowe swojej firmy.</p>

          {/* Street Address */}
          <div>
            <label htmlFor="addressStreet" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Ulica i numer*</label>
            <Field
              type="text"
              id="addressStreet"
              name="addressStreet"
              placeholder="np. ul. Główna 123"
              className={`w-full px-4 py-2 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 ${errors.addressStreet && touched.addressStreet ? 'ring-red-500' : 'focus:ring-sky-500'}`}
            />
            <ErrorMessage name="addressStreet" component="p" className="text-red-500 text-xs mt-1" />
          </div>

          {/* Apartment Number */}
          <div>
            <label htmlFor="addressApartment" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Numer lokalu (opcjonalnie)</label>
            <Field
              type="text"
              id="addressApartment"
              name="addressApartment"
              placeholder="np. 5A"
              className={`w-full px-4 py-2 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 focus:ring-sky-500`}
            />
            {/* No error message needed for optional field unless specific validation */}
          </div>

          {/* City */}
          <div>
            <label htmlFor="addressCity" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Miasto*</label>
            <Field
              type="text"
              id="addressCity"
              name="addressCity"
              placeholder="np. Warszawa"
              className={`w-full px-4 py-2 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 ${errors.addressCity && touched.addressCity ? 'ring-red-500' : 'focus:ring-sky-500'}`}
            />
            <ErrorMessage name="addressCity" component="p" className="text-red-500 text-xs mt-1" />
          </div>

          {/* Postal Code */}
          <div>
            <label htmlFor="addressPostalCode" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Kod pocztowy*</label>
            <Field
              type="text"
              id="addressPostalCode"
              name="addressPostalCode"
              placeholder="np. 00-001"
              className={`w-full px-4 py-2 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 ${errors.addressPostalCode && touched.addressPostalCode ? 'ring-red-500' : 'focus:ring-sky-500'}`}
            />
            <ErrorMessage name="addressPostalCode" component="p" className="text-red-500 text-xs mt-1" />
          </div>

          {/* TODO: Add input for Service Location if needed */}
          {/* Example: Simple text area */}
          {/*
          <div>
            <label htmlFor="serviceLocation" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Obszar świadczenia usług</label>
            <Field
              as="textarea"
              id="serviceLocation"
              name="serviceLocation"
              placeholder="np. Warszawa i okolice, Cała Polska"
              rows="3"
              className={`w-full px-4 py-2 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 focus:ring-sky-500`}
            />
            <ErrorMessage name="serviceLocation" component="p" className="text-red-500 text-xs mt-1" />
          </div>
          */}

          {/* Display profile update error from parent state */}
           {formData.profileUpdateError && !isSubmitting && (
             <p className="text-red-500 text-sm text-center mt-2">{formData.profileUpdateError}</p>
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
                className="btn-lg bg-sky-500 text-white py-2 px-6 rounded-lg font-bold hover:bg-sky-600 duration-300"
             >
                {isSubmitting ? 'Zapisywanie...' : 'Dalej'}
             </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

Step4Company.propTypes = {
  formData: PropTypes.object.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrevious: PropTypes.func.isRequired,
};

export default Step4Company;
