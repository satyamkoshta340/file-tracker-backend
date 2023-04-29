// import nodemailer from "nodemailer";
const nodemailer = require("nodemailer");

exports.sendEmail = async (mailOptions) => {
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER_NAME, // generated ethereal user
        pass: process.env.SMTP_USER_PASSWORD, // generated ethereal password
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail(mailOptions);

    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    console.log(err);
  }
};
