import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid'; // Using Heroicons

const Step7Congratulations = ({ formData }) => {
    // Optional: Trigger a final profile save here if not done incrementally
    // const handleFinalSave = async () => { /* API call to save remaining data */ };
    // useEffect(() => { handleFinalSave(); }, []);

    return (
        <div className="flex flex-col items-center text-center gap-6 py-8">
            <CheckCircleIcon className="w-16 h-16 text-green-500" />
            <h2 className="text-2xl font-bold text-white">Gratulacje, {formData.firstName}!</h2>
            <p className="text-Grayscale-Gray30">
                Twoje konto usługodawcy zostało pomyślnie utworzone i zweryfikowane.
            </p>
            {formData.profileUpdateError && (
               <p className="text-red-500 text-sm text-center mt-2 bg-red-900/30 p-2 rounded">
                   Wystąpił błąd podczas zapisywania niektórych danych profilowych: {formData.profileUpdateError}. Możesz je zaktualizować później w panelu.
               </p>
             )}
            <p className="text-Grayscale-Gray30">
                Możesz teraz przejść do swojego panelu, aby zarządzać usługami, zleceniami i profilem.
            </p>

            {/* Link to Provider Dashboard */}
            <Link
                to="/dashboard/provider" // Adjust if the path is different
                className="w-full md:w-auto btn-lg bg-sky-500 text-white py-3 px-8 rounded-lg font-bold hover:bg-sky-600 duration-300 mt-4 text-center"
            >
                Przejdź do Panelu Usługodawcy
            </Link>

            {/* Optional: Link back to homepage or other relevant page */}
            {/*
            <Link
                to="/"
                className="text-sm text-sky-500 hover:underline mt-2"
            >
                Wróć do strony głównej
            </Link>
            */}
        </div>
    );
};

Step7Congratulations.propTypes = {
    formData: PropTypes.object.isRequired,
    // onFinish: PropTypes.func, // Optional: If a final save action is needed
};

export default Step7Congratulations;
