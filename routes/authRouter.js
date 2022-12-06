const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");
require("../services/passportAuthService");

const router = express.Router();

router.post("/login", authController.login);
router.post("/signup", authController.register);


/*
* routes for google login  
*/
router.get("/google", passport.authenticate("google", { scope: ['email', 'profile']}));
router.get("/google/success", (req, res)=>{
    if(req.user){
        res.status(200).json({
            status: "success",
            data: { user: req.user },
        });
    }
    else{
        res.status(403).json({
        status: "fail",
        data: { message: "please login first!"}
    });
    }
})
router.get("/google/callback", passport.authenticate("google", {
    successRedirect: `${process.env.FRONTEND_URL}/file-tracker-frontend`,
    failureRedirect: "/auth/google"
}))

router.get("/logout", (req, res, next)=>{
    req.logout(function(err) {
        if (err) {
            console.log(err)
            return next(err);
        }
        req.session.destroy();
        res.status(200).json({
            status: "success",
            message:"loggedout!"
        })
    });
})
module.exports = router;