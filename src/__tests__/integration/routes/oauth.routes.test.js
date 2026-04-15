const request = require('supertest');
const app = require('../../../../src/app');

jest.mock('passport', () => {
    return {
        use: jest.fn(),
        initialize: jest.fn(() => 
            (req, res, next) => next()),
        authenticate: jest.fn((strategy, options) => {
            return (req, res, next) => {
                req.user = {
                    token: "mock-jwt-token"
                };
                next();
            };
        })
    };
});

describe('OAuth Routes Integration', () => {
    describe('Google OAuth', () => {
        it('Should instantly redirect to the frontend with a secure token attached via Google', async () => {
            const res = await request(app).get('/auth/google/callback');
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toContain('token=mock-jwt-token');
        });
    });

    describe('GitHub OAuth', () => {
        it('Should instantly redirect to the frontend with a secure token attached via GitHub', async () => {
            const res = await request(app).get('/auth/github/callback');
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toContain('token=mock-jwt-token');
        });
    });

    describe('LinkedIn OAuth', () => {
        it('Should instantly redirect to the frontend with a secure token attached via LinkedIn', async () => {
            const res = await request(app).get('/auth/linkedin/callback');
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toContain('token=mock-jwt-token');
        });
    });
});