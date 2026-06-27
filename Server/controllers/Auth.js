const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator"); // using npm otp-generator
const Profile = require("../models/Profile");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// send otp (while sign up)

exports.sendOTP = async (req, res) => {

    try{
        //fetch email from request ki body
        const {email} = req.body;

        console.log("Good here?");
        //check if user already exist
        const checkUserPresent = await User.findOne({email});

        //if user already exists with that email, then return a response
        if(checkUserPresent) {
            return res.status(401).json({
                success : false,
                message : "User already registered with that email",
            });
        } 
        //new user
        //generate otp using inbuilt generator
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets : false,
            lowerCaseAlphabets : false,
            specialChars : false,
        });

        console.log("OTP generated : ", otp);

        //check if its unique or not
        let result = await OTP.findOne({otp : otp});  //in DB

        while(result){                            // very bad practice ki DB baar baar cal jaa rahi hai , so replace this **********
            otp = otpGenerator(6,{                                          // find koi service/package which gives unique otp everytime
                upperCaseAlphabets : false,
                lowerCaseAlphabets : false,
                specialChars : false,
            }); 
            result = await OTP.findOne({otp : otp});     // agar nahi hai DB me to null milna chahiye
        } 

        const otpPayload = {email, otp};

        //create an entry for OTP
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        //return response successful
        res.status(200).json({
            success : true,
            message : "OTP Sent Successfully!",
            otp, 
        })
    }
    catch(error){

        console.log(error);
        return res.status(500).json({
            success : false,
            message : "Cannot send otp, Please try again later!",
        })
    }
}



//sign up

exports.signUp = async (req, res) =>{
    try{

        //data fetch from request ki body
        const {
            firstName, 
            lastName, 
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body;

        //validate krlo
        if(!firstName || !lastName || !email || !password || !confirmPassword
            || !otp )
        {
            return res.status(403).json({
                success : false,
                message : "All fields are required!",
            })
        }

        // both password match krlo
        if(password !== confirmPassword){
            return res.status(400).json({
                success : false,
                message : "Password and ConfirmPassword Value Does not match, please try again!",
            })
        }

        // check if user already exist or not
        const existingUser = await User.findOne({email});
        if(existingUser) // already present
        {
            return res.status(400).json({
                success : false,
                message : "User already Exists with that email!"
            });
        }

        console.log("okay till here!")
        //find most recent OTP stored for the user
        const recentOtp = await OTP.find({email}).sort({createdAt : -1}).limit(1);
        console.log(recentOtp);

        console.log("OUR OTP : ", otp);
        console.log("DB OTP : ",recentOtp[0].otp);
        //validate OTP
        if(recentOtp.length == 0){
            //OTP not found
            return res.status(400).json({
                success : false,
                message : "OTP not found!",
            });
        }
        
        else if(otp !== recentOtp[0].otp)
        {
            //Invalid OTP
            return res.status(400).json({
                success : false,
                message : "Invalid OTP",
            })
        }


        // ab otp sahi hai then
        //Hash password
        console.log("good");
        const hashedPassword = await bcrypt.hash(password, 10);

        // entry create kro in DB

        const profileDetails = await Profile.create({
            gender : null,
            dateOfBirth : null,
            about : null,
            contactNumber : null,
        });

        const user = await User.create({
            firstName, 
            lastName,
            email,
            contactNumber,
            password : hashedPassword,
            accountType,
            additionalDetails : profileDetails._id,
            image : `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        });

        //return response
        return res.status(200).json({
            success : true,
            message : "User Registered Successfully!",
            user,
        })
    }   
    catch(err){

        console.log(err);
        return res.status(500).json({
            success : false,
            message : "User cannot be registered, Please try again later!",
        })
    }
}




//login

exports.login = async (req, res) => {
    try{
        //get data from req body
        const {email , password} = req.body;
        //validation data
        if(!email || !password)
        {
            return res.status(403).json({
                success : false,
                message : "All fields are required, Please fill everything!"
            })

        }

        //check if user exists or not
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user) // user does not exists
        {
            return res.status(401).json({
                success : false,
                message : "User is not registered, Please Sign up first!",
            });
        }

        // generate JWT, after password matching
        if(await bcrypt.compare(password, user.password)){
            const payload = {
                email : user.email,
                id : user._id,
                accountType : user.accountType,
            }
           
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn : "2h",
            });

            // Save token to user document in database
            user.token = token;
            user.password = undefined; 

            //create a cookie and send the response with token
            const options = {
                expires : new Date(Date.now() + 3*24*60*60*1000),
                httpOnly : true,
            }
            
            res.cookie("token", token, options).status(200).json({
                success : true,
                token, 
                user, 
                message : "Logged in successfully!",
            })

        }
        else
        {
            return res.status(401).json({
                success : false,
                message : "Password is incorrect!",
            });
        }
    }
catch(err){

    console.log(error);
    return res.status(500).json({
        success : false,
        message : "Login Failure, Please try again later!",
    })
}
}


//change password when we are already logged in (HW)
exports.changePassword = async (req, res) => {
      //get data from req body
      //get oldpassword, newpassword, confirmNewPassword
      //validation

      //update pwd in DB
      //send mail -> password updated
      //return response

      // Get user data from req.user
    try{
        const userDetails = await User.findById(req.user.id);

        // Get old password, new password, and confirm new password from req.body
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        // Validate old password
        const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password );

        if (!isPasswordMatch) {
        // If old password does not match, return a 401 (Unauthorized) error
        return res.status(401).json({
            success: false,
            message: "The password is incorrect" ,
            })
        }

        //new password and old password should be different
        if(newPassword === oldPassword)
        {
            return res.status(400).json({
                success : false,
                message : "NewPassword and Old Password Should Not be Same!",
            })
        }


        if(newPassword !== confirmNewPassword)
        {
            return res.status(400).json({
                success : false,
                message : "Password and ConfirmPassword Does Not Match!",
            })
        }


        // Update password
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUserDetails = await User.findByIdAndUpdate(req.user.id,
                                            { password: encryptedPassword },
                                            { new: true }
                                        );
                                    
        // Send notification email
        try {
            const emailResponse = await mailSender( updatedUserDetails.email,
                                                    "Password for your account has been updated",
                                                    passwordUpdated(
                                                                updatedUserDetails.email,
                                                                `Password updated successfully for ${updatedUserDetails.firstName}
                                                                ${updatedUserDetails.lastName}`
                                                    )
                                                );
            console.log("Email sent successfully:", emailResponse.response)
        } 
        catch (error) 
        {
        // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while sending email:", error)
        return res.status(500).json({
            success: false,
            message: "Error occurred while sending email",
            error: error.message,
        })
        }

        // Return success response
        return res.status(200).json({
            success: true,
            message: "Password updated successfully", 
        });
    }
    catch(error){
        // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while updating password:", error)
        return res.status(500).json({
            success: false,
            message: "Error occurred while updating password",
            error: error.message,
        })
    }

}





