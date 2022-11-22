const express = require("express");
const authMiddleware = require("../controllers/middlewares/auth");
const fileController = require("../controllers/filesController");

const router = express.Router();
router.use(authMiddleware.protectedRoute);

router.route("/")
    .post(fileController.createFile)
    .get(fileController.getAllFiles);

module.exports = router;
