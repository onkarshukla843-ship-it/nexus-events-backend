const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        // 1. Create a transporter (The Delivery Truck)
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: 465, // True for 465, false for other ports
            secure: true, 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 2. Define the email options (The Package)
        const mailOptions = {
            from: `"Nexus Events" <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.html, // We are using HTML so we can send beautiful receipts!
        };

        // 3. Actually send the email
        const info = await transporter.sendMail(mailOptions);
        console.log("📧 Email sent successfully: " + info.messageId);
        
    } catch (error) {
        console.error("❌ Email failed to send: ", error);
        throw new Error("Email could not be sent");
    }
};

module.exports = sendEmail;