const Files = require("../models/fileModel");
const FileHistory = require("../models/fileHistoryModel");
const User = require("../models/userModel");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const asyncWrapper = require("../utils/asyncWrapper");
const { sendSingleNotification } = require("../utils/sendNotification");

const mongoose = require("mongoose");

exports.createFile = asyncWrapper(async (req, res, next) => {
  const newFile = req.body;
  // console.log(newFile)
  const fileBody = {
    fileName: newFile.fileName,
    fileId: uuidv4(),
    description: newFile.description,
    owner: req.user._id,
  };
  // console.log(fileBody)
  const savedFile = await Files.create(fileBody);
  const firstSpot = {
    fileId: savedFile.fileId,
    userId: req.user._id,
    info: `File created by ${req.user.firstName} ${req.user.lastName}`,
    reachedAt: req.requestTime,
  };
  // console.log(firstSpot);
  await FileHistory.create(firstSpot);
  res.status(200).json({
    status: "success",
    data: {
      message: "File Created successfully!",
      file: savedFile,
    },
  });
});

exports.getAllFiles = asyncWrapper(async (req, res, next) => {
  // sendSingleNotification("Files Loaded", "Here are your existing files", req.user?.expoPushToken);
  const userFiles = await Files.find({ owner: req.user._id });
  res.status(200).json({
    status: "success",
    data: {
      files: userFiles,
    },
  });
});

exports.getFile = async (req, res, next) => {
  const { fileId } = req.params;
  const savedFile = await Files.findOne({ fileId });
  res.status(200).json({
    status: "success",
    data: {
      file: savedFile,
    },
  });
};

exports.getFileHistory = asyncWrapper(async (req, res, next) => {
  const fileId = req.params.fileId;
  let file = null;
  try {
    file = await Files.findOne({ fileId });
  } catch (e) {
    return res.status(400).json({
      status: "fail",
      data: {
        message: "invalid fileId, no file belong to this fileId",
      },
    });
  }

  let history = [];
  try {
    history = await FileHistory.find({ fileId: fileId })
      .populate("userId")
      .sort("reachedAt");
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      status: "fail",
      data: {
        message: err.message,
      },
    });
  }
  const ur = await QRCode.toDataURL(`${process.env.FRONTEND_URL + "/file-tracker-frontend/track/" + file.fileId}`);
  const qr = ur.substring(22);
  res.status(200).json({
    status: "success",
    data: {
      history,
      file,
      qr,
    },
  });
});

exports.setFileHistory = asyncWrapper(async (req, res, next) => {
  const fileId = req.params.fileId;
  const { info, type } = req.body;
  let file = null;
  try {
    file = await Files.findOne({ fileId });
  } catch (e) {
    return res.status(400).json({
      status: "fail",
      data: {
        message: "invalid fileId, no file belong to this fileId",
      },
    });
  }
  if( file === null ){
    return res.status(400).json({
      status: "fail",
      data: {
        message: "invalid fileId, no file belong to this fileId",
      },
    });
  }
  const [lastSpot] = await FileHistory.aggregate([
    {
      $group: {
        _id: file?._id,
        recent: {
          $max: {
            date: "$reachedAt",
            userId: "$userId",
            _id: "$_id",
          },
        },
      },
    },
  ]);
  if (type === "recieve" && lastSpot.recent.userId.toString() === req.user._id.toString()) {
    return res.status(200).json({
      status: "success",
      data: {
        file,
        message: "you have alredy scanned the file.",
      },
    });
  }
  const spot = {
    fileId,
    userId: req.user._id,
    info: info.length ? info : req.user.department ? req.user.department : "",
    reachedAt: req.requestTime,
  };
  await FileHistory.create(spot);
  const history = await FileHistory.find({ fileId: fileId })
    .populate("userId")
    .sort("reachedAt");
  const ur = await QRCode.toDataURL(`${process.env.FRONTEND_URL + "/file-tracker-frontend/track/" + file.fileId}`);
  const qr = ur.substring(22);
  const fileOwner = await User.findById(file.owner);
  if( fileOwner?.expoPushToken ){
    sendSingleNotification("File Spot Update", `File ${file.fileName} reached at a new spot.`, fileOwner.expoPushToken)
  }
  res.status(200).json({
    status: "success",
    data: {
      history,
      file,
      qr,
    },
  });
});

//delete fileHistory
exports.deleteFileHistory = asyncWrapper(async (req, res, next) => {
  console.log(req.user);
  const { fileId } = req.params;
  const file = await Files.findOne({ fileId: fileId });
  if (!file) {
    return res.status(400).json({
      status: "fail",
      message: "file not found",
    });
  }

  // console.log(req.user, file);
  if (req.user._id.toString() != file.owner.toString()) {
    return res.status(401).json({
      status: "fail",
      message: "only owner can delete the file",
    });
  }
  await Files.deleteOne({ fileId: fileId });
  await FileHistory.deleteMany({ fileId: fileId });
  res.status(200).json({
    status: "success",
    message: "file history has deleted",
  });
});

exports.getTopFiveRecentFiles = asyncWrapper(async (req, res, next) => {
  const recentFiles = await FileHistory.aggregate([
    {
      $lookup: {
        from: "files",
        foreignField: "fileId",
        localField: "fileId",
        as: "file",
      },
    },
    {
      $match: { $or: [ {"file.owner": mongoose.Types.ObjectId(req.user._id) }, {"userId": mongoose.Types.ObjectId(req.user._id)} ]},
    },
    {
      $unwind: "$file",
    },
    {
      $group: {
        _id: "$file.fileId",
        reachedAt: { $max: "$reachedAt" },
        fileName: { $first: "$file.fileName" },
        description: { $first: "$file.description" },
      },
    },
    {
      $sort: {
        reachedAt: -1,
      },
    },
    {
      $limit: 5,
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      recentFiles,
    },
  });
});

exports.getAllRecentFiles = asyncWrapper(async (req, res, next) => {
  const recentFiles = await FileHistory.aggregate([
    {
      $lookup: {
        from: "files",
        foreignField: "fileId",
        localField: "fileId",
        as: "file",
      },
    },
    {
      $match: { $or: [ {"file.owner": mongoose.Types.ObjectId(req.user._id) }, {"userId": mongoose.Types.ObjectId(req.user._id)} ]},
    },
    {
      $unwind: "$file",
    },
    {
      $group: {
        _id: "$file.fileId",
        reachedAt: { $max: "$reachedAt" },
        fileName: { $first: "$file.fileName" },
        description: { $first: "$file.description" },
      },
    },
    {
      $sort: {
        reachedAt: -1,
      },
    }
  ]);
  res.status(200).json({
    status: "success",
    data: {
      recentFiles,
    },
  });
});

