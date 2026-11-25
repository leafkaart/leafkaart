const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 30_000,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendEmail = async ({ to, subject, html, text, messageId, throwOnError = false }) => {
  try {
    await transporter.sendMail({
      from: `"LeafKart" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      html,
      text,
      messageId,
    });
  } catch (err) {
    if (throwOnError) throw err;
    console.error("sendEmail error:", err);
  }
};

module.exports = { sendEmail };
