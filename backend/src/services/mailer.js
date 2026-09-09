const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
});

/**
 * Sends an email with the newly generated DID and Private Key
 * @param {string} to Email address of the recipient
 * @param {string} name Name of the recipient
 * @param {string} did Generated DID
 * @param {string} privateKey Generated Private Key
 * @param {string} loginUrl URL for the application login page
 */
async function sendCredentialsEmail(to, name, did, privateKey, loginUrl) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('SMTP credentials not configured. Skipping email send.');
    console.log(`[MOCK EMAIL to ${to}] DID: ${did} | Key: ${privateKey}`);
    return;
  }

  const mailOptions = {
    from: `"DecentraVault Admin" <${process.env.SMTP_USER}>`,
    to: to,
    subject: 'Your New DecentraVault Identity Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to DecentraVault, ${name}!</h2>
        <p>An administrator has created a new decentralized identity for you.</p>
        <p><strong>IMPORTANT:</strong> Please save the credentials below securely. You will need them to log in, and they will not be shown again.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>DID:</strong></p>
          <code style="word-break: break-all; color: #0f172a;">${did}</code>
          
          <p style="margin: 15px 0 10px 0;"><strong>Private Key:</strong></p>
          <code style="word-break: break-all; color: #b91c1c;">${privateKey}</code>
        </div>
        
        <p>You can log in to the platform here: <a href="${loginUrl}">${loginUrl}</a></p>
        
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">
          If you did not request this account, please contact your system administrator immediately.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Successfully sent credentials email to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
}

module.exports = {
  sendCredentialsEmail
};
