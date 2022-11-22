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
    }
})

const files = mongoose.model("files", fileSchema);
module.exports = files;