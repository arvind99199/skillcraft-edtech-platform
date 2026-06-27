const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail"); // remaining
const mongoose = require("mongoose");
const crypto = require("crypto");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const CourseProgress = require("../models/CourseProgress");


//THIS BOTH WERE FOR ONLY ONE COURSE BUY , BUT WE HAVE CARD AND THE STUDENT CAN BUY MULTIPLE AT ONCE SO AGAIN LIKNA PADEGA

//capture the payment and initiate the Razorpay order
// exports.capturePayment = async (req, res) => {
//     //get courseId and UserId
//     const {course_id} = req.body;
//     const userId = req.user.id;

//     //validationg
//     //valid courseId
//     if(!course_id)
//     {
//         return res.json({
//             success : false,
//             message : "Please Provide a valid course ID!",
//         });
//     }

//     //validate CourseDetail
//     let course;          //DB call -> try catch
//     try{

//         course = await Course.findById(course_id);
//         if(!course){
//             return res.json({
//                 success : false,
//                 message : "Could not find the Course!",
//             });
//         }

//         //check if user has buyed that course already => means iss Course ke enrolled students me user ki ID hogi
//         const uid = new mongoose.Types.ObjectId(userId); // converting userId(string) to ObjectId type
        
//         if(course.studentsEnrolled.includes(uid))
//         {
//             //means student already hai course me
//             return res.status(200).json({
//                 success : false,
//                 message : "Student is already enrolled!",
//             });
//         }


//     }
//     catch(error){

//         console.error(error);
//         return res.status(500).json({
//             success : false,
//             message : error.message,
//         });
//     }

//     //order create 
//     const amount = course.price;
//     const currency = "INR";

//     const options = {                              // options or "order"
//         amount : amount * 100,                     // if amt = 100 then razorpay : 1.00 , so we do 100*100 : 10000 , razorpay : 100.00
//         currency,                        
//         receipt : Math.random(Date.now()).toString(),  // giving reciept id (randomly)
//         notes : {                                        // coz jab razorpay wapas response bhejega toh tab course and user id le paye 

//             courseId : course_id,
//             userId,
//         }

//     }

//     try{

//         //intiate the payment using razorpay
//         const paymentResponse = await instance.orders.create(options);        // real order create
//         console.log(paymentResponse);

//         //return response
//         return res.status(200).json({
//             success : true,
//             courseName : course.courseName,
//             courseDescription : course.courseDescription,
//             thumbnail : course.thumbnail,
//             orderId : paymentResponse.id,
//             currency : paymentResponse.currency,
//             amount : paymentResponse.amount,
//         });
//     }
//     catch(error){
//         console.log(error);
//         res.json({
//             success : false,
//             message : "Could not initiate Order!",
//         });
//     }

// }


// Verify signature of Razorpay and server         // still remaining******************

// exports.verifySignature = async (req, res) => {

//     const webhookSecret = "12345678";

//     const signature = req.headers["x-razorypay-signature"];

//     const shasum = crypto.createHmac("sha256", webhookSecret);

//     shasum.update(JSON.stringify(req.body));
    
//     const digest = shasum.digest("hex");

//     if(signature === digest)
//     {
//         console.log("Payment is Authorised!");

//         //fetch details again that we put
//         const {courseId, userId} = req.body.payload.payment.entity.notes;

//         try{

//             //fulfil the action -> after paying

//             //find the course and enroll the student in it
//             const enrolledCourse = await Course.findOneAndUpdate(
//                                                         {_id : courseId},
//                                                         {
//                                                             $push : {
//                                                                 studentsEnrolled : userId,
//                                                             }
//                                                         },
//                                                         {new : true},
//                                                     );

//             if(!enrolledCourse)
//             {
//                 return res.status(500).json({
//                     success : false,
//                     message : "Course not Found!",
//                 })
//             }

//             console.log(enrolledCourse);

//             // find the student and add the course id in his enrolled couses list
//             const enrolledStudent = await User.findOneAndUpdate(
//                                                         {_id : userId},
//                                                         {
//                                                             $push : {
//                                                                 courses : courseId
//                                                             }
//                                                         },
//                                                         {new : true},         
//                                                     );
                                            
//             console.log(enrolledStudent);

//             //mail send krdo confirmation wala like u have been enrolled in this course

//             const emailResponse = await mailSender(
//                                       enrolledStudent.email,
//                                       "Congratulations from Blaster",
//                                       "Congratulations, you are onboarded into a new Blaster Course"
//             );

//             console.log(emailResponse);

//             return res.status(200).json({
//                 success : true,
//                 message : "Signature Verified and Course Added!",
//             });
//         }
//         catch(error){
//             console.log(error);
//             return res.status(500).json({
//                 success : false,
//                 message : error.message,
//             });
//         }

//     }
//     else
//     {
//         return res.status(400).json({
//             success : false,
//             message : "Invalid request!",
//         })
//     }

// }


// Capture the payment and initiate the Razorpay order
exports.capturePayment = async (req, res) => {
  const { courses } = req.body
  const userId = req.user.id
  if (courses.length === 0) {
    return res.json({ success: false, message: "Please Provide Course ID" })
  }

  let total_amount = 0

  for (const course_id of courses) {
    let course
    try {
      // Find the course by its ID
      course = await Course.findById(course_id)

      // If the course is not found, return an error
      if (!course) {
        return res
          .status(200)
          .json({ success: false, message: "Could not find the Course" })
      }

      // Check if the user is already enrolled in the course
      const uid = new mongoose.Types.ObjectId(userId)
      if (course.studentsEnrolled.includes(uid)) {
        return res
          .status(200)
          .json({ success: false, message: "Student is already Enrolled" })
      }

      // Add the price of the course to the total amount
      total_amount += course.price
    } catch (error) {
      console.log(error)
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  const options = {
    amount: total_amount * 100,
    currency: "INR",
    receipt: Math.random(Date.now()).toString(),
  }

  try {
    // Initiate the payment using Razorpay
    const paymentResponse = await instance.orders.create(options)
    console.log(paymentResponse)
    res.json({
      success: true,
      data: paymentResponse,
    })
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ success: false, message: "Could not initiate order." })
  }
}

// verify the payment
exports.verifyPayment = async (req, res) => {
  const razorpay_order_id = req.body?.razorpay_order_id
  const razorpay_payment_id = req.body?.razorpay_payment_id
  const razorpay_signature = req.body?.razorpay_signature
  const courses = req.body?.courses

  const userId = req.user.id

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res.status(200).json({ success: false, message: "Payment Failed" })
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex")

  if (expectedSignature === razorpay_signature) {
    await enrollStudents(courses, userId, res)
    return res.status(200).json({ success: true, message: "Payment Verified" })
  }

  return res.status(200).json({ success: false, message: "Payment Failed" })
}


// Send Payment Success Email    REMAINING *********************************
exports.sendPaymentSuccessEmail = async (req, res) => {

    const { orderId, paymentId, amount } = req.body;

    const userId = req.user.id;

    if (!orderId || !paymentId || !amount || !userId) {

        return res.status(400).json({
            success: false, 
            message: "Please provide all the details",
        });
    }

    try{

        const enrolledStudent = await User.findById(userId);

        await mailSender(
                        enrolledStudent.email,
                        `Payment Received`,
                        paymentSuccessEmail(
                            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
                            amount / 100,
                            orderId,
                            paymentId
                        )
                    );
    } 
    catch (error) 
    {
        console.log("error in sending mail", error)
        return res.status(400).json({
            success: false, message: "Could not send email",
        });
    }
}







// enroll the student in the courses
const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please Provide Course ID and User ID" })
  }

  for (const courseId of courses) {
    try {
      // Find the course and enroll the student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnrolled: userId } },
        { new: true }
      )

      if (!enrolledCourse) {
        return res
          .status(500)
          .json({ success: false, error: "Course not found" })
      }
      console.log("Updated course: ", enrolledCourse)

      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      })
      // Find the student and add the course to their list of enrolled courses
      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      )

      console.log("Enrolled student: ", enrolledStudent)
      // Send an email notification to the enrolled student
      const emailResponse = await mailSender(
        enrolledStudent.email,
        `Successfully Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        )
      )

      console.log("Email sent successfully: ", emailResponse.response)
    } catch (error) {
      console.log(error)
      return res.status(400).json({ success: false, error: error.message })
    }
  }
}






