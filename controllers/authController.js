const Users = require("../models/userModel");
const Cryptr = require('cryptr');
const jwt = require("../services/jwtService");
const validator = require("validator");
const asyncWrapper = require("../utils/asyncWrapper");
const { OAuth2Client } = require("google-auth-library");
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

const verifyGoogleToken = async (token) => {
    try {
      const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      const client = new OAuth2Client(GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
      });
      return { payload: ticket.getPayload() };
    } catch (error) {
      return { error: "Invalid user detected. Please try again" };
    }
  };
exports.authWithGoogle = async (req, res, next) => {
    try {
      if (req.body.credential) {
        const verificationResponse = await verifyGoogleToken(req.body.credential);
        if (verificationResponse.error) {
          return res.status(400).json({
            error: true,
            message: verificationResponse.error,
          });
        }
        const profile = verificationResponse?.payload;
        let user;
        try{
            const existingUser = await Users.findOne({gID: profile.sub});
            if(!existingUser){
              const userData = { 
                gID: profile.id,
                firstName: profile.given_name,
                lastName: profile.family_name,
                verified: profile.verified,
                email: profile.email,
                picture: profile.picture
              }
              const newUser = await Users.create(userData);
              user = newUser;
            }
            else{
              console.log("existingUser")
              user = existingUser;
            }
          }
          catch(err){
            console.log('====================================');
            console.error(err);
            console.log('====================================');
          } 

        const token = jwt.signToken(user.email);
        res.status(200).json({
            status: "success",
            token,
            user,
            message: "User Authenticated sucessfully",
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ status: "failure", message: "Internal Server Error" });
    }
  };

exports.authWithGoogleForApp = async (req, res) => {
    try {
      const { firstName, lastName, email, gId, picture } = req.body;
      console.log(req.body)
      if (!gId || !email)
        return res
          .status(400)
          .json({ error: true, message: "Somthing is missing" });
      // if (!/[a-zA-Z0-9+_.-]+@gkv.ac.in/.test(email))
      //   return res
      //     .status(400)
      //     .json({ error: true, message: "Please use GKV mail" });
      let user = await Users.findOne({ email });
  
      if (!user) {
        user = await new User({
          firstName,
          lastName,
          email,
          gId,
          picture,
        }).save();
      } else if (!user.gId) {
        await Users.updateOne(
          { email },
          { firstName, lastName, gId, picture }
        );
      }
      const token = await generateToken(user);
      res.status(200).json({
        error: false,
        status: "success",
        token,
        user,
        message: "User Authenticated sucessfully",
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: true, message: "Internal Server Error" });
    }
  };