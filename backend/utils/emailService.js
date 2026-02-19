const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"LeafKart" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error("sendEmail error:", err);
  }
};

module.exports = { sendEmail };
