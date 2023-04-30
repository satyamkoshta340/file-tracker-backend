const express = require("express");
const authMiddleware = require("../controllers/middlewares/auth");
const userController = require("../controllers/userController");
const fileController = require("../controllers/filesController");

const router = express.Router();
router.use(authMiddleware.protectedRoute);

router.get("/", userController.getUser);
router.get("/getAllUsers", userController.getAllUsers);
router.get("/recent-files", fileController.getTopFiveRecentFiles);
router.get("/getAllRecentFiles", fileController.getAllRecentFiles);
router.put("/updateUser", userController.updateUser);

module.exports = router;
