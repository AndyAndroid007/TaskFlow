const express = require("express");
const router = express.Router();
const passport = require("passport");
const authMiddleware = require("../middlewares/auth.middleware");
const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const { loginschema, registerSchema } = require("../validation/auth.validation");

router.post("/login", validate(loginschema), authController.login);
router.post("/register", validate(registerSchema), authController.register);
router.get("/me", authMiddleware, authController.getMe);
router.get("/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
        accessType: "offline",
    })
);
router.get("/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: "http://localhost:5173/login?error=oauth_failed"
    }),
    authController.oAuthCallback
);

module.exports = router;