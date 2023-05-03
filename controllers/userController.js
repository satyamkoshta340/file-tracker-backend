const asyncWrapper = require("../utils/asyncWrapper");
const User = require("../models/userModel");

exports.getUser = asyncWrapper(async (req, res, next) => {
  if (req.user) {
    res.status(200).json({
      status: "success",
      data: {
        user: req.user,
      },
    });
  }
});

//getAllUser
exports.getAllUsers = asyncWrapper(async (req, res, next) => {
  const users = await User.find({ email: { $ne: req.user.email }});
  res.status(200).json({
    status: "success",
    data: users,
  });
});
exports.updateUser = asyncWrapper(async (req, res, next) => {
  let { firstName, lastName, department, expoPushToken } = req.body;
  //  const user=await User.findOne(req.user._id);
  if (firstName){
    firstName = firstName.trim();
    if(firstName.length < 3) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide atleast 3 letters for firstname.",
      });
    }
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: req.user._id },
    { firstName, lastName, department, expoPushToken },
    { new: true }
  );
  res.status(201).json({
    status: "success",
    data: updatedUser,
    message: "user updated successfully!"
  });
});
