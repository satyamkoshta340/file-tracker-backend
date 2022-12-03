const mongoose = require("mongoose");

const fileHistorySchema = new mongoose.Schema({
    fileId:{
        type: String
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    info:{ type: String },
    reachedAt: { type: Date }
});

const FileHistory = mongoose.model("fileHistories", fileHistorySchema);
module.exports = FileHistory;