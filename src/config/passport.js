const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authService = require('../services/auth.service');
const logger = require('../utils/logger');
passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,        
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
    }, 
    async (accessToken, refreshToken, profile, done) => {
        try {
            const result = await authService.handleOAuthLogin(profile, 'google');
            return done(null, result);
        } catch (error) {
            logger.error('Error during Google Authentication', {error: error.message});
            return done(error, null);
        }
    }
)
)
module.exports = passport;