const express = require("express");
const authMiddleware = require("../controllers/middlewares/auth");
const userController = require("../controllers/userController");
const fileController = require("../controllers/filesController");

const router = express.Router();
router.use(authMiddleware.protectedRoute);

router.route("/")
    .get(userController.getUser)
    .put(userController.updateUser);
router.get("/getAllUsers", userController.getAllUsers);
router.get("/recent-files", fileController.getTopFiveRecentFiles);
router.get("/getAllRecentFiles", fileController.getAllRecentFiles);
router.get("/sentFiles",  fileController.getSentFiles);
router.get("/recievedFiles", fileController.getRecievedFiles);

module.exports = router;
