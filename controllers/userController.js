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
  const users = await User.find();
  res.status(200).json({
    status: "success",
    data: users,
  });
});
exports.updateUser = asyncWrapper(async (req, res, next) => {
  const { firstName, lastName, department } = req.body;
  //  const user=await User.findOne(req.user._id);

  const updatedUser = await User.findOneAndUpdate(
    { _id: req.user._id },
    { firstName, lastName, department },
    { new: true }
  );
  res.status(201).json({
    status: "success",
    data: updatedUser,
  });
});
