const nodemailer = require("nodemailer");

require("dotenv").config();

// const mailSender = async (email, title, body) => {

//     try{
//         let transporter = nodemailer.createTransport({

//             host : process.env.MAIL_HOST,
//             port: 465,
//             secure: true,
//             auth : {
//                 user : process.env.MAIL_USER,
//                 pass : process.env.MAIL_PASS,
//             }
//         });

//         let info = await transporter.sendMail({
//             from : "SkillCraft || Death - By Blaster",
//             to : `${email}`,
//             subject : `${title}`,
//             html : `${body}`,

//         });
//         console.log("ye hai response of mailsender ", info);
//         return info;
//     }
//     catch(error){
//         console.error("Mail Error:", error);
//         throw error;
//     }
// }

// module.exports = mailSender;

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const mailSender = async (email, title, body) => {
  try {
    const response = await resend.emails.send({
      from: process.env.MAIL_USER,
      to: email,
      subject: title,
      html: body,
    });

    console.log("Email Sent Successfully:", response);
    return response;
  } catch (error) {
    console.error("Mail Error:", error);
    throw error;
  }
};

module.exports = mailSender;