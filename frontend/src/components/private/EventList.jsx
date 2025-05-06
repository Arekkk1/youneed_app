import React, { useState, useEffect, useRef, useCallback } from 'react';
        import { useParams, useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate
        import Slider from 'react-slick';
        import 'slick-carousel/slick/slick.css';
        import 'slick-carousel/slick/slick-theme.css';
        import api from '../../api'; // Use configured api instance
        import UserCard from './Provider/Users/UserCard'; // Assuming correct path
        import ProviderTaskCreateOrder from './Provider/TaskCreateOrder'; // Assuming correct path
        import ClientTaskCreateOrder from './Client/TaskCreateOrder'; // Assuming correct path
        import ProviderSingleEventWrapper from './Provider/SingleEvent'; // Use the wrapper
        import ClientSingleEvent from './Client/SingleEvent'; // Assuming correct path
        import { toast } from 'react-hot-toast';
        import { Loader, AlertCircle, Edit, Trash2, Calendar, Lock, X as CloseIcon, Clock as ClockIcon } from 'lucide-react'; // Added ClockIcon

        // Helper function to check if a time slot overlaps with an order
        const isSlotOverlapping = (slotTime, orderStart, orderEnd, orderDuration) => {
            const slotStart = new Date(slotTime);
            const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000); // Assume 30 min slots
            const orderStartTime = new Date(orderStart);
            // Use endAt if available, otherwise calculate based on startAt + duration
            const orderEndTime = orderEnd ? new Date(orderEnd) : new Date(orderStartTime.getTime() + (orderDuration || 30) * 60 * 1000);

            // Check for overlap: order starts before slot ends AND order ends after slot starts
            return orderStartTime < slotEnd && orderEndTime > slotStart;
        };


        function EventList() {
            const { serviceProviderId } = useParams(); // Provider ID from URL (when client/admin views specific provider)
            const location = useLocation();
            const navigate = useNavigate(); // For potential redirects and clearing state
            const passedServiceId = location.state?.serviceId || location.state?.preselectedServiceId; // Get serviceId passed from ProviderSearch (if any) - Added preselectedServiceId
            const intent = location.state?.intent; // Get intent passed from ProviderSearch

            // --- LOCALSTORAGE WORKAROUND START ---
            const storedRole = localStorage.getItem('role');
            const storedUserId = localStorage.getItem('userId');
            const storedToken = localStorage.getItem('token');
            // --- LOCALSTORAGE WORKAROUND END ---

            // Determine role and context using localStorage values
            const currentUserRole = storedRole; // 'client', 'provider', 'admin' or null
            const currentUserId = storedUserId ? parseInt(storedUserId, 10) : null;

            // --- VIEW CONTEXT DETERMINATION ---
            const isViewingSpecificProvider = !!serviceProviderId;
            const isGlobalClientView = currentUserRole === 'client' && !isViewingSpecificProvider;
            const providerIdToFetch = isViewingSpecificProvider
                ? parseInt(serviceProviderId, 10)
                : (currentUserRole === 'provider' ? currentUserId : null);

            // --- State ---
            const [date, setDate] = useState(new Date());
            const [events, setEvents] = useState([]);
            const [feedback, setFeedback] = useState([]);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState('');
            const [isModalOpen, setIsModalOpen] = useState(false);
            const [modalMode, setModalMode] = useState('create');
            const [selectedHourForModal, setSelectedHourForModal] = useState(null);
            const [editingEvent, setEditingEvent] = useState(null);
            const [serviceIdForModal, setServiceIdForModal] = useState(passedServiceId || null);
            const [hoursArray, setHoursArray] = useState([]);
            const [allDayArray, setAllDayArray] = useState([]);
            const [dateRanges, setDateRanges] = useState([]);

            const sliderRef = useRef(null);
            const sliderSecondRef = useRef(null);

            // --- Effects ---

            useEffect(() => { generateHoursArray(); }, []);
            useEffect(() => { generateDayArray(); }, []);
            useEffect(() => { if (allDayArray.length > 0) generateDateRanges(); }, [allDayArray]);
            useEffect(() => {
                if (allDayArray.length > 0 && sliderRef.current) {
                    const todayIndex = allDayArray.findIndex((item) => isToday(item));
                    if (todayIndex !== -1) {
                        setTimeout(() => sliderRef.current?.slickGoTo(todayIndex), 150);
                    }
                }
            }, [allDayArray]);

            // Fetch events based on view context
            const fetchEventsForDate = useCallback(async (fetchDate) => {
                setLoading(true);
                setError('');
                const formattedDate = fetchDate.toISOString().split('T')[0];
                const params = { date: formattedDate };
                let fetchDescription = '';

                if (isGlobalClientView) {
                    fetchDescription = `global client view (Client ID: ${currentUserId})`;
                    // Backend uses authenticated user ID
                } else if (providerIdToFetch && !isNaN(providerIdToFetch)) {
                    params.providerId = providerIdToFetch;
                    fetchDescription = `provider view (Provider ID: ${providerIdToFetch})`;
                } else {
                    console.warn("[EventList fetchEventsForDate] Invalid context", { isGlobalClientView, providerIdToFetch });
                    setError("Nie można określić kontekstu kalendarza.");
                    setLoading(false);
                    setEvents([]);
                    return;
                }

                try {
                    if (!storedToken) throw new Error("Brak tokenu uwierzytelniającego.");
                    const response = await api.get('/events', { params });
                    if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
                        const fetchedEvents = response.data.data.map(event => ({
                            ...event,
                            start: new Date(event.startAt || event.start), // Use startAt or start
                            end: event.endAt ? new Date(event.endAt) : null, // Use endAt
                            // Ensure nested objects are present or default to null/empty
                            service: event.service || null,
                            client: event.client || null,
                        }));
                        setEvents(fetchedEvents);
                    } else {
                        throw new Error(response.data?.message || 'Nieprawidłowa odpowiedź serwera');
                    }
                } catch (err) {
                    console.error(`[EventList fetchEventsForDate] (${fetchDescription}): Błąd:`, err);
                    const errorMsg = err.response?.data?.message || err.message || 'Nie udało się pobrać wydarzeń.';
                    setError(errorMsg);
                    toast.error(`Błąd pobierania wydarzeń: ${errorMsg}`);
                    setEvents([]);
                } finally {
                    setLoading(false);
                }
            }, [isGlobalClientView, providerIdToFetch, currentUserId, storedToken]);

            // Fetch feedback only when viewing a specific provider
            const fetchFeedbackForProvider = useCallback(async () => {
                if (!isViewingSpecificProvider || !providerIdToFetch || isNaN(providerIdToFetch)) return;
                try {
                    if (!storedToken) throw new Error("Brak tokenu uwierzytelniającego.");
                    const response = await api.get('/feedback', { params: { providerId: providerIdToFetch } });
                    if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
                        setFeedback(response.data.data);
                    } else {
                        throw new Error(response.data?.message || 'Nieprawidłowa odpowiedź serwera');
                    }
                } catch (err) {
                    console.error('[EventList fetchFeedback] Błąd:', err);
                    toast.error(err.response?.data?.message || 'Nie udało się pobrać opinii.');
                    setFeedback([]);
                }
            }, [isViewingSpecificProvider, providerIdToFetch, storedToken]);

            // Effect to trigger fetches
            useEffect(() => {
                if (!storedToken) {
                    setLoading(false);
                    setEvents([]);
                    setFeedback([]);
                    setError("Nie jesteś zalogowany lub Twoja sesja wygasła.");
                    return;
                }
                if (isGlobalClientView || (providerIdToFetch && !isNaN(providerIdToFetch))) {
                    fetchEventsForDate(date);
                    if (isViewingSpecificProvider) fetchFeedbackForProvider();
                    else setFeedback([]);
                } else {
                    console.warn("[EventList EFFECT] Token exists, but context invalid.", { currentUserRole, isViewingSpecificProvider, providerIdToFetch });
                    setLoading(false);
                    setEvents([]);
                    setFeedback([]);
                    // Set appropriate error based on context
                    if (currentUserRole === 'client' && !isViewingSpecificProvider) setError("Wystąpił błąd ładowania Twojego kalendarza.");
                    else if (currentUserRole === 'provider' && !currentUserId) setError("Nie udało się zidentyfikować profilu usługodawcy.");
                    else if (isViewingSpecificProvider && (!providerIdToFetch || isNaN(providerIdToFetch))) setError("Nieprawidłowy ID usługodawcy w URL.");
                    else if (currentUserRole === 'admin' && !isViewingSpecificProvider) setError("Wybierz usługodawcę (Admin).");
                    else setError("Nie można określić kontekstu kalendarza.");
                }
            }, [date, isGlobalClientView, providerIdToFetch, isViewingSpecificProvider, fetchEventsForDate, fetchFeedbackForProvider, storedToken, currentUserRole, currentUserId, navigate]);

            // Effect to open modal based on intent
            useEffect(() => {
                if (intent === 'createOrder' && currentUserRole === 'client' && isViewingSpecificProvider) {
                    handleOpenModal('create', null, null);
                    navigate(location.pathname, { replace: true, state: {} }); // Clear intent
                }
            }, [intent, currentUserRole, isViewingSpecificProvider, navigate, location.pathname]);


            // --- Date/Time Generation (unchanged) ---
            const generateHoursArray = () => { /* ... */ };
            const createDayObject = (day, name) => { /* ... */ };
            const isToday = (dayObject) => { /* ... */ };
            const generateDayArray = () => { /* ... */ };
            const generateDateRanges = () => { /* ... */ };
            // Re-add implementations if needed, they were removed for brevity
             useEffect(() => { generateHoursArray(); }, []);
             useEffect(() => { generateDayArray(); }, []);
             useEffect(() => { if (allDayArray.length > 0) generateDateRanges(); }, [allDayArray]);
             useEffect(() => {
                 if (allDayArray.length > 0 && sliderRef.current) {
                     const todayIndex = allDayArray.findIndex((item) => isToday(item));
                     if (todayIndex !== -1) {
                         setTimeout(() => sliderRef.current?.slickGoTo(todayIndex), 150);
                     }
                 }
             }, [allDayArray]);
             const generateHoursArrayImpl = () => {
                 const newHoursArray = [];
                 for (let i = 0; i < 24; i++) {
                     newHoursArray.push(`${i.toString().padStart(2, '0')}:00`);
                     newHoursArray.push(`${i.toString().padStart(2, '0')}:30`);
                 }
                 setHoursArray(newHoursArray.map((hour) => ({ hour, isTouching: false, hidden: '' })));
             };
             const createDayObjectImpl = (day, name) => {
                 const formattedDay = day.getDate().toString().padStart(2, '0');
                 const dateValue = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                 return { day: formattedDay, dateValue: dateValue, dayName: name };
             };
             const isTodayImpl = (dayObject) => {
                 const today = new Date();
                 today.setHours(0, 0, 0, 0);
                 return dayObject.dateValue.getTime() === today.getTime();
             };
             const generateDayArrayImpl = () => {
                 const todayDate = new Date();
                 todayDate.setHours(0, 0, 0, 0);
                 const tempDayArray = [];
                 const daysBefore = 30;
                 const daysAfter = 365;
                 for (let i = daysBefore; i >= 1; i--) {
                     const day = new Date(todayDate);
                     day.setDate(todayDate.getDate() - i);
                     const dayName = day.toLocaleDateString('pl-PL', { weekday: 'short' });
                     tempDayArray.push(createDayObjectImpl(day, dayName));
                 }
                 for (let i = 0; i < daysAfter; i++) {
                     const day = new Date(todayDate);
                     day.setDate(todayDate.getDate() + i);
                     const dayName = day.toLocaleDateString('pl-PL', { weekday: 'short' });
                     tempDayArray.push(createDayObjectImpl(day, dayName));
                 }
                 setAllDayArray(tempDayArray);
             };
             const generateDateRangesImpl = () => {
                  if (allDayArray.length === 0) return;
                  const ranges = [];
                  let currentMonth = -1;
                  let currentYear = -1;
                  allDayArray.forEach((dayObj, index) => {
                      const dayDate = dayObj.dateValue;
                      const monthIndex = dayDate.getMonth();
                      const yearIndex = dayDate.getFullYear();
                      if (monthIndex !== currentMonth || yearIndex !== currentYear) {
                          currentMonth = monthIndex;
                          currentYear = yearIndex;
                          const nameMonth = dayDate.toLocaleString('pl-PL', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase());
                          // Find the actual index of the first day of this month in allDayArray
                          const firstDayOfMonth = new Date(yearIndex, monthIndex, 1);
                          const dayIndex = allDayArray.findIndex(d => d.dateValue.getTime() === firstDayOfMonth.getTime());
                          // Only add if the first day exists in our array (handles edge cases)
                          if (dayIndex !== -1) {
                              ranges.push({ nameMonth, index: dayIndex });
                          }
                      }
                  });
                  setDateRanges(ranges);
             };
             // Call implementations
             useEffect(() => { generateHoursArrayImpl(); }, []);
             useEffect(() => { generateDayArrayImpl(); }, []);
             useEffect(() => { if (allDayArray.length > 0) generateDateRangesImpl(); }, [allDayArray]);
             useEffect(() => {
                 if (allDayArray.length > 0 && sliderRef.current) {
                     const todayIndex = allDayArray.findIndex((item) => isTodayImpl(item));
                     if (todayIndex !== -1) {
                         // Use setTimeout to ensure slick is ready
                         setTimeout(() => sliderRef.current?.slickGoTo(todayIndex), 150);
                     }
                 }
             }, [allDayArray]);


            // --- Event Handlers (Modal, Delete, Edit - largely unchanged) ---
            const handleOpenModal = (mode = 'create', hour = null, eventData = null) => {
                if (isGlobalClientView && mode === 'create') {
                    toast.error("Przejdź do kalendarza usługodawcy, aby dodać zlecenie.");
                    return;
                }
                if (mode === 'create' && currentUserRole === 'client' && isViewingSpecificProvider && !providerIdToFetch) {
                    toast.error("Błąd: Brak ID usługodawcy.");
                    return;
                }
                setModalMode(mode);
                setSelectedHourForModal(hour);
                setEditingEvent(eventData);
                setIsModalOpen(true);
            };
         
            // Re-add implementations if needed
             const handleCloseModalImpl = () => {
                 setIsModalOpen(false);
                 setSelectedHourForModal(null);
                 setEditingEvent(null);
                 // Keep serviceIdForModal as it's tied to context
             };
             const handleDataSavedImpl = () => { // Refresh data after modal actions
                 handleCloseModalImpl();
                 fetchEventsForDate(date); // Refresh events based on current context
             };
             const handleOrderDeletedImpl = (deletedOrderId) => { // Refresh data after delete
                 fetchEventsForDate(date); // Refresh events based on current context
                 toast.success('Zlecenie usunięte/anulowane.');
             };
             const handleEditOrderImpl = (eventItem) => {
                  // Allow client to edit their own orders even in global view? Maybe not.
                  // Provider/Admin can edit.
                  if (currentUserRole === 'client') {
                      toast.error("Skontaktuj się z usługodawcą, aby zmodyfikować zlecenie.");
                      return;
                  }
                  // Pass the full event object to the modal
                  handleOpenModal('edit', null, eventItem);
             };
             const handleDeleteOrderAdminImpl = async (orderId) => {
                 if (!window.confirm(`Admin: Czy na pewno chcesz usunąć zlecenie ID: ${orderId}?`)) return;
                 const toastId = toast.loading(`Admin: Usuwanie zlecenia ${orderId}...`);
                 try {
                     // Assuming generic delete handles cancellation/deletion by admin
                     await api.delete(`/orders/${orderId}`);
                     toast.success(`Admin: Zlecenie ${orderId} usunięte/anulowane!`, { id: toastId });
                     handleOrderDeletedImpl(orderId); // Refresh list
                 } catch (err) {
                     console.error("Admin delete error:", err);
                     toast.error(err.response?.data?.message || err.message || 'Błąd usuwania.', { id: toastId });
                 }
             };
             const onClickMonthButtonImpl = (range) => {
                 if (sliderRef.current && range.index !== -1 && range.index < allDayArray.length) {
                     sliderRef.current.slickGoTo(range.index);
                     onSelectDay(allDayArray[range.index].dateValue); // Also update the selected day
                 }
             };
             const onSelectDayImpl = (selectedDateValue) => {
                 setDate(selectedDateValue); // Update the main date state
                 // Sync month slider
                 const selectedMonth = selectedDateValue.getMonth();
                 const selectedYear = selectedDateValue.getFullYear();
                 const monthRangeIndex = dateRanges.findIndex((range) => {
                      // Ensure range.index is valid before accessing allDayArray
                      if (range.index < 0 || range.index >= allDayArray.length) return false;
                      const rangeDate = new Date(allDayArray[range.index].dateValue);
                      return rangeDate.getMonth() === selectedMonth && rangeDate.getFullYear() === selectedYear;
                 });
                 if (monthRangeIndex !== -1 && sliderSecondRef.current) {
                     // Use setTimeout to ensure slick is ready
                     setTimeout(() => sliderSecondRef.current?.slickGoTo(monthRangeIndex), 150);
                 }
             };
             // Assign implementations
             const handleCloseModal = handleCloseModalImpl;
             const handleDataSaved = handleDataSavedImpl;
             const handleOrderDeleted = handleOrderDeletedImpl;
             const handleEditOrder = handleEditOrderImpl;
             const handleDeleteOrderAdmin = handleDeleteOrderAdminImpl;
             const onClickMonthButton = onClickMonthButtonImpl;
             const onSelectDay = onSelectDayImpl;


         
            // Re-add implementations
             const isInProgressImpl = (startAt, endAt, duration) => {
                 const start = new Date(startAt);
                 const end = endAt ? new Date(endAt) : new Date(start.getTime() + (duration || 30) * 60 * 1000);
                 const now = new Date();
                 return start <= now && now < end;
             };
             const isDoneImpl = (endAt, startAt, duration) => {
                 const end = endAt ? new Date(endAt) : new Date(new Date(startAt).getTime() + (duration || 30) * 60 * 1000);
                 if (!end) return false; // Should not happen if startAt is valid
                 const now = new Date();
                 return end <= now;
             };
             const isInProgress = isInProgressImpl;
             const isDone = isDoneImpl;



             // Re-add implementations
             const slickConfigImpl = {
                 className: 'daySlick', centerMode: true, centerPadding: '0px', slidesToShow: 10, focusOnSelect: true, infinite: false, arrows: false,
                 responsive: [ { breakpoint: 1024, settings: { slidesToShow: 7 } }, { breakpoint: 600, settings: { slidesToShow: 5 } }, { breakpoint: 480, settings: { slidesToShow: 5 } }, ],
             };
             const monthSliderSettingsImpl = {
                 className: 'month', centerMode: true, centerPadding: '60px', slidesToShow: 5, focusOnSelect: true, infinite: false, arrows: false,
                 responsive: [ { breakpoint: 1024, settings: { slidesToShow: 5, centerPadding: '40px' } }, { breakpoint: 600, settings: { slidesToShow: 3, centerPadding: '30px' } }, { breakpoint: 480, settings: { slidesToShow: 3, centerPadding: '20px' } }, ],
             };
             const slickConfig = slickConfigImpl;
             const monthSliderSettings = monthSliderSettingsImpl;


            // --- Component Selection based on Role (unchanged) ---
            let TaskCreateComponent = null;
            if (currentUserRole) {
                if (currentUserRole === 'provider' || currentUserRole === 'admin') TaskCreateComponent = ProviderTaskCreateOrder;
                else if (currentUserRole === 'client') TaskCreateComponent = ClientTaskCreateOrder;
            }

            // --- Render Logic ---
            const renderSlotContent = (hourObj) => {
                if (!currentUserRole) {
                    return <div className="h-10 text-center text-gray-500 text-sm flex items-center justify-center">Zaloguj się</div>;
                }

                const [hourPart, minute] = hourObj.hour.split(':');
                const slotDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(hourPart), parseInt(minute));

                // Find events starting exactly at this slot time
                const startingEvents = events.filter(event => {
                    if (!event.start) return false;
                    const orderStart = new Date(event.start);
                    return orderStart.getHours() === parseInt(hourPart) && orderStart.getMinutes() === parseInt(minute);
                });

                // Find any overlapping event with relevant status (accepted or pending)
                const overlappingBookedEvent = events.find(event =>
                    event.start &&
                    (event.status === 'accepted' || event.status === 'pending') && // Check for accepted or pending
                    isSlotOverlapping(slotDateTime, event.start, event.end, event.service?.duration)
                );

                const isPastSlot = slotDateTime < new Date();

                // 1. Render starting events using appropriate component
                if (startingEvents.length > 0) {
                    return startingEvents.map((item) => {
                        // Determine component based on role
                        const EventComp = (currentUserRole === 'provider' || currentUserRole === 'admin') ? ProviderSingleEventWrapper : ClientSingleEvent;
                        if (!EventComp) return <div key={item.id}>Błąd ładowania...</div>;

                        const commonProps = {
                            key: item.id,
                            item: item,
                            hour: hourObj.hour,
                            onOrderUpdated: handleDataSaved,
                            onOrderDeleted: handleOrderDeleted,
                            onEditOrder: handleEditOrder,
                            isGlobalClientView: isGlobalClientView,
                            isViewingProvider: isViewingSpecificProvider,
                            isInProgress: isInProgress(item.start, item.end, item.service?.duration),
                            isDone: isDone(item.end, item.start, item.service?.duration),
                        };
                        const adminProps = currentUserRole === 'admin' ? { onDeleteAdmin: handleDeleteOrderAdmin, isAdminView: true } : {};

                        return <EventComp {...commonProps} {...adminProps} />;
                    });
                }

                // 2. Render yellow button for overlapping booked slots (if not already rendered as starting)
                // Status 'accepted' or 'pending' indicates booked/blocked time
                else if (overlappingBookedEvent) {
                    const eventName = overlappingBookedEvent.service?.name || overlappingBookedEvent.title || 'Zarezerwowane';
                    return (
                        <button
                            disabled // Non-functional button
                            className="w-full h-full p-2 rounded-lg bg-yellow-500 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 text-center text-sm font-medium flex items-center justify-center gap-1 cursor-not-allowed truncate"
                            title={eventName} // Show full name on hover
                        >
                            <ClockIcon size={14} className="flex-shrink-0" />
                            <span className="truncate">{eventName}</span>
                        </button>
                    );
                }

                // 3. Handle empty slots (past or future)
                else {
                    if (isPastSlot && currentUserRole !== 'admin') { // Admin might still want to interact with past slots?
                        return <div className="text-gray-400 dark:text-gray-500 p-2 text-center text-sm italic h-full flex items-center justify-center">Miniony termin</div>;
                    }

                    // Determine if the slot is clickable based on role and context
                    const canBook = (currentUserRole === 'client' && isViewingSpecificProvider) ||
                                    (currentUserRole === 'provider' && !isViewingSpecificProvider) ||
                                    (currentUserRole === 'admin' && isViewingSpecificProvider);

                    if (canBook) {
                        let buttonText = "Wolne";
                        if (currentUserRole === 'client') buttonText += " (+ Dodaj zlecenie)";
                        else if (currentUserRole === 'provider') buttonText += " (+ Dodaj)";
                        else if (currentUserRole === 'admin') buttonText += " (Admin: + Dodaj)";

                        return (
                             <button
                                onClick={() => handleOpenModal('create', hourObj.hour)}
                                className="w-full h-full p-2 rounded-lg border-2 border-dashed border-gray-600 text-center text-gray-400 hover:bg-gray-700 hover:border-sky-500 transition duration-150 text-sm"
                            >
                                <span className="font-semibold">{buttonText}</span>
                            </button>
                        );
                    } else {
                        // Non-clickable "Wolne" (e.g., global client view)
                        const label = isGlobalClientView ? "Wolne (Twoje)" : "Wolne";
                        return <div className="text-gray-500 p-2 text-center rounded-lg border border-dashed border-gray-600 h-full flex items-center justify-center">{label}</div>;
                    }
                }
            };


            // Determine background color based on context
            const bgColor = isViewingSpecificProvider ? 'bg-neutral-100 dark:bg-neutral-900' : 'bg-slate-200 dark:bg-slate-800';
            const textColor = isViewingSpecificProvider ? 'text-black dark:text-white' : 'text-black dark:text-white';

            // Determine Page Title based on context
            let pageTitle = 'Kalendarz'; // Default
            // TODO: Fetch provider name if viewing specific provider
            const providerName = isViewingSpecificProvider ? `Usługodawcy #${providerIdToFetch}` : '';

            if (!storedToken) pageTitle = 'Brak dostępu';
            else if (isGlobalClientView) pageTitle = 'Mój Kalendarz Zleceń';
            else if (currentUserRole === 'client' && isViewingSpecificProvider) pageTitle = `Kalendarz ${providerName}`;
            else if (currentUserRole === 'provider') pageTitle = 'Twój Kalendarz';
            else if (currentUserRole === 'admin' && isViewingSpecificProvider) pageTitle = `Kalendarz ${providerName} (Admin)`;


            return (
                <section className={`${bgColor} ${textColor} overflow-hidden min-h-screen flex flex-col`}>
                    {/* Navbar placeholder */}
                    {/* <Navbar color={navColor} lgColor={'fill-sky-500'} /> */}

                    <main className={`flex-1 items-center content-center justify-center overflow-hidden duration-300 ${isModalOpen ? 'blur-sm pointer-events-none' : 'blur-0'}`}>
                        <div className="text-center my-4 md:my-6">
                            <p className={`whitespace-nowrap text-xl md:text-2xl font-bold ${isViewingSpecificProvider ? 'text-neutral-700 dark:text-neutral-200' : 'text-gray-800 dark:text-gray-100'}`}>
                                {pageTitle}
                            </p>
                            <p className="text-lg text-gray-600 dark:text-gray-400">
                                {date.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 mx-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2 text-sm justify-center dark:bg-red-900 dark:text-red-200 dark:border-red-700">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        {/* Month Slider */}
                        <div className="flex flex-col relative mb-4 px-4">
                            <div className={`absolute z-[1] right-4 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l ${isViewingSpecificProvider ? 'from-neutral-100 dark:from-neutral-900' : 'from-slate-200 dark:from-slate-800'} to-transparent pointer-events-none`}></div>
                            <div className={`absolute z-[1] left-4 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r ${isViewingSpecificProvider ? 'from-neutral-100 dark:from-neutral-900' : 'from-slate-200 dark:from-slate-800'} to-transparent pointer-events-none`}></div>
                            <Slider {...monthSliderSettings} ref={sliderSecondRef}>
                                {dateRanges.map((range, index) => (
                                    <div key={index}>
                                        <h3 className="cursor-pointer text-center font-medium text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400" onClick={() => onClickMonthButton(range)}>
                                            {range.nameMonth}
                                        </h3>
                                    </div>
                                ))}
                            </Slider>
                        </div>

                        {/* Day Slider */}
                        <div className="text-element-meetings mb-4 px-4">
                            <div className="whitespace-nowrap py-1 pb-5 relative">
                                <div className={`absolute z-[1] right-4 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l ${isViewingSpecificProvider ? 'from-neutral-100 dark:from-neutral-900' : 'from-slate-200 dark:from-slate-800'} to-transparent pointer-events-none`}></div>
                                <div className={`absolute z-[1] left-4 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r ${isViewingSpecificProvider ? 'from-neutral-100 dark:from-neutral-900' : 'from-slate-200 dark:from-slate-800'} to-transparent pointer-events-none`}></div>
                                <Slider {...slickConfig} ref={sliderRef}>
                                    {allDayArray.map((days, index) => (
                                        <div key={index}>
                                            <div className="text-center px-1">
                                                <div className="cursor-pointer" onClick={() => onSelectDay(days.dateValue)}>
                                                    <div className="py-2 mx-auto text-center font-medium text-gray-500 dark:text-gray-400 text-xs uppercase">
                                                        {days.dayName.slice(0, 3)}
                                                    </div>
                                                    <div className={`w-10 h-10 mx-auto daySlick text-sm flex items-center justify-center rounded-full font-semibold duration-300 transition-all ease-in ${ days.dateValue.toDateString() === date.toDateString() ? 'bg-sky-600 text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600' } ${isToday(days) ? 'border-2 border-sky-500' : ''}`}>
                                                        {days.day}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </Slider>
                            </div>

                            {/* Orders/Hours List */}
                            <div className="bg-gray-800 dark:bg-gray-900 text-white pb-6 px-2 md:px-4 rounded-lg shadow-inner">
                                {/* Add buttons for Provider/Admin */}
                                 {(currentUserRole === 'provider' && !isViewingSpecificProvider) && (
                                    <div className="flex justify-center py-4 border-b border-gray-700 mb-4">
                                        <button
                                            className="flex items-center gap-2 mx-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md cursor-pointer transition-all duration-300 ease-in text-sm font-medium"
                                            onClick={() => handleOpenModal('create')}
                                        >
                                            + Dodaj Blokadę / Zlecenie
                                        </button>
                                    </div>
                                )}
                                 {currentUserRole === 'admin' && isViewingSpecificProvider && (
                                    <div className="flex justify-center py-4 border-b border-gray-700 mb-4">
                                        <button
                                            className="flex items-center gap-2 mx-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-pointer transition-all duration-300 ease-in text-sm font-medium"
                                            onClick={() => handleOpenModal('create')}
                                        >
                                            + Dodaj Zlecenie (Admin)
                                        </button>
                                    </div>
                                 )}

                                {/* Show feedback only if viewing specific provider */}
                                {isViewingSpecificProvider && feedback.length > 0 && (
                                    <div className="w-full flex py-4 justify-center scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 overflow-x-auto relative z-[1] border-b border-gray-700 mb-4">
                                        {feedback.map((fb) => (
                                            <div key={fb.id} className="flex-shrink-0 w-64 mx-2">
                                                <UserCard {...fb} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Hours Grid */}
                                <div className="mt-2 mx-1">
                                    {loading ? (
                                        <div className="flex justify-center items-center h-64">
                                            <Loader size={32} className="animate-spin text-sky-500" />
                                            <p className="ml-3 text-gray-400">Ładowanie terminów...</p>
                                        </div>
                                    ) : !storedToken ? (
                                        <p className="text-center text-gray-500 py-10">Musisz być zalogowany.</p>
                                    ) : hoursArray.length > 0 ? (
                                        hoursArray.map((hourObj, index) => (
                                            <div className="flex w-full mx-auto mb-2 min-h-[4rem]" key={index}> {/* Ensure consistent height */}
                                                <div className="flex-shrink-0 w-16 border-r border-gray-700 pr-2 text-right">
                                                    <div className="content-center items-center pt-2 font-medium text-sm text-gray-400">
                                                        {hourObj.hour}
                                                    </div>
                                                </div>
                                                <div className="flex-grow w-full ml-2">
                                                    {renderSlotContent(hourObj)}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-gray-500 py-10">Brak przedziałów czasowych.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Unified Modal */}
                    {isModalOpen && currentUserRole && TaskCreateComponent && (
                        <div
                            className={`flex fixed inset-0 z-50 items-center justify-center transition-opacity duration-300 ease-in ${
                                isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                        >
                            <div className="absolute inset-0 bg-black bg-opacity-70" onClick={handleCloseModal}></div>
                            <div className="relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
                                <button
                                    onClick={handleCloseModal}
                                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-20"
                                    aria-label="Zamknij"
                                >
                                    <CloseIcon size={24} />
                                </button>
                                <TaskCreateComponent
                                    sendValue={handleCloseModal}
                                    selectedDate={date}
                                    selectedHour={selectedHourForModal}
                                    onOrderCreated={handleDataSaved}
                                    onOrderUpdated={handleDataSaved}
                                    initialData={editingEvent} // Pass full event object for editing
                                    serviceProviderId={isGlobalClientView ? null : providerIdToFetch}
                                    // Pass correct clientId based on context and mode
                                    clientId={isEditMode ? editingEvent?.clientId : (currentUserRole === 'client' ? currentUserId : null)}
                                    isAdmin={currentUserRole === 'admin'}
                                    initialServiceId={serviceIdForModal} // Pass pre-selected service ID
                                />
                            </div>
                        </div>
                    )}

                </section>
            );
        }

        export default EventList;
