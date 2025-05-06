import React, { useState, useEffect, useCallback } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../../api'; // Use configured api instance
import { toast } from 'react-hot-toast';
import { Calendar, Clock, DollarSign, List, X, Loader2, Info, User as UserIcon } from 'lucide-react';
import Select from 'react-select'; // Import react-select

// Validation Schema - Adjusted based on Order model
const OrderSchema = Yup.object().shape({
    serviceId: Yup.number().required('Wybór usługi jest wymagany.'),
    startAt: Yup.date().required('Data i godzina rozpoczęcia są wymagane.').min(new Date(), 'Nie można wybrać daty z przeszłości.'),
    clientId: Yup.number().nullable().optional(), // Client ID is optional for provider creation (blocker)
    notes: Yup.string().optional(), // Maps to description
});

// Custom styles for react-select (same as before)
const selectStyles = {
    control: (provided) => ({
        ...provided,
        backgroundColor: 'var(--color-input-bg)',
        borderColor: 'var(--color-input-border)',
        color: 'var(--color-text-primary)',
        '&:hover': {
            borderColor: 'var(--color-primary)',
        },
        boxShadow: 'none',
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: 'var(--color-bg-secondary)',
        zIndex: 50,
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? 'var(--color-primary)' : state.isFocused ? 'var(--color-bg-hover)' : 'var(--color-bg-secondary)',
        color: state.isSelected ? 'white' : 'var(--color-text-primary)',
        '&:active': {
            backgroundColor: 'var(--color-primary-dark)',
        },
    }),
    singleValue: (provided) => ({
        ...provided,
        color: 'var(--color-text-primary)',
    }),
    input: (provided) => ({
        ...provided,
        color: 'var(--color-text-primary)',
    }),
    placeholder: (provided) => ({
        ...provided,
        color: 'var(--color-text-secondary)',
    }),
};


function ProviderTaskCreateOrder({ sendValue, selectedDate, selectedHour, onOrderCreated, onOrderUpdated, initialData, serviceProviderId, clientId, isAdmin }) {
    const [services, setServices] = useState([]);
    const [clients, setClients] = useState([]); // State for clients list
    const [loadingServices, setLoadingServices] = useState(true);
    const [loadingClients, setLoadingClients] = useState(false); // Loading state for clients
    const [errorServices, setErrorServices] = useState('');
    const [errorClients, setErrorClients] = useState(''); // Error state for clients
    const isEditMode = !!initialData;

    // Fetch services for the specific provider
    useEffect(() => {
        const fetchServices = async () => {
            if (!serviceProviderId) {
                setErrorServices('Brak ID usługodawcy do pobrania usług.');
                setLoadingServices(false);
                return;
            }
            setLoadingServices(true);
            setErrorServices('');
            try {
                const response = await api.get(`/provider/${serviceProviderId}/services`);
                console.log("Services API Response:", response);
                 if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
                    setServices(response.data.data);
                } else {
                     throw new Error(response.data?.message || 'Nie udało się pobrać usług (nieprawidłowa odpowiedź)');
                }
            } catch (err) {
                console.error("Błąd pobierania usług:", err);
                const errorMsg = err.response?.data?.message || err.message || 'Nie udało się pobrać usług.';
                setErrorServices(errorMsg);
                toast.error(`Błąd ładowania usług: ${errorMsg}`);
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, [serviceProviderId]);

    // Fetch clients associated with the provider
    useEffect(() => {
        const fetchClients = async () => {
            if (serviceProviderId && !clientId) { // Fetch only if provider context and not client view
                setLoadingClients(true);
                setErrorClients('');
                try {
                    // Assuming endpoint exists: GET /api/provider/clients
                    const response = await api.get(`/provider/clients`);
                    if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
                        setClients(response.data.data);
                    } else {
                         throw new Error(response.data?.message || 'Nie udało się pobrać klientów');
                    }
                } catch (err) {
                    console.error("Błąd pobierania klientów:", err);
                    setErrorClients(err.response?.data?.message || err.message || 'Nie udało się pobrać listy klientów.');
                } finally {
                    setLoadingClients(false);
                }
            } else {
                setClients([]);
            }
        };
        fetchClients();
    }, [serviceProviderId, clientId]);


    // Combine selectedDate and selectedHour
    const getInitialStartAt = () => {
        // Use startAt from initialData if editing
        if (isEditMode && initialData?.startAt) return new Date(initialData.startAt);
        if (selectedDate && selectedHour) {
            const [hour, minute] = selectedHour.split(':');
            const combinedDate = new Date(selectedDate);
            combinedDate.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
             // Check if past, default to next day 9 AM if so
             if (combinedDate < new Date()) {
                 toast.error("Wybrany termin jest w przeszłości. Ustawiono na jutro 9:00.", { duration: 4000 });
                 const tomorrow = new Date();
                 tomorrow.setDate(tomorrow.getDate() + 1);
                 tomorrow.setHours(9, 0, 0, 0);
                 return tomorrow;
             }
            return combinedDate;
        }
        // Default to next day 9 AM if no selection
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow;
    };

    const formik = useFormik({
        initialValues: {
            serviceId: initialData?.serviceId || '',
            startAt: getInitialStartAt(),
            // Use clientId from initialData if editing, otherwise use passed clientId (can be null)
            clientId: initialData?.clientId || (clientId || null),
            notes: initialData?.description || '', // Map description from initialData
        },
        validationSchema: OrderSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting, setErrors }) => {
            const toastId = toast.loading(isEditMode ? 'Aktualizowanie zlecenia...' : 'Tworzenie zlecenia/blokady...');
            const selectedService = services.find(s => s.id === parseInt(values.serviceId));

            if (!selectedService && !isEditMode) { // Service required for creation
                 toast.error('Wybór usługi jest wymagany.', { id: toastId });
                 setErrors({ serviceId: 'Wybór usługi jest wymagany.' });
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

              if (startAtDate < new Date() && !isEditMode) { // Allow editing past events? Maybe not. Check only for create.
                  toast.error('Nie można utworzyć zlecenia w przeszłości.', { id: toastId });
                  setErrors({ startAt: 'Nie można wybrać daty z przeszłości.' });
                  setSubmitting(false);
                  return;
              }

            // --- Data mapping to Order model ---
            const orderData = {
                serviceId: parseInt(values.serviceId),
                providerId: parseInt(serviceProviderId), // Provider ID from props
                clientId: values.clientId ? parseInt(values.clientId) : null, // Can be null for blockers
                startAt: startAtDate.toISOString(),
                // Use existing status if editing, otherwise set based on clientId
                status: isEditMode ? initialData.status : 'accepted', // Use 'accepted' for both client orders and provider blocks created here
                description: values.notes, // Map notes to description
                // Use service name for title, fallback for blockers/edit
                title: selectedService?.name || (isEditMode ? initialData?.title : 'Blokada terminu'),
                // endAt is calculated by backend
                // price is not stored in Order model
            };
            // --- End Data mapping ---

            // If editing, only send fields that are meant to be updatable by provider
            const updateData = isEditMode ? {
                startAt: orderData.startAt,
                status: orderData.status, // Allow provider to change status? (e.g., complete, cancel)
                description: orderData.description,
                // Maybe allow changing service or client? Depends on requirements.
                // serviceId: orderData.serviceId,
                // clientId: orderData.clientId,
            } : orderData;


            console.log("[ProviderTaskCreateOrder] Submitting Data:", isEditMode ? updateData : orderData);

            try {
                let response;
                if (isEditMode) {
                    if (!initialData?.id) throw new Error("Brak ID zlecenia do edycji.");
                    response = await api.put(`/orders/${initialData.id}`, updateData);
                } else {
                    response = await api.post('/orders', orderData);
                }

                 if (response.data?.status === 'success') {
                    toast.success(isEditMode ? 'Zlecenie zaktualizowane!' : 'Zlecenie/blokada utworzona!', { id: toastId });
                    if (isEditMode && onOrderUpdated) {
                        onOrderUpdated(response.data.data);
                    } else if (!isEditMode && onOrderCreated) {
                        onOrderCreated(response.data.data);
                    }
                    sendValue(); // Close modal
                } else {
                     throw new Error(response.data?.message || 'Nie udało się zapisać zlecenia/blokady');
                }
            } catch (err) {
                console.error("Błąd zapisu zlecenia/blokady:", err);
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
                     setErrors({ general: errorMsg });
                     toast.error(`Błąd: ${errorMsg}`, { id: toastId });
                 }
            } finally {
                setSubmitting(false);
            }
        },
    });

     // Prepare options for react-select
     const serviceOptions = services.map(service => ({
         value: service.id,
         label: `${service.name} (${service.duration} min) - ${service.price} zł`
     }));

     const clientOptions = clients.map(client => ({
         value: client.id,
         // Construct label safely, handling potentially missing names
         label: `${client.firstName || ''} ${client.lastName || ''} (${client.email || 'brak email'})`.trim() || `ID: ${client.id}`
     }));

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full relative">
            {/* Close button is now rendered by parent (EventList) */}
            {/* <button onClick={sendValue} ... /> */}
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white text-center">
                {isEditMode ? 'Edytuj Zlecenie/Blokadę' : 'Utwórz Nowe Zlecenie / Zablokuj Termin'}
            </h2>

            {formik.errors.general && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm dark:bg-red-900 dark:text-red-200 dark:border-red-700">
                    {formik.errors.general}
                </div>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-5">
                {/* Service Selection */}
                <div>
                    <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Wybierz Usługę*
                    </label>
                    <div className="relative">
                         <List className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                         <Select
                             id="serviceId"
                             name="serviceId"
                             options={serviceOptions}
                             value={serviceOptions.find(option => option.value === parseInt(formik.values.serviceId)) || null}
                             onChange={option => formik.setFieldValue('serviceId', option ? option.value : '')}
                             onBlur={formik.handleBlur}
                             placeholder="Wybierz usługę..."
                             isLoading={loadingServices}
                             isDisabled={loadingServices || services.length === 0} // Allow changing service in edit mode? Maybe not.
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
                </div>

                 {/* Client Selection (Optional for Provider/Admin) */}
                 {!clientId && ( // Show only if clientId is not passed via props (i.e., not client view)
                     <div>
                         <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             Wybierz Klienta (opcjonalnie - pozostaw puste by zablokować termin)
                         </label>
                         <div className="relative">
                             <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                             <Select
                                 id="clientId"
                                 name="clientId"
                                 options={clientOptions}
                                 value={clientOptions.find(option => option.value === parseInt(formik.values.clientId)) || null}
                                 onChange={option => formik.setFieldValue('clientId', option ? option.value : null)} // Set to null if cleared
                                 onBlur={formik.handleBlur}
                                 placeholder="Wybierz klienta..."
                                 isClearable // Allow clearing the selection
                                 isLoading={loadingClients}
                                 isDisabled={loadingClients} // Allow changing client in edit mode? Maybe not.
                                 styles={selectStyles}
                                 className={`react-select-container ${formik.touched.clientId && formik.errors.clientId ? 'is-invalid' : ''}`}
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
                         {loadingClients && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ładowanie klientów...</p>}
                         {errorClients && <p className="mt-1 text-xs text-red-500">{errorClients}</p>}
                         {formik.touched.clientId && formik.errors.clientId ? (
                             <p className="mt-1 text-xs text-red-500">{formik.errors.clientId}</p>
                         ) : null}
                     </div>
                 )}


                {/* Start Date & Time */}
                <div>
                    <label htmlFor="startAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data i Godzina Rozpoczęcia*
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="datetime-local"
                            id="startAt"
                            name="startAt"
                            value={formik.values.startAt instanceof Date && !isNaN(formik.values.startAt) ? formik.values.startAt.toISOString().slice(0, 16) : ''}
                            onChange={(e) => formik.setFieldValue('startAt', e.target.value ? new Date(e.target.value) : null)}
                            onBlur={formik.handleBlur}
                            className={`pl-10 block w-full rounded-md shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${formik.touched.startAt && formik.errors.startAt ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-sky-500 focus:ring-sky-500'}`}
                            min={new Date().toISOString().slice(0, 16)} // Prevent past dates for new entries
                        />
                    </div>
                    {formik.touched.startAt && formik.errors.startAt ? (
                        <p className="mt-1 text-xs text-red-500">{formik.errors.startAt}</p>
                    ) : null}
                </div>

                {/* Notes (maps to Description) */}
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notatki Wewnętrzne / Informacje dla Klienta (opcjonalnie)
                    </label>
                    <div className="relative">
                         <Info className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <textarea
                            id="notes"
                            name="notes" // Keep name as notes for formik state
                            rows="3"
                            value={formik.values.notes}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Np. szczegóły dotyczące zlecenia, uwagi dla siebie..."
                            className={`pl-10 block w-full rounded-md shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${formik.touched.notes && formik.errors.notes ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-sky-500 focus:ring-sky-500'}`}
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
                        disabled={formik.isSubmitting || loadingServices || loadingClients || (isEditMode && !formik.dirty)} // Disable if not dirty in edit mode
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                        {formik.isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                {isEditMode ? 'Aktualizowanie...' : 'Zapisywanie...'}
                            </>
                        ) : (
                            isEditMode ? 'Zapisz Zmiany' : 'Utwórz Zlecenie / Zablokuj'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ProviderTaskCreateOrder;
