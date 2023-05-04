const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = mongoose.Schema({
  gID: {
    type: String,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    validate: [validator.isEmail, "Please provide a valid email address"],
    unique: true,
  },
  picture: {
    type: String,
  },
  department: {
    type: String,
  },
  password: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "active"],
    default: "pending",
  },
  confirmationCode: {
    type: String,
    unique: true,
  },
  expoPushToken: {
    type: String
  }
});

const users = mongoose.model("users", userSchema);
module.exports = users;
