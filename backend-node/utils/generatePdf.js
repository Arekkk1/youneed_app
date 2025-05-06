const PDFDocument = require('pdfkit');

/**
 * Generates a PDF document from report data.
 *
 * @param {Array<Object>} data - An array of objects representing report rows.
 * @param {Object} options - Optional metadata for the report.
 * @param {number} options.providerId - The ID of the provider.
 * @param {Date} options.startDate - The start date of the report period.
 * @param {Date} options.endDate - The end date of the report period.
 * @returns {PDFDocument} The PDFDocument instance (needs to be piped and ended in the route).
 */
const generatePdf = async (data, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      // Register listeners for data and end events
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        // This part might not be strictly necessary if piping directly in the route,
        // but useful if we needed the buffer for something else.
        // For direct piping, the route handler will manage the stream.
      });
      doc.on('error', (err) => {
        console.error('Error generating PDF stream:', err);
        reject(err); // Reject the promise on stream error
      });

      // --- PDF Content Generation ---

      // Header
      doc
        .fontSize(18)
        .text('Raport Zamówień', { align: 'center' })
        .moveDown();

      // Metadata
      if (options.providerId) {
        doc.fontSize(10).text(`ID Dostawcy: ${options.providerId}`);
      }
      if (options.startDate && options.endDate) {
        doc.fontSize(10).text(
          `Okres: ${options.startDate.toLocaleDateString('pl-PL')} - ${options.endDate.toLocaleDateString('pl-PL')}`
        )
        .moveDown(2);
      } else {
        doc.moveDown(2);
      }


      // Table Header
      const tableTop = doc.y;
      const itemX = 50; // Starting X position
      const dateX = 100;
      const clientX = 200;
      const serviceX = 350;
      const priceX = 480; // Adjusted for potential currency symbol

      doc
        .fontSize(10)
        .font('Helvetica-Bold') // Use a standard bold font
        .text('ID', itemX, tableTop)
        .text('Data', dateX, tableTop)
        .text('Klient', clientX, tableTop)
        .text('Usługa', serviceX, tableTop)
        .text('Cena', priceX, tableTop, { align: 'right' })
        .moveDown();

      // Draw header line
      doc
        .moveTo(itemX, doc.y)
        .lineTo(priceX + 50, doc.y) // Extend line slightly past last column
        .stroke()
        .moveDown(0.5);

      // Table Rows
      doc.font('Helvetica'); // Switch back to regular font
      data.forEach(item => {
        const y = doc.y;

        // Ensure data exists before trying to access properties
        const orderId = item['Order ID'] ?? 'N/A';
        const date = item['Date'] ?? 'N/A';
        const clientName = item['Client Name'] ?? 'N/A';
        const serviceName = item['Service Name'] ?? 'N/A';
        const price = item['Price'] != null ? `${item['Price'].toFixed(2)} PLN` : 'N/A'; // Format price

        doc
          .fontSize(9) // Slightly smaller font for data
          .text(orderId.toString(), itemX, y, { width: dateX - itemX - 5 }) // Add width to prevent overlap
          .text(date, dateX, y, { width: clientX - dateX - 5 })
          .text(clientName, clientX, y, { width: serviceX - clientX - 5 })
          .text(serviceName, serviceX, y, { width: priceX - serviceX - 5 })
          .text(price, priceX, y, { align: 'right', width: 50 }); // Align right

        // Draw row line (optional)
        // doc.moveTo(itemX, doc.y + 3).lineTo(priceX + 50, doc.y + 3).strokeColor("#cccccc").stroke().moveDown(0.5);

        doc.moveDown(0.8); // Add spacing between rows

        // Handle page breaks gracefully
        if (doc.y > 700) { // Check if near bottom of page (adjust threshold as needed)
            doc.addPage();
            // Optionally re-draw headers on new page
            doc
              .fontSize(10)
              .font('Helvetica-Bold')
              .text('ID', itemX, 50) // Start Y position on new page
              .text('Data', dateX, 50)
              .text('Klient', clientX, 50)
              .text('Usługa', serviceX, 50)
              .text('Cena', priceX, 50, { align: 'right' })
              .moveDown();
            doc
              .moveTo(itemX, doc.y)
              .lineTo(priceX + 50, doc.y)
              .stroke()
              .moveDown(0.5);
            doc.font('Helvetica'); // Switch back
        }

      });

      // --- Finalize PDF ---
      // IMPORTANT: Do NOT call doc.end() here.
      // The route handler needs the stream open to pipe it to the response.
      // The route handler will call doc.end() after piping.
      resolve(doc); // Resolve the promise with the document instance

    } catch (error) {
      console.error('Error creating PDF document instance:', error);
      reject(error); // Reject the promise on initial setup error
    }
  });
};

module.exports = generatePdf;
