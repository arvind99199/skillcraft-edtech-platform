const Category = require("../models/Category");




//create Category ka handler function

exports.createCategory = async (req, res) => {
    try{

        //fetch data
        const {name, description} = req.body;

        //validation
        if(!name || !description){
            return res.status(400).json({
                success : true,
                message : "All fields are required!",
            })
        }

        //create entry in DB
        const categoryDetails = await Category.create({
            name : name,
            description : description,
        });
        console.log(categoryDetails);

        //return response
        return res.status(200).json({
            success : true,
            message : "Category Created Successfully!",
        })

    }
    catch(error){
        return res.status(500).json({
            success : false,
            message : error.message,
        })
    }
}


//getAllCategory handler function

exports.showAllCategories = async (req, res) => {
    try{
        
        const allCategory = await Category.find({}, {name : true, description : true}).populate("courses");
        console.log("allCategory is -> ", allCategory);
        return res.status(200).json({
            success : true,
            message : "All Category returned successfully",
            data : allCategory,
        })
    }
    catch(error){

        console.log(error.message);
        return res.status(500).json({
            success : false,
            message : error.message,
        })
    }
}

//category page details
exports.categoryPageDetails = async (req, res) => {
    try{

        const {categoryId} = req.body;
        
        //get all the courses with this specified category
        const selectedCategory = await Category.findById(categoryId).populate({
                                                                path: "courses",
                                                                populate: {
                                                                    path: "ratingAndReviews",
                                                                },
                                                            })
                                                            .exec();

        console.log(selectedCategory);
        //handle the case when category is not found
        if(!selectedCategory){
            console.log("Category not found!");

            return res.status(404).json({
                success : false,
                message : "Category Not Found!",
            });

        }

        if(selectedCategory.courses.length === 0)
        {
            console.log("No courses found for the seleced category!");
            return res.status(404).json({
                success : false,
                message : "No courses found for the seleced category!",
            });
        }

        const selectedCourses = selectedCategory.courses;

        //get courses for different categories
        const differentCategories = await Category.find({
                                        _id : {$ne : categoryId},
                                        })
                                        .populate({
                                            path: "courses",
                                            populate: {
                                                path: "ratingAndReviews",
                                            },
                                        })
                                        .exec();

        let differentCourses = [];
        for(const category of differentCategories){

            differentCourses.push(...category.courses);
        }
        
        //get top selling courses across all categories
        const allCategories = await Category.find().populate({
                                                    path: "courses",
                                                    populate: {
                                                        path: "ratingAndReviews",
                                                    },
                                                });
        const allCourses = allCategories.flatMap((category) => category.courses);

        const mostSellingCourses = allCourses.sort((a,b) => b.sold - a.sold).slice(0, 10);
        //Sold is not in our Course model , so add it accordinly ********************


        return res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategory: {
                    courses: differentCourses,
                },
                mostSellingCourses,
            },
        });
    }
    catch(err){

        return res.status(500).json({
            success : false,
            message : "Internal server error!",
            error : err.message,
        })
    }
}