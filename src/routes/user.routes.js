const express = require('express');
const router = express.Router();
const validate = require("../middlewares/validate");
const {createUserSchema} = require("../validation/user.validation");

const userController = require("../controllers/user.controller");

router.get("/",userController.getUsers);
router.get("/:id", userController.getUserById);

router.post("/", validate(createUserSchema), userController.createUser);

module.exports = router;