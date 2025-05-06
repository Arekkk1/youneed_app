import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css"; // Ensure this CSS is loaded
import { Download } from 'lucide-react';
import api from '../../../api'; // Verify this path and that api.js exports correctly
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async'; // Ensure HelmetProvider wraps App in main.jsx

const ProviderReports = () => {
    const [reportType, setReportType] = useState('orders');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); // First day of current month
    const [endDate, setEndDate] = useState(new Date()); // Today
    const [format, setFormat] = useState('csv');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            toast.error('Proszę wybrać datę początkową i końcową.');
            return;
        }
        if (startDate > endDate) {
            toast.error('Data początkowa nie może być późniejsza niż data końcowa.');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Generowanie raportu...', { id: 'report-generation' }); // Use toastId

        try {
            // Corrected endpoint path used previously
            const response = await api.post('/provider/reports/generate', {
                type: reportType,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                format: format,
            }, {
                responseType: 'blob', // Important for file download
            });

            // Create a URL for the blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from content-disposition header if available
            const contentDisposition = response.headers['content-disposition'];
            let filename = `raport_${reportType}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.${format}`; // Default filename
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (filenameMatch && filenameMatch.length === 2) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            // Clean up
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Raport wygenerowany pomyślnie!', { id: toastId }); // Use toastId

        } catch (error) {
            console.error("Błąd generowania raportu:", error);
            let errorMsg = 'Nie udało się wygenerować raportu.';
            if (error.response) {
                 // Try to parse error from blob if it's JSON
                if (error.response.data instanceof Blob && error.response.data.type.includes('json')) {
                    try {
                        const errJson = JSON.parse(await error.response.data.text());
                        errorMsg = errJson.message || errorMsg;
                    } catch (parseError) {
                        // Keep default message if blob parsing fails
                    }
                } else if (error.response.data?.message) { // Check for standard JSON error
                    errorMsg = error.response.data.message;
                } else if (typeof error.response.data === 'string') {
                     errorMsg = error.response.data;
                }
            } else if (error.message) {
                errorMsg = error.message;
            }

            toast.error(`Błąd generowania raportu: ${errorMsg}`, { id: toastId }); // Use toastId
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 shadow rounded-lg">
             <Helmet>
                <title>Raporty - YouNeed</title>
                <meta name="description" content="Generuj raporty dotyczące zleceń, przychodów, klientów i usług." />
            </Helmet>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">Generuj Raporty</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Report Type */}
                <div>
                    <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Typ Raportu
                    </label>
                    <select
                        id="reportType"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        disabled={isLoading}
                    >
                        <option value="orders">Zlecenia</option>
                        <option value="revenue">Przychody</option>
                        <option value="clients">Klienci</option>
                        <option value="services">Usługi</option>
                        {/* Add more report types as needed */}
                    </select>
                </div>

                {/* Start Date */}
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data Początkowa
                    </label>
                    <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        dateFormat="yyyy-MM-dd"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        wrapperClassName="w-full"
                        disabled={isLoading}
                        popperPlacement="bottom-start" // Added for potential positioning issues
                    />
                </div>

                {/* End Date */}
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data Końcowa
                    </label>
                    <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        dateFormat="yyyy-MM-dd"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        wrapperClassName="w-full"
                        disabled={isLoading}
                        popperPlacement="bottom-start" // Added for potential positioning issues
                    />
                </div>

                {/* Format */}
                <div>
                    <label htmlFor="format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Format
                    </label>
                    <select
                        id="format"
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        disabled={isLoading}
                    >
                        <option value="csv">CSV</option>
                        <option value="pdf">PDF</option>
                    </select>
                </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleGenerateReport}
                    disabled={isLoading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors duration-150 ${
                        isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500'
                    }`}
                >
                    <Download className={`mr-2 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Generowanie...' : 'Generuj Raport'}
                </button>
            </div>
        </div>
    );
};

export default ProviderReports;
