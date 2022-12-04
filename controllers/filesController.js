const Files = require("../models/fileModel");
const FileHistory = require("../models/fileHistoryModel");
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

exports.createFile= async( req, res, next )=>{
    const newFile = req.body;
    // console.log(newFile)
    const fileBody = { 
        fileName: newFile.fileName,
        fileId: uuidv4(),
        description: newFile.description,
        owner: req.user._id
    }
    // console.log(fileBody)
    const savedFile = await Files.create(fileBody);
    const firstSpot= {
        fileId: savedFile.fileId,
        userId: req.user._id,
        info: "",
        reachedAt: req.requestTime

    }
    // console.log(firstSpot);
    await FileHistory.create(firstSpot);
    res.status(200).json({
        status: "Success",
        data: "file created successfully"
    })
}

exports.getAllFiles = async( req, res, next ) => {
    const userFiles = await Files.find({owner: req.user._id});
    res.status(200).json({
        status: "success",
        data:{
            files: userFiles
        }
    })
}

exports.getFileHistory = async( req, res, next ) => {
    const fileId = req.params.fileId;
    let file = null;
    try{
        file = await Files.findOne({fileId});
    }
    catch(e){
        return res.status(400).json({
            status: "fail",
            data:{
                message: "invalid fileId, no file belong to this fileId"
            }
        })
    }

    let history = [];
    try{
        history = await FileHistory.find( { fileId: fileId } ).populate('userId').sort('reachedAt');
    }
    catch(err){
        console.log(err);
        return res.status(400).json({
            status: "fail",
            data:{
                message:err.message
            }
        })
    }
    const ur = await QRCode.toDataURL(`${file.fileId}`);
    const qr = ur.substring(22);
    res.status(200).json({
        status: "success",
        data:{
            history,
            file,
            qr
        }
    })
}