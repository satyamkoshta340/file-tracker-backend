const Files = require("../models/fileModel");
const { v4: uuidv4 } = require('uuid');

exports.createFile= async( req, res, next )=>{
    const newFile = req.body;
    console.log(newFile)
    const fileBody = { 
        fileName: newFile.fileName,
        fileId: uuidv4(),
        description: newFile.description,
        owner: req.user._id
    }
    console.log(fileBody)
    const savedFile = await Files.create(fileBody);
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