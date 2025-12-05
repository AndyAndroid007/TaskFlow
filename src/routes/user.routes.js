const express = require('express');
const router = express.Router();
const validate = require("../middlewares/validate");
const {createUserSchema} = require("../validation/user.validation");
const auth = require("../middlewares/auth.middleware");

const userController = require("../controllers/user.controller");

router.get("/", auth, userController.getUsers);
router.get("/:id", auth, userController.getUserById);

router.post("/", auth, validate(createUserSchema), userController.createUser);

module.exports = router;