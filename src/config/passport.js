const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const authService = require('../services/auth.service');
const logger = require('../utils/logger');

function registerStrategy(name, requiredEnvVars, createStrategy) {
    const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missingVars.length > 0) {
        logger.warn(`Skipping ${name} OAuth strategy registration`, {
            missingEnvVars: missingVars,
        });
        return;
    }

    passport.use(createStrategy());
}

registerStrategy('google', ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'BACKEND_URL'], () => new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const result = await authService.handleOAuthLogin(profile, 'google');
        return done(null, result);
    } catch (error) {
        logger.error('Error during Google Authentication', { error: error.message });
        return done(error, null);
    }
}));

registerStrategy('github', ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_CALLBACK_URL'], () => new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
},
async (accessToken, refreshToken, profile, done) => {
    try {
        if (!profile.emails) {
            try {
                const res = await fetch('https://api.github.com/user/emails', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'User-Agent': 'taskflow',
                    },
                });

                if (!res.ok) {
                    throw new Error('Error during GitHub Authentication');
                }
                const userEmails = await res.json();
                profile.emails = [{ value: userEmails.find((entry) => entry.primary === true).email }];
            } catch (error) {
                logger.error("Error while accessing GitHub's Email API", { error: error.message });
                throw new Error('Error during GitHub Authentication. Please try again later.');
            }
        }
        const result = await authService.handleOAuthLogin(profile, 'github');
        return done(null, result);
    } catch (err) {
        logger.error('Error during GitHub Authentication', { error: err.message });
        return done(err, null);
    }
}));

registerStrategy('linkedin', ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_CALLBACK_URL'], () => new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL,
    scope: ['openid', 'profile', 'email'],
    skipUserProfile: true,
    userProfileURL: 'https://api.linkedin.com/v2/userinfo',
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let normalizedProfile;
        try {
            const res = await fetch('https://api.linkedin.com/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const userProfile = await res.json();
            normalizedProfile = {
                id: userProfile.sub,
                displayName: userProfile.name,
                emails: [{ value: userProfile.email }],
                photos: [{ value: userProfile.picture }],
            };
        } catch (error) {
            logger.error('Error while retrieving user profile during LinkedIn OAuth', { error: error.message });
            throw new Error('Error during LinkedIn Authentication. Please try again later.');
        }
        const result = await authService.handleOAuthLogin(normalizedProfile, 'linkedin');
        return done(null, result);
    } catch (err) {
        logger.error('Error during LinkedIn Authentication', { error: err.message });
        return done(err, null);
    }
}));

module.exports = passport;
