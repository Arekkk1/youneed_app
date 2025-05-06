const papaparse = require('papaparse');

/**
 * Converts an array of JavaScript objects into a CSV formatted string.
 *
 * @param {Array<Object>} data - An array of objects to convert. Each object represents a row,
 *                               and its keys represent the headers.
 * @returns {string} The CSV formatted string. Returns an empty string if data is invalid or empty.
 */
const generateCsv = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('generateCsv: Input data is not a non-empty array. Returning empty string.');
    return '';
  }

  try {
    // Use papaparse.unparse to convert the array of objects to a CSV string.
    // It automatically uses the keys of the first object as headers.
    const csvString = papaparse.unparse(data, {
      header: true, // Ensure headers are included based on object keys
      quotes: true, // Enclose fields in quotes if they contain delimiters or newlines
      delimiter: ",", // Standard CSV delimiter
      newline: "\r\n" // Standard CSV newline sequence
    });
    return csvString;
  } catch (error) {
    console.error('Error generating CSV string:', error);
    // Depending on requirements, you might want to throw the error
    // or return an empty string/error indicator.
    return ''; // Return empty string on error for now
  }
};

module.exports = generateCsv;
