const Users = require("../models/userModel");
const Cryptr = require("cryptr");
const jwt = require("../services/jwtService");
const validator = require("validator");
const asyncWrapper = require("../utils/asyncWrapper");
const { OAuth2Client } = require("google-auth-library");
const cryptr = new Cryptr("myTotallySecretKey");
const { sendEmail } = require("../utils/sendEmail");
const crypto = require("crypto");
// const axios = require("axios");
const path = require("path");
// const bcrypt = require("bcrypt");

exports.login = asyncWrapper(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "please provide valid email & password",
        },
      });
    }
    const existingUser = await Users.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "No user assosiated with this email.",
        },
      });
    }
    if (!existingUser.password) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: `You signed up with Google. Please login using Google.`,
        },
      });
    }
    // if (!existingUser.password) {
    //   existingUser.password = cryptr.encrypt(password);
    //   await existingUser.save();
    // }

    if (existingUser.status != "active") {
      const firstName = existingUser.firstName;
      const confirmationCode = existingUser.confirmationCode;

      const mailOptions = {
        from: `"no-reply" ${process.env.SMTP_USER_NAME}`,
        to: email,
        subject: "Please confirm your account",
        html: `<!DOCTYPE html>
        <html lang="en"> 
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirm Account</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link href='https://fonts.googleapis.com/css?family=Orbitron' rel='stylesheet' type='text/css'>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Merriweather&family=Montserrat&family=Roboto&display=swap"
                rel="stylesheet">
        </head>
        <body>
            <center>
                <div style="width: 350px">
                    <header
                        style="display: flex; flex-direction: column; align-items:center; border-bottom: solid #A5D7E8; border-width: thin; justify-content: center;">
                        <img src="https://play-lh.googleusercontent.com/asrfS4x89LkxFILsB4rYxFmX7n0K61MM0QEHpQ7GMlzfekHIeNLHxlP5dEbt1SstnFU=w240-h480"
                            width="60px" height="50px" alt="GKV" />
                        <p style="font-family: Merriweather; color: crimson; font-weight: 900;">Let's Track</p>
                    </header>
                    <br />
                    <div style="text-align: center;">
                        <div>
                            <img src="https://png.pngtree.com/png-vector/20190726/ourmid/pngtree-package-pending-icon-for-your-project-png-image_1599195.jpg"
                                width="120px">
                        </div>
                        <P style="text-align: left;">Hello ${firstName},</P>
                        <p style="text-align: left;">Thank you for part of the GKV (Let's Track). Please confirm your email by clicking on the
                            following link.</p>
                        <a href=${process.env.SERVER_URL}/auth/confirm/${confirmationCode} target="_blank">
                            <button
                                style="background: #1ea040; border: none; color: white; height: 40px; width: 280px; border-radius: 5px; font-weight: 800; font-size: medium;cursor: pointer;">
                                Verify Email-ID</button>
                        </a>
                    </div>
                    <br />
                    <!-- <div>
                        <div style="display: flex; border-radius: 4px;">
                            <div style="padding-left: 1%;">
                                <P style="word-wrap: break-word; font-weight: 600;">Available on Playstore</P>
                            </div>
                            <a href=''
                                style='cursor:pointer;display:block'><img
                                    src='' style="overflow: hidden;"
                                    width="160px" alt='Download app from Playstore'></a>
                        </div>
                    </div> -->
                    <footer>
                        <p style="font-size:x-small;">You have received this mail because your e-mail ID is registered with
                            Let's Track application. This is a system-generated e-mail, please don't reply to this message.</p>
                    </footer>
                </div>
            </center>
        </body>
        </html>
        `,
      };
      sendEmail(mailOptions);

      return res.status(203).json({
        status: "success",
        data: {
          message:
            "Pending account. Please verify your email or continue with Google.",
        },
      });
    }

    const decryptedPassword = cryptr.decrypt(existingUser.password);
    if (decryptedPassword === password) {
      const token = jwt.signToken(email);
      res.status(200).json({
        status: "success",
        data: {
          user: existingUser,
          token,
        },
      });
    } else {
      res.status(403).json({
        status: "fail",
        data: {
          message: "invalid credentials",
        },
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "fail",
      data: {
        message: "Internal Server Error",
      },
    });
  }
});

exports.register = asyncWrapper(async (req, res, next) => {
  try {
    const { firstName, lastName, email, department, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        status: "fail",
        data: {
          message: "Please fill all required fields",
        },
      });
    }
    const encryptedPass = cryptr.encrypt(password);
    if (!validator.isEmail(email)) {
      return res.status(402).json({
        status: "fail",
        data: {
          message: "Invalid Email",
        },
      });
    }
    const existingEmailUser = await Users.findOne({ email });
    if (existingEmailUser) {
      return res.status(409).json({
        status: "fail",
        data: {
          message: "Already existing email can't be used!",
        },
      });
    }
    //
    const confirmationCode = crypto.randomBytes(25).toString("hex");

    const newUser = await Users.create({
      firstName,
      lastName,
      email,
      department,
      password: encryptedPass,
      confirmationCode,
    });
    //
    const mailOptions = {
      from: `"no-reply" ${process.env.SMTP_USER_NAME}`,
      to: email,
      subject: "Please confirm your account",
      html: `<!DOCTYPE html>
      <html lang="en"> 
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Account</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href='https://fonts.googleapis.com/css?family=Orbitron' rel='stylesheet' type='text/css'>
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Merriweather&family=Montserrat&family=Roboto&display=swap"
              rel="stylesheet">
      </head>
      <body>
          <center>
              <div style="width: 350px">
                  <header
                      style="display: flex; flex-direction: column; align-items:center; border-bottom: solid #A5D7E8; border-width: thin; justify-content: center;">
                      <img src="https://play-lh.googleusercontent.com/asrfS4x89LkxFILsB4rYxFmX7n0K61MM0QEHpQ7GMlzfekHIeNLHxlP5dEbt1SstnFU=w240-h480"
                          width="60px" height="50px" alt="GKV" />
                      <p style="font-family: Merriweather; color: crimson; font-weight: 900;">Let's Track</p>
                  </header>
                  <br />
                  <div style="text-align: center;">
                      <div>
                          <img src="https://png.pngtree.com/png-vector/20190726/ourmid/pngtree-package-pending-icon-for-your-project-png-image_1599195.jpg"
                              width="120px">
                      </div>
                      <P style="text-align: left;">Hello ${firstName},</P>
                      <p style="text-align: left;">Thank you for part of the GKV (Let's Track). Please confirm your email by clicking on the
                          following link.</p>
                      <a href=${process.env.SERVER_URL}/auth/confirm/${confirmationCode} target="_blank">
                          <button
                              style="background: #1ea040; border: none; color: white; height: 40px; width: 280px; border-radius: 5px; font-weight: 800; font-size: medium;cursor: pointer;">
                              Verify Email-ID</button>
                      </a>
                  </div>
                  <br />
                  <!-- <div>
                      <div style="display: flex; border-radius: 4px;">
                          <div style="padding-left: 1%;">
                              <P style="word-wrap: break-word; font-weight: 600;">Available on Playstore</P>
                          </div>
                          <a href=''
                              style='cursor:pointer;display:block'><img
                                  src='' style="overflow: hidden;"
                                  width="160px" alt='Download app from Playstore'></a>
                      </div>
                  </div> -->
                  <footer>
                      <p style="font-size:x-small;">You have received this mail because your e-mail ID is registered with
                          Let's Track application. This is a system-generated e-mail, please don't reply to this message.</p>
                  </footer>
              </div>
          </center>
      </body>
      </html>`,
    };
    sendEmail(mailOptions);

    res.status(201).json({
      status: "success",
      data: {
        message: "User was registered successfully! Please check your email",
      },
    });

    //
    // const token = jwt.signToken(email);
    // res.status(200).json({
    //   status: "success",
    //   data: {
    //     user: newUser,
    //     token,
    //   },
    // });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "fail",
      data: {
        message: "Internal Server Error",
      },
    });
  }
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
    let profile = null;
    if (req.body.credential) {
      const verificationResponse = await verifyGoogleToken(req.body.credential);
      if (verificationResponse.error) {
        return res.status(400).json({
          error: true,
          message: verificationResponse.error,
        });
      }
      profile = verificationResponse?.payload;
    } else {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${req.body.googleToken}` },
        }
      );
      console.log(response);
      if (!response.ok)
        return res.status(400).json({
          error: true,
          message: "Invalid user detected. Please try again",
        });
      profile = await response.json();
    }
    console.log(profile);
    const gID = profile.sub || profile.id;
    const firstName = profile.given_name;
    const lastName = profile.family_name;
    const verified = profile.verified;
    const email = profile.email;
    const picture = profile.picture;
    const status = "active";
    let user;
    try {
      user = await Users.findOne({ email: email });
      console.log(user);
      if (!user) {
        const userData = {
          gID,
          firstName,
          lastName,
          verified,
          email,
          picture,
          status,
        };
        user = await Users.create(userData);
      } else if (!user.gID) {
        await Users.updateOne(
          { email },
          { gID, firstName, lastName, picture, status }
        );
      } else {
        console.log("existingUser");
      }
    } catch (err) {
      console.log("====================================");
      console.error(err);
      console.log("====================================");
    }

    const token = jwt.signToken(user.email);
    res.status(200).json({
      status: "success",
      token,
      user,
      message: "User Authenticated sucessfully",
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ status: "failure", message: "Internal Server Error" });
  }
};

exports.authWithGoogleForApp = async (req, res) => {
  try {
    const { firstName, lastName, email, gId, picture } = req.body;
    console.log(req.body);
    if (!gId || !email)
      return res
        .status(400)
        .json({ error: true, message: "Somthing is missing" });
    // if (!/[a-zA-Z0-9+_.-]+@gkv.ac.in/.test(email))
    //   return res
    //     .status(400)
    //     .json({ error: true, message: "Please use GKV mail" });
    let user = await Users.findOne({ email });
    let gID = gId;
    if (!user) {
      user = await new Users({
        firstName,
        lastName,
        email,
        gID,
        picture,
        status: "active",
      }).save();
    } else if (!user.gID) {
      await Users.updateOne(
        { email },
        { firstName, lastName, gID, picture, status: "active" }
      );
    }
    const token = jwt.signToken(user.email);
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

exports.confirmAccount = async (req, res) => {
  try {
    const user = await Users.findOneAndUpdate(
      {
        confirmationCode: req.params.token,
      },
      { status: "active" }
    );
    if (!user)
      return res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
    </head>
    <body>
        <div style="display: flex;align-items: center;justify-content: center;">
            <div style="width: 350px;">
                <div style="display: flex; flex-direction: column; align-items: center;padding-top: 80px;">
                    <div style="display: flex; justify-content: center;">
                        <img src="https://nika.shop/wp-content/uploads/2020/01/fail-png-7.png" width="120px">
                    </div>
                    <h2>Something Went Wrong!</h2>
                    <p style="color: red;">User Not Found.</p>
                    <p>Please register again or Continue with Google.</p>
                </div>
            </div>
        </div>
    </body>
    </html>`);
    res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Success</title>
    </head>
    <body>
        <div style="display: flex;align-items: center;justify-content: center;">
            <div style="width: 350px;">
                <div style="display: flex; flex-direction: column; align-items: center;padding-top: 80px;">
                    <div style="display: flex; justify-content: center;">
                        <img src="https://freepngimg.com/thumb/success/6-2-success-png-image.png" width="120px">
                    </div>
                    <h2>Successful!</h2>
                    <p style="color: green;">Your Account has been Verified!</p>
                    <p>Now, You are able to Login.</p>
                </div>
            </div>
        </div>
    </body>
    </html>`);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

// @route POST api/auth/recover
// @desc Recover Password - Generates token and Sends password reset email
// @access Public
exports.recover = async (req, res) => {
  if (!req.body.email)
    return res.status(400).json({ error: true, message: "Email is missing" });
  const email = req.body.email.replace(/\s/g, "").toLowerCase();
  try {
    const resetPasswordToken = crypto.randomBytes(20).toString("hex");
    console.log(resetPasswordToken);
    const user = await Users.findOneAndUpdate(
      { email },
      {
        resetPasswordToken,
        resetPasswordExpires: Date.now() + 3600000,
      }
    );
    if (!user)
      return res
        .status(401)
        .json({ error: true, message: "No User found with given email" });
    let link = `${process.env.SERVER_URL}/auth/reset/${resetPasswordToken}`;
    const mailOptions = {
      from: `"no-reply" ${process.env.SMTP_USER_NAME}`,
      to: user.email,
      subject: "Password change request",
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Change</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href='https://fonts.googleapis.com/css?family=Orbitron' rel='stylesheet' type='text/css'>
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Merriweather&family=Montserrat&family=Roboto&display=swap"
              rel="stylesheet">
      </head>
      <body>
          <center>
              <div style="width: 350px;">
                  <header
                      style="display: flex; flex-direction: row; align-items: center; border-bottom: solid #A5D7E8; border-width: thin;">
                      <img src="https://play-lh.googleusercontent.com/asrfS4x89LkxFILsB4rYxFmX7n0K61MM0QEHpQ7GMlzfekHIeNLHxlP5dEbt1SstnFU=w240-h480"
                          width="60px" height="50px" alt="GKV" />
                      <p style="font-family: Merriweather; color: #002B5B;margin-left: 20px; font-weight: 600; color:crimson;">Let's Track</p>
                  </header>
                  <br />
                  <div>
                      <p style="font-family: Helvetica Neue,Helvetica,Lucida Grande,tahoma,verdana,arial,sans-serif; text-align: start; color: grey; line-height: 2;">
                          Hi ${user.firstName},<br /> <br />
                          Sorry to hear you're having trouble logging into Let's Track. We got a message that you forgot your
                          password. If this was you, you can reset your password now.</p>
                      <a href=${link} target="_blank">
                          <button
                              style="background: #5DA7DB; border: none; color: white;cursor: pointer ;height: 50px; width: 280px; border-radius: 5px;margin-left: 20px; font-weight: 800; font-size: medium;">
                              Reset your password
                          </button>
                      </a>
                  </div>
                  <br />
                  <footer>
                      <p style="font-size:x-small;">You have received this mail because your e-mail ID is registered with
                          Let's Track. This is a system-generated e-mail, please don't reply to this message.</p>
                  </footer>
              </div>
          </center>
      </body>
      </html>`,
    };
    sendEmail(mailOptions);
    res
      .status(200)
      .json({ error: false, message: "A reset email has been sent" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

// @route GET api/auth/reset/:token
// @desc Reset Password - Validate password reset token and shows the password reset view
// @access Public
exports.reset = async (req, res) => {
  try {
    const user = await Users.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user)
      return res.send(`<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error</title>
      </head>
      <body>
          <div style="display: flex;align-items: center;justify-content: center;">
              <div style="width: 350px;">
                  <div style="display: flex; flex-direction: column; align-items: center;padding-top: 80px;">
                      <div style="display: flex; justify-content: center;">
                          <img src="https://nika.shop/wp-content/uploads/2020/01/fail-png-7.png" width="120px">
                      </div>
                      <h2>Something Went Wrong!</h2>
                      <p style="color: red;">Password reset token is invalid or has expired.</p>
                      <p>Please reset your password once more.</p>
                  </div>
              </div>
          </div>
      </body>
      </html>`);
    const __dirname = path.resolve();
    res.sendFile(__dirname + "/reset.html");
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

// @route POST api/auth/reset/:token
// @desc Reset Password
// @access Public
exports.resetPassword = async (req, res) => {
  try {
    console.log(req.body);

    const encryptedPass = cryptr.encrypt(req.body.password);

    const user = await Users.findOneAndUpdate(
      {
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() },
      },
      {
        password: encryptedPass,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        status: "active",
      }
    );
    if (!user)
      return res.send(`<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error</title>
      </head>
      <body>
          <div style="display: flex;align-items: center;justify-content: center;">
              <div style="width: 350px;">
                  <div style="display: flex; flex-direction: column; align-items: center;padding-top: 80px;">
                      <div style="display: flex; justify-content: center;">
                          <img src="https://nika.shop/wp-content/uploads/2020/01/fail-png-7.png" width="120px">
                      </div>
                      <h2>Something Went Wrong!</h2>
                      <p style="color: red;">Password reset token is invalid or has expired.</p>
                      <p>Please reset your password once more.</p>
                  </div>
              </div>
          </div>
      </body>
      </html>`);
    const mailOptions = {
      from: `"no-reply" ${process.env.SMTP_USER_NAME}`,
      to: user.email,
      subject: "Your password has been changed",
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href='https://fonts.googleapis.com/css?family=Orbitron' rel='stylesheet' type='text/css'>
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Merriweather&family=Montserrat&family=Roboto&display=swap"
              rel="stylesheet">
      </head>
      <body>
          <center>
              <div style="width: 350px">
                  <header
                      style="display: flex; flex-direction: row; align-items:center; border-bottom: solid #A5D7E8; border-width: thin;">
                      <img src="https://play-lh.googleusercontent.com/asrfS4x89LkxFILsB4rYxFmX7n0K61MM0QEHpQ7GMlzfekHIeNLHxlP5dEbt1SstnFU=w240-h480"
                          width="60px" height="50px" alt="GKV" />
                      <p style="font-family: Merriweather; color: #002B5B;margin-left: 20px; font-weight: 600;">Let's Track</p>
                  </header>
                  <br />
                  <div style="text-align: center;">
                      <P style="text-align: left;">Hi ${user.firstName},</P>
                      <p style="text-align: left;">This is a confirmation that the password for your account
                          ${user.email} has just been changed.</p>
                      <br />
                  </div>
                  <br />
                  <footer>
                      <p style="font-size:x-small;">You have received this mail because your e-mail ID is registered with
                          Let's Track. This is a system-generated e-mail, please don't reply to this message.</p>
                  </footer>
              </div>
          </center>
      </body>
      </html>`,
    };
    sendEmail(mailOptions);
    res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Success</title>
    </head>
    <body>
        <div style="display: flex;align-items: center;justify-content: center;">
            <div style="width: 350px;">
                <div style="display: flex; flex-direction: column; align-items: center;padding-top: 80px;">
                    <div style="display: flex; justify-content: center;">
                        <img src="https://freepngimg.com/thumb/success/6-2-success-png-image.png" width="120px">
                    </div>
                    <h2>Successful!</h2>
                    <p>Your Password has been Updated! Now, You are able to Login.</p>
                </div>
            </div>
        </div>
    </body>
    </html>`);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};
