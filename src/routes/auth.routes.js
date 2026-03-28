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

//Google OAuth endpoints
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
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
    }),
    authController.oAuthCallback
);

// Github OAuth endpoints
router.get('/github',
    passport.authenticate("github", {
        scope: ["user:email"],
        session: false,
    }),
);

router.get('/github/callback',
    passport.authenticate("github",{
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
    }),
    authController.oAuthCallback
);

//LinkedIn OAuth endpoints
router.get('/linkedin',
    passport.authenticate("linkedin",{
        session: false,
        scope: ["openid","profile","email"],

    })
);

router.get('/linkedin/callback',
    passport.authenticate("linkedin",{
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
    }),
    authController.oAuthCallback
);

module.exports = router;