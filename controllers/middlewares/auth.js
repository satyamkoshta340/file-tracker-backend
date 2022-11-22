exports.protectedRoute = async(req, res, next) =>{
    if( req.user ) return next();
    else{
        res.status(403).json({
        status: "fail",
        data: { message: "please login first!"}
    })}
}