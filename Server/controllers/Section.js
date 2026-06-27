const Section = require("../models/Section");
const Course = require("../models/Course");

//create a new section
exports.createSection = async (req, res) => {

    try{

        //data fetch 
        const {sectionName, courseId} = req.body;

        //data validation
        if(!sectionName || !courseId)
        {
            return res.status(400).json({
                success : false,
                message : "Missing Properties!",
            })
        }

        //create section
        const newSection = await Section.create({sectionName});

        // update course with section object id
        const updatedCourse = await Course.findByIdAndUpdate(
                                                courseId,
                                                {
                                                    $push : {
                                                        courseContent : newSection._id,
                                                    }
                                                },
                                                {new : true},
                                            ).populate({
                                                path: "courseContent",
                                                populate: {
                                                    path: "subSection",
                                                },
                                            });

        //HW : use pupolate to replace section/sub-sections both in the updatedCourseDetails

        // return response
        console.log("SEction -> ", newSection);
        console.log("Updated Course -> ", updatedCourse);
        return res.status(200).json({
            success : true,
            message : "Section created Successfully!",
            updatedCourse,
        });

    }
    catch(err){

        return res.status(500).json({
            success : false,
            message : "Unable to create section, please try again later!",
        });
    }
}


//update section

exports.updateSection = async (req, res) => {

    try{

        // data input 
        const {sectionName, sectionId} = req.body;

        //data validation
        if(!sectionName || !sectionId)
        {
            return res.status(400).json({
                success : false,
                message : "Missing Properties!",
            });
        }

        //update data
        const section = await Section.findByIdAndUpdate(sectionId, {sectionName}, {new : true});

        //return response
        return res.status(200).json({
            success : true,
            messgae : "Section Updated Successfully!",
        });

    }
    catch(err){

         return res.status(500).json({
            success : false,
            message : "Unable to update section, please try again later!",
        });
    }
}


//delete section

exports.deleteSection = async (req, res) => {

    try{

        // get id, assuming we are sending id in params
        const {sectionId} = req.params;

        //delete
        const section = await Section.findByIdAndDelete(sectionId);

        // TODO(testing me check): do we need to delete the entry from the course schema ???????

        //return response
        return res.status(200).json({
            success : true,
            messgae : "Section Deleted Successfully!",
        });

    }
    catch(err){

         return res.status(500).json({
            success : false,
            message : "Unable to delete section, please try again later!",
        });
    }
}