const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require("passport");
const mongoose = require("mongoose");
const session = require("express-session");
// const cookieParser = require("cookie-parser");

dotenv.config();
const PORT = process.env.PORT;

const app = express();
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
// app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

let sess = { 
    secret: process.env.APP_SECRET,
    resave: false,
    saveUninitialized: false,
    // cookie: { }
}
// if(app.get('env') === "production"){
//     // app.set('trust proxy', 1);
//     sess.cookie.secure = true;
//     sess.cookie.httpOnly = true;
// }
app.use(session(sess));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DATABASE, (e)=>{
    if(e) return e;
    console.log("database connected successfully");
})

app.use((req, res, next)=>{
    req.requestTime = new Date;
    next();
})
app.get('/', (req, res) => {
    res.send("File Tracker");
})

const authRouter = require("./routes/authRouter");
const fileRouter = require("./routes/fileRouter");
const userRouter = require("./routes/userRouter");

app.use('/auth', authRouter);
app.use('/api/file', fileRouter);
app.use('/api/user', userRouter);
app.get('*', (req, res)=>{
    res.status(404).json({
        status: "FAIL",
        data:{
            message: "Can't find this route in the server"
        }
    })
})

app.listen(PORT || 8800, (req, res)=>{
    console.log(`Server is running on ${PORT}`);
})