import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../api';
import { toast } from 'react-hot-toast';
import { User, Camera, Trash2, Save, Loader2, Building, Briefcase, Phone, Eye, EyeOff, HelpCircle } from 'lucide-react';

// Validation Schema
const profileValidationSchema = Yup.object().shape({
  firstName: Yup.string().required('Imię jest wymagane'),
  lastName: Yup.string().required('Nazwisko jest wymagane'),
  phoneNumber: Yup.string().nullable().matches(/^[+]?[0-9\s\-()]*$/, 'Nieprawidłowy format numeru telefonu'),
  // Provider specific fields validation
  companyName: Yup.string().when('$userRole', { // Conditional validation based on context
      is: 'provider',
      then: schema => schema.required('Nazwa firmy jest wymagana'),
      otherwise: schema => schema.notRequired(),
  }),
  industry: Yup.string().when('$userRole', {
      is: 'provider',
      then: schema => schema.required('Branża jest wymagana'),
      otherwise: schema => schema.notRequired(),
  }),
  // Address fields (assuming simple structure for now)
  addressStreet: Yup.string().when('$userRole', {
      is: 'provider',
      then: schema => schema.nullable(),
      otherwise: schema => schema.notRequired(),
  }),
  addressCity: Yup.string().when('$userRole', {
      is: 'provider',
      then: schema => schema.nullable(),
      otherwise: schema => schema.notRequired(),
  }),
  addressZip: Yup.string().when('$userRole', {
      is: 'provider',
      then: schema => schema.nullable().matches(/^[0-9]{2}-[0-9]{3}$/, 'Nieprawidłowy kod pocztowy (XX-XXX)'),
      otherwise: schema => schema.notRequired(),
  }),
   addressCountry: Yup.string().when('$userRole', {
      is: 'provider',
      then: schema => schema.nullable(),
      otherwise: schema => schema.notRequired(),
  }),
  profileVisibility: Yup.boolean().when('$userRole', {
      is: 'provider',
      then: schema => schema.required('Widoczność profilu jest wymagana'),
      otherwise: schema => schema.notRequired(),
  }),
  tutorial: Yup.boolean().when('$userRole', {
      is: 'provider',
      then: schema => schema.required('Ustawienie samouczka jest wymagane'),
      otherwise: schema => schema.notRequired(),
  }),
});


const UserProfileForm = ({ user, onUpdate }) => {
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isDeletingPicture, setIsDeletingPicture] = useState(false);
  const fileInputRef = useRef(null);

  // Prepare initial values, handling potentially null or nested fields
  const initialValues = {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '', // Read-only
    phoneNumber: user?.phoneNumber || '',
    companyName: user?.companyName || '',
    industry: user?.industry || '',
    // Address: Handle potential JSON structure safely
    addressStreet: user?.address?.street || '',
    addressCity: user?.address?.city || '',
    addressZip: user?.address?.zip || '',
    addressCountry: user?.address?.country || '',
    profileVisibility: user?.profileVisibility ?? true, // Default to true if null/undefined
    tutorial: user?.tutorial ?? true, // Default to true if null/undefined
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsSubmittingProfile(true);
    const updateData = {
      firstName: values.firstName,
      lastName: values.lastName,
      phoneNumber: values.phoneNumber,
    };

    // Add provider-specific fields
    if (user.role === 'provider') {
      updateData.companyName = values.companyName;
      updateData.industry = values.industry;
      updateData.profileVisibility = values.profileVisibility;
      updateData.tutorial = values.tutorial;
      // Construct address object for backend
      updateData.address = {
          street: values.addressStreet || null,
          city: values.addressCity || null,
          zip: values.addressZip || null,
          country: values.addressCountry || null,
      };
    }

    try {
      const response = await api.put('/profile', updateData);
      if (response.data.status === 'success') {
        toast.success('Profil zaktualizowany pomyślnie!');
        onUpdate(response.data.data); // Update parent state with the latest user data
      } else {
        toast.error(response.data.message || 'Nie udało się zaktualizować profilu.');
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.response?.data?.message || 'Wystąpił błąd podczas aktualizacji profilu.');
    } finally {
      setIsSubmittingProfile(false);
      setSubmitting(false); // Formik's submitting state
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Basic validation (type, size)
    if (!file.type.startsWith('image/')) {
        toast.error('Proszę wybrać plik obrazu.');
        return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit (matches backend)
        toast.error('Rozmiar pliku nie może przekraczać 5MB.');
        return;
    }


    const formData = new FormData();
    formData.append('profilePicture', file); // Must match backend field name

    setIsUploadingPicture(true);
    try {
      const response = await api.post('/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.status === 'success') {
        toast.success('Zdjęcie profilowe zaktualizowane!');
        // Need the full updated user object, refetch or merge?
        // Let's assume the backend returns the updated user or at least the new picture URL
        // For simplicity, we'll merge the new picture URL into the existing user object
        onUpdate({ ...user, profilePicture: response.data.data.profilePicture });
      } else {
         toast.error(response.data.message || 'Nie udało się przesłać zdjęcia.');
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      toast.error(err.response?.data?.message || 'Wystąpił błąd podczas przesyłania zdjęcia.');
    } finally {
      setIsUploadingPicture(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePicture = async () => {
    if (!user.profilePicture) return; // No picture to delete

    setIsDeletingPicture(true);
    try {
      const response = await api.delete('/profile/picture');
       if (response.data.status === 'success') {
        toast.success('Zdjęcie profilowe usunięte!');
        onUpdate({ ...user, profilePicture: null }); // Update parent state
      } else {
         toast.error(response.data.message || 'Nie udało się usunąć zdjęcia.');
      }
    } catch (err) {
      console.error("Error deleting profile picture:", err);
      toast.error(err.response?.data?.message || 'Wystąpił błąd podczas usuwania zdjęcia.');
    } finally {
      setIsDeletingPicture(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Profil Użytkownika</h3>

      {/* Profile Picture Section */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50">
        <div className="relative flex-shrink-0">
          <img
            src={user.profilePicture ? user.profilePicture : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=random&color=fff`}
            alt="Zdjęcie profilowe"
            className="h-20 w-20 rounded-full object-cover ring-2 ring-offset-2 ring-sky-500 dark:ring-offset-gray-800"
          />
           {(isUploadingPicture || isDeletingPicture) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
            )}
        </div>
        <div className="flex-grow text-center sm:text-left">
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Zdjęcie profilowe</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Zmień swoje zdjęcie profilowe (max 5MB).</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPicture || isDeletingPicture}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
            >
              <Camera size={14} /> Zmień
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={isUploadingPicture || isDeletingPicture}
            />
            {user.profilePicture && (
              <button
                type="button"
                onClick={handleDeletePicture}
                disabled={isUploadingPicture || isDeletingPicture}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 disabled:opacity-50"
              >
                <Trash2 size={14} /> Usuń
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Profile Form */}
      <Formik
        initialValues={initialValues}
        validationSchema={profileValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize // Update form if user prop changes
        context={{ userRole: user.role }} // Pass role to validation context
      >
        {({ isSubmitting, errors, touched, values }) => (
          <Form className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Imię</label>
                <Field
                  type="text"
                  name="firstName"
                  id="firstName"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm dark:bg-gray-700 dark:text-white ${
                    errors.firstName && touched.firstName ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500'
                  }`}
                />
                <ErrorMessage name="firstName" component="p" className="mt-1 text-xs text-red-600 dark:text-red-400" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nazwisko</label>
                <Field
                  type="text"
                  name="lastName"
                  id="lastName"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm dark:bg-gray-700 dark:text-white ${
                    errors.lastName && touched.lastName ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500'
                  }`}
                />
                <ErrorMessage name="lastName" component="p" className="mt-1 text-xs text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Contact Info */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <Field
                    type="email"
                    name="email"
                    id="email"
                    readOnly // Make email read-only
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Zmiana adresu email wymaga kontaktu z pomocą techniczną.</p>
                </div>
                 <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Numer telefonu</label>
                    <Field
                    type="tel"
                    name="phoneNumber"
                    id="phoneNumber"
                    placeholder="+48 123 456 789"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm dark:bg-gray-700 dark:text-white ${
                        errors.phoneNumber && touched.phoneNumber ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500'
                    }`}
                    />
                    <ErrorMessage name="phoneNumber" component="p" className="mt-1 text-xs text-red-600 dark:text-red-400" />
                </div>
            </div>

            {/* Provider Specific Fields */}
            {user.role === 'provider' && (
              <>
                <hr className="my-6 border-gray-200 dark:border-gray-700" />
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Informacje o Firmie</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nazwa firmy</label>
                    <Field
                      type="text"
                      name="companyName"
                      id="companyName"
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm dark:bg-gray-700 dark:text-white ${
                        errors.companyName && touched.companyName ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500'
                      }`}
                    />
                    <ErrorMessage name="companyName" component="p" className="mt-1 text-xs text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Branża</label>
                    <Field
                      type="text"
                      name="industry"
                      id="industry"
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm dark:bg-gray-700 dark:text-white ${
                        errors.industry && touched.industry ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500'
                      }`}
                    />
                    <ErrorMessage name="industry" component="p" className="mt-1 text-xs text-red-600 dark:text-red-400" />
                  </div>
                </div>

                 {/* Address Fields */}
                 <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adres Firmy</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <Field
                            type="text"
                            name="addressStreet"
                            placeholder="Ulica i numer"
                            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm dark:bg-gray-700 dark:text-white ${
                                errors.addressStreet && touched.addressStreet ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500'
                            }`}
                            />
                            <ErrorMessage name="addressStreet" component="p" className="mt-1 text-xs text-red-600 dark:text-red-400" />
                        </div>
                         <div>
                            <Field
                            type="text"
                            name="addressCity"
                            placeholder="Miasto"
                            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm dark:bg-gray-700 dark:text-white ${
                                errors.addressCity && touched.addressCity ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500'
                            }`}
                            />
                            <ErrorMessage name="addressCity" component="p" className="mt-1 text-xs text-red-600 dark:text-red-400" />
                        </div>
                         <div>
                            <Field
                            type="text"
                            name="addressZip"
                            placeholder="Kod pocztowy (np. 00-000)"
                            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm dark:bg-gray-700 dark:text-white ${
                                errors.addressZip && touched.addressZip ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500'
                            }`}
                            />
                            <ErrorMessage name="addressZip" component="p" className="mt-1 text-xs text-red-600 dark:text-red-400" />
                        </div>
                         <div>
                            <Field
                            type="text"
                            name="addressCountry"
                            placeholder="Kraj"
                            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm dark:bg-gray-700 dark:text-white ${
                                errors.addressCountry && touched.addressCountry ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 focus:ring-sky-500 focus:border-sky-500'
                            }`}
                            />
                            <ErrorMessage name="addressCountry" component="p" className="mt-1 text-xs text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                 </div>

                <hr className="my-6 border-gray-200 dark:border-gray-700" />
                 <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Ustawienia Dodatkowe</h4>
                 <div className="space-y-3">
                    {/* Profile Visibility Toggle */}
                    <div className="flex items-center justify-between">
                        <span className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Widoczność profilu publicznego</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Czy Twój profil ma być widoczny dla klientów w wyszukiwarce?</span>
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <Field type="checkbox" name="profileVisibility" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sky-600"></div>
                        </label>
                    </div>
                     <ErrorMessage name="profileVisibility" component="p" className="text-xs text-red-600 dark:text-red-400" />

                     {/* Tutorial Toggle */}
                    <div className="flex items-center justify-between">
                        <span className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Wskazówki i samouczki</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Czy chcesz widzieć dodatkowe wskazówki w aplikacji?</span>
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <Field type="checkbox" name="tutorial" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sky-600"></div>
                        </label>
                    </div>
                     <ErrorMessage name="tutorial" component="p" className="text-xs text-red-600 dark:text-red-400" />
                 </div>
              </>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting || isSubmittingProfile}
                className="inline-flex items-center justify-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
              >
                {isSubmitting || isSubmittingProfile ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Zapisywanie...
                    </>
                ) : (
                     <>
                        <Save size={16} /> Zapisz zmiany
                    </>
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

UserProfileForm.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    email: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    phoneNumber: PropTypes.string,
    profilePicture: PropTypes.string,
    companyName: PropTypes.string,
    industry: PropTypes.string,
    address: PropTypes.shape({
        street: PropTypes.string,
        city: PropTypes.string,
        zip: PropTypes.string,
        country: PropTypes.string,
    }),
    profileVisibility: PropTypes.bool,
    tutorial: PropTypes.bool,
    name: PropTypes.string, // Added from Settings context fetch
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default UserProfileForm;
