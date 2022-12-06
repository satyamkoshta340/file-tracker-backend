const Users = require("../../models/userModel");
const { verifyToken } = require("../../services/jwtService");
const asyncWrapper = require("../../utils/asyncWrapper");

exports.protectedRoute = asyncWrapper(async(req, res, next) =>{
    // if( req.user ) return next();
    // else{
    //     res.status(403).json({
    //     status: "fail",
    //     data: { message: "please login first!"}
    // })}
    if (req.user) return next();
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        /* req.headers.authorization = Bearer <token> */
        token = req.headers.authorization.split(' ')[1];
    }

    if(!token && req["headers"]["x-api-key"]){
        token = req["headers"]["x-api-key"];
    }

    /* IF TOKEN IS NOT PROVIDED CORRECTLY */
    if (!token){
        return res.status(401).json({
            status: "fail",
            data:{
                message: 'You are not logged in! Please log in to get access.'
            }
        });
    }

    /* VERIFY THE TOKEN */
    const decoded = verifyToken(token);

    /* FIND THE CURRENT USER BASED ON TOKEN */
    const currentUser = await Users.findOne({
        email: decoded?.email,
    }).select('-__v');

    /* IF NO MATCHING USER IS FOUND */
    if (!currentUser)
        return res.status(401).json({
            status: "fail",
            data:{
                message: 'The user belonging to this token does no longer exist.'
            }
        }
    )

    req.user = currentUser;

    next();
});