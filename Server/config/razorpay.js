const Razorpay = require("razorpay");

//only creating instance here, which we will use in payment.js controller

exports.instance = new Razorpay({
    key_id : process.env.RAZORPAY_KEY,
    key_secret : process.env.RAZORPAY_SECRET,
});