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


const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"SkillCraft" <${process.env.MAIL_USER}>`,
      to: email,
      subject: title,
      html: body,
    });

    console.log("Mail Sent:", info.messageId);
    return info;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = mailSender;