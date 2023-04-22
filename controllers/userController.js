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
