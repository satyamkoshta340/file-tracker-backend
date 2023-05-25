const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    fileName:{
        type:  String
    },
    fileId: {
        type: String,
        unique: true
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    description:{
        type: String
    },
    status:{
        type: String
    },
    recievedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    sentBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    sentTo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    sentAt:{
        type: Date
    },
    recievedAt:{
        type: Date
    },
    createdAt:{
        type: Date
    },
    updatedAt:{
        type: Date
    }
})

const files = mongoose.model("files", fileSchema);
module.exports = files;