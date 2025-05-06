import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Validation for fields in this step
const validationSchema = Yup.object({
    visibilityStartDate: Yup.date()
        .min(new Date(), 'Data rozpoczęcia widoczności nie może być z przeszłości')
        .required('Data rozpoczęcia widoczności jest wymagana'),
    tutorialNeeded: Yup.boolean(),
});

const Step6Visibility = ({ formData, onNext, onPrevious }) => {

    const handleSubmit = (values) => {
        // Pass data collected in this step to the parent
        onNext({
            visibilityStartDate: values.visibilityStartDate,
            tutorialNeeded: values.tutorialNeeded,
        });
    };

    // Get today's date in YYYY-MM-DD format for the min attribute
    const today = new Date().toISOString().split('T')[0];

    return (
        <Formik
            initialValues={{
                visibilityStartDate: formData.visibilityStartDate || '',
                tutorialNeeded: formData.tutorialNeeded || false,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
        >
            {({ isSubmitting, errors, touched }) => (
                <Form className="flex flex-col gap-4">
                    <p className="text-sm text-center text-Grayscale-Gray50 mb-2">Skonfiguruj widoczność swojego profilu.</p>

                    {/* Visibility Start Date */}
                    <div>
                        <label htmlFor="visibilityStartDate" className="block text-sm font-medium text-Grayscale-Gray20 mb-1">Data rozpoczęcia widoczności profilu*</label>
                        <Field
                            type="date"
                            id="visibilityStartDate"
                            name="visibilityStartDate"
                            min={today} // Prevent selecting past dates
                            className={`w-full px-4 py-2 rounded-lg bg-Grayscale-Gray70 text-white focus:outline-none focus:ring-2 ${errors.visibilityStartDate && touched.visibilityStartDate ? 'ring-red-500' : 'focus:ring-sky-500'} appearance-none`} // Basic styling for date input
                            // Style date picker indicator if possible (browser dependent)
                            style={{ colorScheme: 'dark' }} // Helps with calendar theme in some browsers
                        />
                        <ErrorMessage name="visibilityStartDate" component="p" className="text-red-500 text-xs mt-1" />
                         <p className="text-xs text-Grayscale-Gray40 mt-1">Od tego dnia Twój profil będzie widoczny dla klientów.</p>
                    </div>

                    {/* Tutorial Needed */}
                    <div className="mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <Field
                                type="checkbox"
                                name="tutorialNeeded"
                                className="form-checkbox h-4 w-4 text-sky-500 bg-Grayscale-Gray70 border-Grayscale-Gray60 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-Grayscale-Gray20">Potrzebuję samouczka wprowadzającego po rejestracji</span>
                        </label>
                    </div>

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
                            {isSubmitting ? 'Zapisywanie...' : 'Zakończ Rejestrację'}
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

Step6Visibility.propTypes = {
    formData: PropTypes.object.isRequired,
    onNext: PropTypes.func.isRequired, // This will advance to Step 7
    onPrevious: PropTypes.func.isRequired,
};

export default Step6Visibility;
