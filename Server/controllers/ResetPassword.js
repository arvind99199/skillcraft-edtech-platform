const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");


// reset password token
exports.resetPasswordToken = async (req, res) => {

    try{

        //get email from req body
        const email = req.body.email;

        // check user for this email , email validation
        const user = await User.findOne({email});
        if(!user){
            return res.json({
                success : false,
                message : "Your Email is not registered with us!",
            });
        }

        //generate token
        const token = crypto.randomUUID();

        const updatedDetails = await User.findOneAndUpdate(
                                            {email},
                                            {
                                                token : token,
                                                resetPasswordExpires : Date.now() + 5*60*1000,
                                            },
                                            {
                                                new : true,
                                            })

        //create url for password change for this particular person ... using his token
        const url = `http://localhost:3000/update-password/${token}`;

        // send him a mail containing this link
        await mailSender(
                        email,
                        "Password Reset Link",
                        `Password Reset Link : ${url}`)

        //return response
        return res.json({
            success : true,
            message : "Email sent successfully, please check email and change password!",
        });
    }
    catch(err){
        return res.status(500).json({
            success : false,
            message : "Something went wrong while sending mail for reset password!",
        })
    }
}


// reset password after getting token

exports.resetPassword = async (req, res) => {
    
    try{

        //data fetch
        const {password, confirmPassword, token} = req.body;
        //validation
        if(password !== confirmPassword)
        {
            return res.json({
                success : false,
                message : "Password and ConfirmPassword should match!",
            });
        }

        // get user details from DB using token
        const userDetails = await User.findOne({token});

        // if no entry present -> invalid token
        if(!userDetails){
            return res.json({
                success : false,
                message : "Token is invalid!",
            })
        }

        // check if token expired or not
        if(userDetails.resetPasswordExpires < Date.now()){

            return res.json({
                success : false,
                message : "Token is expired, please regenerate your token!",
            });
        }

        //hash password
        const hashedPassword = await bcrypt.hash(password,10);

        //password update
        await User.findOneAndUpdate(
            {token : token},
            {password : hashedPassword},
            {new : true},
        );

        //return response
        return res.status(200).json({
            success : true,
            message : "Password was reset successfully!",
        })
    }

    catch(error){

        return res.status(500).json({
            success : false,
            message : "Something went wrong while sending mail for reset password!",
        }) 
    }


}