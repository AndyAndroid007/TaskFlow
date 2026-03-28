const authService = require("../services/auth.service");

const login = async (req,res,next) => {
    try {
        const user = await authService.login(req.body);
        res.json(user);
    } catch(err) {
        next(err);
    }
};

const register = async (req,res,next) => {
    try {
    const newUser = await authService.register(req.body);
    res.status(201).json(newUser);
    } catch (err) {
        next(err);
    }
};

const getMe = (req,res,next) => {
    try {
        if (!req.user) {
            return next(new Error("Authenticated user was not attached to the request"));
        }

        const user = typeof req.user.toObject === "function"
            ? req.user.toObject()
            : { ...req.user };

        delete user.password;
        res.json({user});
    } catch (err) {
        next(err);
    }
}

const oAuthCallback = (req,res,next) => {
    try {
        const {token} = req.user;
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
    } catch(err) {
        next(err);
    }
}

module.exports = {login, register, getMe, oAuthCallback};
