const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

router.post("/api/auth/signup", authController.userValidationRules(), authController.validate, authController.signup);
router.post("/api/auth/signin", authController.signin);
router.get("/api/auth/signout", authController.signout);

module.exports = router;
