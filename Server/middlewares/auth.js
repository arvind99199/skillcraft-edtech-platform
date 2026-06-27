const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

//auth -> function is used as middleware to authenticate user requests

exports.auth = async (req, res, next) => {

    try{

        console.log("we are in AUTH!!!");
        
        console.log("Header -> ",req.header("Authorization"));
        //extract token
        const token = req.cookies?.token || req.body?.token ||
                        req.header("Authorization")?.replace("Bearer ", "");
        
        console.log("we are in AUTH!!! token : ", token);
        // if token is missing then return response
        if(!token){
            return res.status(401).json({
                success : false,
                message : "Token is missing",
            });
        }
        console.log("we are in AUTH continue!!!");
        //verify the token 
        try{

            const decode = jwt.verify(token, process.env.JWT_SECRET);   // decode <- payload hai
            console.log(decode);
            req.user = decode;
            console.log("we are in AUTH done!!!");
        }
        catch(err){
            //verification issue
            return res.status(401).json({
                success : false,
                message : "Token is invalid",
            });
        }

        next();
    }
    catch(err){

        console.log("OUTER AUTH ERROR => ", err);
        return res.status(401).json({
            success : false,
            message : "Something went wrong while validating the token",
        });
    }
}



// is Student

exports.isStudent = async (req, res, next) => {
    
    try{

        if(req.user.accountType !== "Student")
        {
            return res.status(401).json({
                success : false,
                message : "This is a Protected Route for Students only!",
            });
        }

        next();
    }
    catch(error){

        return res.status(500).json({
            success : false,
            message : "User role cannot be verified, please try again later!",
        });
    }
}

// is Instructor


exports.isInstructor = async (req, res, next) => {
    
    try{

        if(req.user.accountType !== "Instructor")
        {
            return res.status(401).json({
                success : false,
                message : "This is a Protected Route for Instructor only!",
            });
        }

        next();
    }
    catch(error){
        
        return res.status(500).json({
            success : false,
            message : "User role cannot be verified, please try again later!",
        });
    }
}

// isAdmin

exports.isAdmin = async (req, res, next) => {
    
    try{

        if(req.user.accountType !== "Admin")
        {
            return res.status(401).json({
                success : false,
                message : "This is a Protected Route for Admin only!",
            });
        }

        next();
    }
    catch(error){
        
        return res.status(500).json({
            success : false,
            message : "User role cannot be verified, please try again later!",
        });
    }
}