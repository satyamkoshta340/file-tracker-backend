const express = require("express");
const authMiddleware = require("../controllers/middlewares/auth");
const userController = require("../controllers/userController");

const router = express.Router();
router.use(authMiddleware.protectedRoute);

router.get("/", userController.getUser);

module.exports = router