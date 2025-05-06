const nodemailer = require('nodemailer');
    
    // Create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail', // Use environment variable or default
      auth: {
        user: process.env.EMAIL_USER, // Your email address from .env
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password from .env
      },
      // Optional: Add connection timeout and other settings
      // connectionTimeout: 5 * 60 * 1000, // 5 min
    });
    
    // Verify connection configuration on startup (optional)
    // transporter.verify((error, success) => {
    //   if (error) {
    //     console.error('Nodemailer configuration error:', error);
    //   } else {
    //     console.log('Nodemailer is ready to send emails');
    //   }
    // });
    
        // Log that verification is skipped (optional, for clarity during development)
        console.log('Nodemailer verification skipped. Configure EMAIL_USER and EMAIL_PASS in .env to enable.');
        
    module.exports = transporter;
