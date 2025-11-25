const express = require("express");
const router = express.Router();

const userController = require("../controllerss/user.controller");

router.get("/",userController.getUsers);
router.get("/:id", userController.getUserbyId);
router.post("/", userController.createUser);

module.exports = router;