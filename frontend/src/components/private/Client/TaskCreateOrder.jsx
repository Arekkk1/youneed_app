import React, { useState, useEffect, useCallback } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../../api'; // Use configured api instance
import { toast } from 'react-hot-toast';
import { Calendar, Clock, DollarSign, List, X, Loader2, Info, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import Select from 'react-select';
import { Link } from 'react-router-dom'; // Import Link for navigation

// Validation Schema - Adjusted based on Order model (title/description not directly validated here)
const OrderSchema = Yup.object().shape({
    serviceId: Yup.number().when('serviceProviderId', {
        is: (val) => !!val,
        then: (schema) => schema.required('Wybór usługi jest wymagany.'),
        otherwise: (schema) => schema.optional(),
    }),
    startAt: Yup.date().required('Data i godzina rozpoczęcia są wymagane.').min(new Date(), 'Nie można wybrać daty z przeszłości.'),
    notes: Yup.string().optional(), // Maps to description
});

// Custom styles for react-select (same as before)
const selectStyles = {
    control: (provided) => ({
        ...provided,
        backgroundColor: 'var(--color-input-bg, #fff)',
        borderColor: 'var(--color-input-border, #d1d5db)',
        color: 'var(--color-text-primary, #1f2937)',
        '&:hover': {
            borderColor: 'var(--color-primary, #3b82f6)',
        },
        boxShadow: 'none',
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: 'var(--color-bg-secondary, #fff)',
        zIndex: 50,
        color: 'var(--color-text-primary, #1f2937)',
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? 'var(--color-primary, #3b82f6)' : state.isFocused ? 'var(--color-bg-hover, #f3f4f6)' : 'var(--color-bg-secondary, #fff)',
        color: state.isSelected ? 'white' : 'var(--color-text-primary, #1f2937)',
        '&:active': {
            backgroundColor: 'var(--color-primary-dark, #2563eb)',
        },
    }),
    singleValue: (provided) => ({
        ...provided,
        color: 'var(--color-text-primary, #1f2937)',
    }),
    input: (provided) => ({
        ...provided,
        color: 'var(--color-text-primary, #1f2937)',
    }),
    placeholder: (provided) => ({
        ...provided,
        color: 'var(--color-text-secondary, #6b7280)',
    }),
};


function ClientTaskCreateOrder({ sendValue, selectedDate, selectedHour, onOrderCreated, initialData, serviceProviderId, clientId, initialServiceId }) {
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [errorServices, setErrorServices] = useState('');
    const isEditMode = !!initialData; // Editing is currently disabled for clients in this component
    const hasProvider = !!serviceProviderId;

    // Fetch services ONLY if serviceProviderId is provided
    useEffect(() => {
        const fetchServices = async () => {
            if (!serviceProviderId) {
                setLoadingServices(false);
                setServices([]);
                return;
            }
            setLoadingServices(true);
            setErrorServices('');
            try {
                const response = await api.get(`/provider/${serviceProviderId}/services`);
                console.log("[ClientTaskCreateOrder] Services API Response:", response);
                if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
                    setServices(response.data.data);
                } else {
                     throw new Error(response.data?.message || 'Nie udało się pobrać usług (nieprawidłowa odpowiedź)');
                }
            } catch (err) {
                console.error("[ClientTaskCreateOrder] Błąd pobierania usług:", err);
                const errorMsg = err.response?.data?.message || err.message || 'Nie udało się pobrać usług.';
                setErrorServices(errorMsg);
                toast.error(`Błąd ładowania usług: ${errorMsg}`);
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, [serviceProviderId]);

    // Combine selectedDate and selectedHour into a single Date object
    const getInitialStartAt = () => {
        // Edit mode currently disabled here, but keep logic if re-enabled
        if (isEditMode && initialData?.start) return new Date(initialData.start);
        if (selectedDate && selectedHour) {
            const [hour, minute] = selectedHour.split(':');
            const combinedDate = new Date(selectedDate);
            combinedDate.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
            if (combinedDate < new Date()) {
                toast.error("Wybrany termin jest w przeszłości. Wybierz przyszłą datę/godzinę.", { duration: 4000 });
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                return tomorrow;
            }
            return combinedDate;
        }
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow;
    };

    const formik = useFormik({
        initialValues: {
            serviceProviderId: serviceProviderId, // For Yup context
            // Use initialServiceId if passed (e.g., from ProviderSearch click)
            serviceId: isEditMode ? (initialData?.serviceId || '') : (initialServiceId || ''),
            startAt: getInitialStartAt(),
            notes: isEditMode ? (initialData?.description || '') : '', // Map description from initialData
        },
        validationSchema: OrderSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting, setErrors }) => {
            if (!hasProvider) {
                toast.error("Najpierw wybierz usługodawcę.");
                setSubmitting(false);
                return;
            }

            const toastId = toast.loading(isEditMode ? 'Aktualizowanie zlecenia...' : 'Tworzenie zlecenia...');
            const selectedService = services.find(s => s.id === parseInt(values.serviceId));

            if (!selectedService) {
                toast.error('Wybrana usługa jest nieprawidłowa.', { id: toastId });
                setErrors({ serviceId: 'Wybrana usługa jest nieprawidłowa.' });
                setSubmitting(false);
                return;
            }

            let startAtDate;
            if (values.startAt instanceof Date && !isNaN(values.startAt)) {
                startAtDate = values.startAt;
            } else if (typeof values.startAt === 'string') {
                startAtDate = new Date(values.startAt);
            } else {
                 toast.error('Nieprawidłowa data rozpoczęcia.', { id: toastId });
                 setErrors({ startAt: 'Nieprawidłowa data rozpoczęcia.' });
                 setSubmitting(false);
                 return;
            }

            if (isNaN(startAtDate)) {
                 toast.error('Nieprawidłowa data rozpoczęcia.', { id: toastId });
                 setErrors({ startAt: 'Nieprawidłowa data rozpoczęcia.' });
                 setSubmitting(false);
                 return;
            }

             if (startAtDate < new Date()) {
                 toast.error('Nie można utworzyć zlecenia w przeszłości.', { id: toastId });
                 setErrors({ startAt: 'Nie można wybrać daty z przeszłości.' });
                 setSubmitting(false);
                 return;
             }

            // --- Data mapping to Order model ---
            const orderData = {
                serviceId: parseInt(values.serviceId),
                providerId: parseInt(serviceProviderId),
                clientId: clientId, // Passed via props
                startAt: startAtDate.toISOString(),
                status: 'pending', // Client always creates as pending
                description: values.notes, // Map notes to description
                title: selectedService?.name || 'Zlecenie klienta', // Use service name as title
                // endAt is calculated by backend based on service duration
                // price is not stored in Order model, it's in Service model
            };
            // --- End Data mapping ---

            console.log("[ClientTaskCreateOrder] Submitting Order Data:", orderData);

            try {
                let response;
                if (isEditMode) {
                    // Edit logic (currently disabled for clients)
                    // const orderId = initialData?.id;
                    // if (!orderId) throw new Error("Brak ID zlecenia do edycji.");
                    // response = await api.put(`/orders/${orderId}`, { description: orderData.description /*, other editable fields */ });
                    toast.error('Edycja zleceń przez klienta nie jest jeszcze zaimplementowana.', { id: toastId });
                    setSubmitting(false);
                    return;
                } else {
                    // Create new order
                    response = await api.post('/orders', orderData);
                }

                 console.log("[ClientTaskCreateOrder] API Response:", response);

                if (response.data?.status === 'success') {
                    toast.success(isEditMode ? 'Zlecenie zaktualizowane!' : 'Zlecenie utworzone!', { id: toastId });
                    if (onOrderCreated) {
                        onOrderCreated(response.data.data); // Pass back the created/updated order data
                    }
                    sendValue(); // Close modal
                } else {
                     throw new Error(response.data?.message || 'Nie udało się zapisać zlecenia (odpowiedź serwera)');
                }
            } catch (err) {
                console.error("[ClientTaskCreateOrder] Błąd zapisu zlecenia:", err);
                const errorMsg = err.response?.data?.message || err.message || 'Wystąpił błąd.';
                 if (err.response?.data?.errors) {
                     const backendErrors = {};
                     // Handle potential array or object format for errors
                     if (Array.isArray(err.response.data.errors)) {
                         err.response.data.errors.forEach(e => {
                             const field = e.path || e.param || 'general'; // Adjust based on backend error format
                             backendErrors[field] = e.msg;
                         });
                     } else if (typeof err.response.data.errors === 'object') {
                         Object.assign(backendErrors, err.response.data.errors);
                     }

                     if (Object.keys(backendErrors).length > 0 && backendErrors.general) {
                         toast.error(`Błąd: ${backendErrors.general}`, { id: toastId });
                     } else if (Object.keys(backendErrors).length > 0) {
                         toast.error(`Popraw błędy w formularzu.`, { id: toastId });
                     } else {
                         toast.error(`Błąd: ${errorMsg}`, { id: toastId });
                     }
                     setErrors(backendErrors);

                 } else {
                     setErrors({ general: errorMsg }); // Set a general error if specific field errors aren't available
                     toast.error(`Błąd: ${errorMsg}`, { id: toastId });
                 }
            } finally {
                setSubmitting(false);
            }
        },
    });

     const serviceOptions = services.map(service => ({
         value: service.id,
         label: `${service.name} (${service.duration} min) - ${service.price} zł`
     }));

     // Find selected service details based on formik's current value
     const selectedServiceDetails = services.find(s => s.id === parseInt(formik.values.serviceId));

    return (
        <div className="p-6 pt-12"> {/* Added top padding to account for absolute close button */}
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white text-center">
                {isEditMode ? 'Edytuj Zlecenie' : 'Utwórz Nowe Zlecenie'}
            </h2>

            {!hasProvider && !isEditMode && (
                <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-md text-sm dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700 flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <div>
                        <span>Aby utworzyć zlecenie, najpierw wybierz usługodawcę.</span>
                        <Link
                            to="/dashboard/client/searchProvider"
                            onClick={sendValue} // Close modal when navigating
                            className="ml-2 font-medium text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-200 underline"
                        >
                            Przejdź do wyszukiwarki
                        </Link>
                    </div>
                </div>
            )}

            {formik.errors.general && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm dark:bg-red-900 dark:text-red-200 dark:border-red-700">
                    {formik.errors.general}
                </div>
            )}

            {/* Disable form fields if no provider is selected OR if editing (currently disabled) */}
            <fieldset disabled={!hasProvider || isEditMode}>
                <form onSubmit={formik.handleSubmit} className="space-y-5">
                    {/* Service Selection */}
                    <div>
                        <label htmlFor="serviceId" className={`block text-sm font-medium mb-1 ${!hasProvider ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            Wybierz Usługę*
                        </label>
                        <div className="relative">
                             <List className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 z-10 ${!hasProvider ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'}`} />
                             <Select
                                 id="serviceId"
                                 name="serviceId"
                                 options={serviceOptions}
                                 value={serviceOptions.find(option => option.value === parseInt(formik.values.serviceId)) || null} // Ensure value comparison is correct type
                                 onChange={option => formik.setFieldValue('serviceId', option ? option.value : '')}
                                 onBlur={() => formik.setFieldTouched('serviceId', true)}
                                 placeholder={!hasProvider ? "Najpierw wybierz usługodawcę" : "Wybierz usługę..."}
                                 isLoading={loadingServices}
                                 isDisabled={!hasProvider || loadingServices || services.length === 0 || isEditMode}
                                 styles={selectStyles}
                                 className={`react-select-container ${formik.touched.serviceId && formik.errors.serviceId ? 'is-invalid' : ''}`}
                                 classNamePrefix="react-select"
                                 theme={(theme) => ({ /* Theme unchanged */
                                    ...theme,
                                    borderRadius: 6,
                                    colors: {
                                      ...theme.colors,
                                      primary: 'var(--color-primary, #3b82f6)',
                                      primary75: 'var(--color-primary-light, #60a5fa)',
                                      primary50: 'var(--color-primary-lighter, #93c5fd)',
                                      primary25: 'var(--color-primary-lightest, #dbeafe)',
                                    },
                                  })}
                             />
                        </div>
                        {loadingServices && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ładowanie usług...</p>}
                        {errorServices && <p className="mt-1 text-xs text-red-500">{errorServices}</p>}
                        {formik.touched.serviceId && formik.errors.serviceId ? (
                            <p className="mt-1 text-xs text-red-500">{formik.errors.serviceId}</p>
                        ) : null}
                         {selectedServiceDetails && !isEditMode && hasProvider && (
                             <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                 Wybrano: {selectedServiceDetails.name} ({selectedServiceDetails.duration} min, {selectedServiceDetails.price} zł)
                             </div>
                         )}
                    </div>

                    {/* Start Date & Time */}
                    <div>
                        <label htmlFor="startAt" className={`block text-sm font-medium mb-1 ${!hasProvider ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            Data i Godzina Rozpoczęcia*
                        </label>
                        <div className="relative">
                            <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${!hasProvider ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'}`} />
                            <input
                                type="datetime-local"
                                id="startAt"
                                name="startAt"
                                value={formik.values.startAt instanceof Date && !isNaN(formik.values.startAt) ? formik.values.startAt.toISOString().slice(0, 16) : ''}
                                onChange={(e) => {
                                    const dateValue = e.target.value ? new Date(e.target.value) : null;
                                    formik.setFieldValue('startAt', dateValue);
                                }}
                                onBlur={formik.handleBlur}
                                className={`pl-10 block w-full rounded-md shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${formik.touched.startAt && formik.errors.startAt ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-sky-500 focus:ring-sky-500'} ${!hasProvider ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                                min={new Date().toISOString().slice(0, 16)}
                                disabled={!hasProvider || isEditMode}
                            />
                        </div>
                        {formik.touched.startAt && formik.errors.startAt ? (
                            <p className="mt-1 text-xs text-red-500">{formik.errors.startAt}</p>
                        ) : null}
                    </div>

                    {/* Notes (maps to Description) */}
                    <div>
                        <label htmlFor="notes" className={`block text-sm font-medium mb-1 ${!hasProvider ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            Dodatkowe Informacje (opcjonalnie)
                        </label>
                        <div className="relative">
                             <Info className={`absolute left-3 top-3 h-5 w-5 ${!hasProvider ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'}`} />
                            <textarea
                                id="notes"
                                name="notes" // Keep name as notes for formik state
                                rows="3"
                                value={formik.values.notes}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder="Np. preferowany kontakt, szczegóły dotyczące zlecenia..."
                                className={`pl-10 block w-full rounded-md shadow-sm sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${formik.touched.notes && formik.errors.notes ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-sky-500 focus:ring-sky-500'} ${!hasProvider ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                                disabled={!hasProvider || isEditMode}
                            ></textarea>
                        </div>
                        {formik.touched.notes && formik.errors.notes ? (
                            <p className="mt-1 text-xs text-red-500">{formik.errors.notes}</p>
                        ) : null}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!hasProvider || formik.isSubmitting || loadingServices || isEditMode} // Disable if editing (currently always true)
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            {formik.isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                    {isEditMode ? 'Aktualizowanie...' : 'Rezerwuję termin...'}
                                </>
                            ) : (
                                isEditMode ? 'Zapisz Zmiany (Niedostępne)' : 'Zarezerwuj Termin'
                            )}
                        </button>
                    </div>
                </form>
            </fieldset>
        </div>
    );
}

export default ClientTaskCreateOrder;
