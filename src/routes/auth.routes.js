const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const {loginschema} = require("../validation/auth.validation");

router.post("/login", validate(loginschema), authController.login);

module.exports = router;