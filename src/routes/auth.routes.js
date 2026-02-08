const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const {loginschema, registerSchema} = require("../validation/auth.validation");

router.post("/login", validate(loginschema), authController.login);
router.post("/register", validate(registerSchema), authController.register);

module.exports = router;