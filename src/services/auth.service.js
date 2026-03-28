const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ApiError = require("../exceptions/ApiError");
const userRepository = require("../repositories/user.repository");
const logger = require("../utils/logger");

const login = async ({ email, password }) => {
    const user = await userRepository.findByEmail(email);

    if (!user) {
        logger.warn('Login failed — email not found', { email });
        throw new ApiError(401, "Incorrect Email or Password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        logger.warn('Login failed — incorrect password', { email, userId: user._id });
        throw new ApiError(401, "Incorrect Email or Password");
    }

    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    logger.info('User logged in successfully', { userId: user._id });

    return {
        token,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email
        }
    };
};

const register = async ({ email, password }) => {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
        logger.warn('Registration failed — email already exists', { email });
        throw new ApiError(409, "Email is already associated with an existing user");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userRepository.create({ email, password: hashedPassword });
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }

    )

    logger.info('User registered successfully', { userId: user._id });

    return {
        token,
        user: {
            _id: user._id,
            name: user.name || "",
            email: user.email,
        }
    }
};

const handleOAuthLogin = async (profile, provider) => {
    let user = await userRepository.findByProvider(provider, profile.id);

    if (!user && profile.emails?.[0]?.value) {
        user = await userRepository.findByEmail(profile.emails[0].value);

        if (user) {
            user.provider = provider;
            user.providerId = profile.id;
            user.name = profile.displayName || user.name;
            user.avatar = profile.photos[0].value || user.avatar;
            await user.save();
        }
    }
    if (!user) {
        user = await userRepository.create({
            name: profile.displayName || "Unknown User",
            email: profile.emails?.[0]?.value ?? "",
            provider: provider,
            providerId: profile.id,
            avatar: profile.photos?.[0]?.value ?? ""
        });
        logger.info(`New user registered via ${provider}`, {
            userId: user._id
        });
    }
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    logger.info(`User logged in via ${provider}`, {
        userId: user._id
    });

    return {
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
        },
        token
    }

}

module.exports = { login, register, handleOAuthLogin };