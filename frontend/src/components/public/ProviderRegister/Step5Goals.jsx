import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

// Example goals
const goalOptions = [
    { id: 'more_clients', label: 'Zdobycie większej liczby klientów' },
    { id: 'brand_awareness', label: 'Zwiększenie rozpoznawalności marki' },
    { id: 'efficiency', label: 'Poprawa efektywności operacyjnej' },
    { id: 'new_services', label: 'Wprowadzenie nowych usług' },
    { id: 'reviews', label: 'Zdobycie pozytywnych opinii' },
];

// No strict validation needed for checkboxes usually, unless min/max required
const validationSchema = Yup.object({
    goals: Yup.array(), // Array of selected goal IDs
    // Add other fields if any
});

const Step5Goals = ({ formData, onNext, onPrevious }) => {

    const handleSubmit = (values) => {
        // Pass selected goals (and any other data) to parent
        onNext({
            goals: values.goals,
        });
    };

    return (
        <Formik
            initialValues={{
                goals: formData.goals || [],
            }}
            validationSchema={validationSchema} // Optional here
            onSubmit={handleSubmit}
            enableReinitialize
        >
            {({ isSubmitting, values }) => (
                <Form className="flex flex-col gap-4">
                    <p className="text-sm text-center text-Grayscale-Gray50 mb-2">Jakie są Twoje główne cele biznesowe związane z platformą?</p>

                    <div role="group" aria-labelledby="goals-heading" className="flex flex-col gap-3">
                        <h3 id="goals-heading" className="sr-only">Wybierz cele</h3>
                        {goalOptions.map(option => (
                            <label key={option.id} className="flex items-center gap-3 p-3 rounded-lg bg-Grayscale-Gray70 hover:bg-Grayscale-Gray60 cursor-pointer transition duration-200">
                                <Field
                                    type="checkbox"
                                    name="goals"
                                    value={option.id}
                                    className="form-checkbox h-5 w-5 text-sky-500 bg-Grayscale-Gray80 border-Grayscale-Gray50 rounded focus:ring-sky-500"
                                />
                                <span className="text-white text-sm">{option.label}</span>
                            </label>
                        ))}
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
                            {isSubmitting ? 'Zapisywanie...' : 'Dalej'}
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

Step5Goals.propTypes = {
    formData: PropTypes.object.isRequired,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
};

export default Step5Goals;
