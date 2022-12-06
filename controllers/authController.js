const Users = require("../models/userModel");
const Cryptr = require('cryptr');
const jwt = require("../services/jwtService");
const validator = require("validator");
const asyncWrapper = require("../utils/asyncWrapper");

const cryptr = new Cryptr('myTotallySecretKey');

exports.login = asyncWrapper(async( req, res, next ) => {
    const { email, password } = req.body;
    if( !email || !password ){
        return res.status(400).json({
            status: "fail",
            data:{
                message: "please provide valid email and password"
            }
        })
    }
    const existingUser = await Users.findOne( { email } );
    if( !existingUser ){
        return res.status(400).json({
            status: "fail",
            data:{
                message: "No user assosiated with this email."
            }
        })
    }
    if( !existingUser.password ){
        existingUser.password = cryptr.encrypt(password);
        await existingUser.save();
    }
    const decryptedPassword = cryptr.decrypt(existingUser.password);
    if( decryptedPassword === password ){
        const token = jwt.signToken(email);
        res.status(200).json({
            status: "success",
            data:{
                user: existingUser,
                token
            }
        })
    }
    else{
        res.status(403).json({
            status: "fail",
            data:{
                message: "invalid credentials"
            }
        })
    }

});

exports.register = asyncWrapper( async( req, res, next ) => {
    const { firstName, lastName, email, department, password } = req.body;
    const encryptedPass = cryptr.encrypt(password);
    if( !validator.isEmail(email)){
        return res.status(402).json({
            status: "fail",
            data: {
                message: "Invalid Email"
            }
        })
    }
    const existingEmailUser = await Users.findOne({email});
    if(existingEmailUser){
        return res.status(402).json({
            status: "fail",
            data: {
                message: "Already existing email can't be used!"
            }
        })
    }
    const newUser = await Users.create({firstName, lastName, email, department, password:encryptedPass});
    const token = jwt.signToken(email);
    res.status(200).json({
        status: "success",
        data:{
            user: newUser,
            token
        }
    })
});