const asyncWrapper = require("../utils/asyncWrapper");

exports.getUser = asyncWrapper( async (req, res, next) => {
    if(req.user){
        res.status(200).json({
            status: "success",
            data:{
                user: req.user
            }
        })
    }
});