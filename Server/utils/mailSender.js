const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const nodemailer = require("nodemailer");

require("dotenv").config();

const mailSender = async (email, title, body) => {

    try{
        let transporter = nodemailer.createTransport({

            host : process.env.MAIL_HOST,
            port: 587,
            secure: false,
            family : 4,
            auth : {
                user : process.env.MAIL_USER,
                pass : process.env.MAIL_PASS,
            }
        });

        let info = await transporter.sendMail({
            //from : "SkillCraft || Death - By Blaster",
            from : "SkillCraft shinigamiarerealbro@gmail.com",
            to : `${email}`,
            subject : `${title}`,
            html : `${body}`,

        });
        console.log("ye hai response of mailsender ", info);
        return info;
    }
    catch(error){
        console.error("Mail Error:", error);
        throw error;
    }
}

module.exports = mailSender;

