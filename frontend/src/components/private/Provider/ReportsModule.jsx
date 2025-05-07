import React, { useState } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const reportSchema = Yup.object({
  reportType: Yup.string().required('Wybierz typ raportu'),
  startDate: Yup.date().required('Data początkowa jest wymagana'),
  endDate: Yup.date()
    .required('Data końcowa jest wymagana')
    .min(Yup.ref('startDate'), 'Data końcowa musi być po dacie początkowej'),
});

function ProviderReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async (values, { setSubmitting }) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://49.13.68.62:5000/api/reports',
        values,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReport(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się wygenerować raportu');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Raporty</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <Formik
        initialValues={{ reportType: '', startDate: '', endDate: '' }}
        validationSchema={reportSchema}
        onSubmit={generateReport}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4 mb-6">
            <div>
              <Field
                as="select"
                name="reportType"
                className="w-full p-2 rounded-lg border border-Grayscale-Gray60"
              >
                <option value="">Wybierz typ raportu</option>
                <option value="sales">Sprzedaż</option>
                <option value="clients">Klienci</option>
                <option value="marketing">Marketing</option>
              </Field>
              <ErrorMessage name="reportType" component="p" className="text-red-500 text-sm mt-1" />
            </div>
            <div>
              <Field
                type="date"
                name="startDate"
                className="w-full p-2 rounded-lg border border-Grayscale-Gray60"
              />
              <ErrorMessage name="startDate" component="p" className="text-red-500 text-sm mt-1" />
            </div>
            <div>
              <Field
                type="date"
                name="endDate"
                className="w-full p-2 rounded-lg border border-Grayscale-Gray60"
              />
              <ErrorMessage name="endDate" component="p" className="text-red-500 text-sm mt-1" />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
            >
              Generuj raport
            </button>
          </Form>
        )}
      </Formik>
      {loading ? (
        <p>Generowanie raportu...</p>
      ) : report ? (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Wyniki raportu</h3>
          {report.totalOrders && <p>Liczba zleceń: {report.totalOrders}</p>}
          {report.totalRevenue && <p>Całkowity przychód: {report.totalRevenue} PLN</p>}
          {report.totalClients && <p>Liczba klientów: {report.totalClients}</p>}
          {report.clients && (
            <ul>
              {report.clients.map((client, index) => (
                <li key={index}>{client.name}</li>
              ))}
            </ul>
          )}
          {report.totalFeedbacks && <p>Liczba opinii: {report.totalFeedbacks}</p>}
          {report.averageRating && <p>Średnia ocena: {report.averageRating.toFixed(1)}</p>}
        </div>
      ) : null}
    </div>
  );
}

export default ProviderReports;
