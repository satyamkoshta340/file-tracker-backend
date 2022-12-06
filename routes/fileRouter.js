const express = require("express");
const authMiddleware = require("../controllers/middlewares/auth");
const fileController = require("../controllers/filesController");

const router = express.Router();
router.use(authMiddleware.protectedRoute);

router.route("/")
    .post(fileController.createFile)
    .get(fileController.getAllFiles);

router.route("/:fileId").get(fileController.getFile);

router.route("/history/:fileId")
    .get(fileController.getFileHistory)
    .post(fileController.setFileHistory);

module.exports = router;
