import nodemailer from "nodemailer";

const sendOTP = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Auth System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    html: `<p>Your OTP is <b>${otp}</b>. It will expire in 5 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

export default sendOTP;
