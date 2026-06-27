const Profile = require("../models/Profile");
const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const mongoose = require("mongoose");
const { convertSecondsToDuration } = require("../utils/secToDuration");


//update profile (additional details wala part)

exports.updateProfile = async (req, res) => {

    try{

        //get data 
        const {dateOfBirth="", about="", contactNumber, gender, firstName, lastName} = req.body;

        // get userId (user login hai , so humne payload dala tha req me , waha se access kr skte)
        const id = req.user.id;

        console.log("Okay till here huh>=?");
        //validation
        if(!contactNumber || !gender){
            return res.status(400).json({
                success : false,
                message : "All fields are required!",
            });
        }

        // find profile
        const userDetails = await User.findById(id)
        const profile = await Profile.findById(userDetails.additionalDetails)

        console.log("Good here also??");
        //also update first name and last name agar req me aya to
        const user = await User.findByIdAndUpdate(id, {
            firstName,
            lastName,
        })
        await user.save()
        //update profile : 
        //M - 1 : findByIdAndUpadate krdo or
        //M - 2 : update then save
        //doing with M - 2
        // Update the profile fields
        profile.dateOfBirth = dateOfBirth
        profile.about = about
        profile.contactNumber = contactNumber
        profile.gender = gender
        console.log("just saving....");
        // Save the updated profile
        await profile.save()

        console.log("Done saving....");
        

        // Find the updated user details
        const updatedUserDetails = await User.findById(id).populate("additionalDetails").exec();

        console.log("update user-profile details : ", updatedUserDetails);

        return res.json({
            success: true,
            message: "Profile updated successfully",
            updatedUserDetails,
        });

    }
    catch(err){
        return res.status(500).json({
            success : false,
            error : err.message,
        });
    }

};



//Delete Account
// Explore -> how can we schedule this deletion operation *******

exports.deleteAccount = async (req, res) => {

    try{

        //get id
        const id = req.user.id;
        //validation
        const userDetails = await User.findById(id);
        if(!userDetails){

            return res.status(404).json({
                success : false,
                message : "User not found!",
            });
        }

        //delete profile firs(additional details wala part)
        await Profile.findByIdAndDelete({_id : userDetails.additionalDetails});

        // TODO : HW : unenroll this user from all enrolled courses he had
        // delete the user
        await User.findByIdAndDelete({_id : id});

        //return response
        return res.status(200).json({
            success : true,
            message : "User Deleted Successfully!",
        });

    }
    catch(err){
        return res.status(500).json({
            success : false,
            message : "User cannot be deleted successfully!",
        });
    }

};



// fetch all UserDetails
exports.getAllUserDetails = async (req, res) => {

    try{

        //get id
        const id = req.user.id;

        //validation and get user details
        const userDetails = await User.findById(id).populate("additionalDetails").exec();
        //return response

        return res.status(200).json({
            success : true,
            message : "User Data Fetcehd Successfully!",
        });

    }
    catch(err){
        return res.status(500).json({
            success : false,
            error : err.message,
        });
    }

};



exports.updateDisplayPicture = async (req, res) => {
  try{
        console.log("Inside image update controller");
        const displayPicture = req.files.displayPicture;
        const userId = req.user.id;
        const image = await uploadImageToCloudinary(
                            displayPicture,
                            process.env.FOLDER_NAME,
                            1000,
                            1000
                        );
        console.log(image);
        const updatedProfile = await User.findByIdAndUpdate(
                                { _id: userId },
                                { image: image.secure_url },
                                { new: true }
                            ).populate("additionalDetails");
        console.log("UpdateProfile after image : ", updatedProfile);
        res.send({
            success: true,
            message: `Image Updated successfully`,
            data: updatedProfile,
        });
    } 
    catch (error) 
    {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
  }
}



// get all courses of a student
exports.getEnrolledCourses = async (req, res) => {
  try {
        const userId = req.user.id
        let userDetails = await User.findOne({_id: userId,})
                                    .populate({
                                        path: "courses",
                                        populate: {
                                            path: "courseContent",
                                            populate: {
                                                path: "subSection",
                                            },
                                        },
                                    })
                                    .exec();
        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find user with id: ${userDetails}`,
            });
        }

        userDetails = userDetails.toObject();

        let SubsectionLength = 0;
        for (let i = 0; i < userDetails.courses.length; i++) 
        {
            let totalDurationInSeconds = 0;
            SubsectionLength = 0;
            for (let j = 0; j < userDetails.courses[i].courseContent.length; j++) {
                totalDurationInSeconds += userDetails.courses[i].courseContent[j]
                        .subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0);

                userDetails.courses[i].totalDuration = convertSecondsToDuration(totalDurationInSeconds);
                SubsectionLength += userDetails.courses[i].courseContent[j].subSection.length;
            }
            let courseProgressCount = await CourseProgress.findOne({
                courseID: userDetails.courses[i]._id,
                userId: userId,
            })
            courseProgressCount = courseProgressCount?.completedVideos.length
            if (SubsectionLength === 0) {
                userDetails.courses[i].progressPercentage = 100
            } 
            else {
                // To make it up to 2 decimal point
                const multiplier = Math.pow(10, 2)
                userDetails.courses[i].progressPercentage =
                Math.round(
                    (courseProgressCount / SubsectionLength) * 100 * multiplier
                ) / multiplier
            }
        }

        
        return res.status(200).json({
            success: true,
            data: userDetails.courses,
        })
    } 
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    } 
}





//show all course and data of instructor
exports.instructorDashboard = async (req, res) => {
  try {
        const courseDetails = await Course.find({ instructor: req.user.id })

        const courseData = courseDetails.map((course) => {
            const totalStudentsEnrolled = course.studentsEnrolled.length;
            const totalAmountGenerated = totalStudentsEnrolled * course.price;

            // Create a new object with the additional fields
            const courseDataWithStats = {
                _id: course._id,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                // Include other course properties as needed
                totalStudentsEnrolled,
                totalAmountGenerated,
            }

            return courseDataWithStats;
        })

        res.status(200).json({
            courses: courseData,
        });
    } 
    catch (error) 
    {
        console.error(error)
        res.status(500).json({
            message: "Server Error, while fetching instrucotr data",
        });
    }
}
