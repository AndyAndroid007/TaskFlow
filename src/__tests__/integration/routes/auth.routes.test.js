const request = require('supertest');
const app = require('../../../../src/app');

describe('Auth Routes Integration', () => {
    const registerPayload = {
        name: "Test User",
        email: "test@example.com",
        password: "password123"

    };
    const loginPayload = {
        email: "test@example.com",
        password: "password123"
    };

    const wrongLoginPayload = {
        email: "test@example.com",
        password: "abc123"
    };
    describe('POST /auth/register', () => {
        it('Should return 201 and valid user object on successful registration', async () => {

            const res = await request(app).post('/auth/register').send(registerPayload);
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toBe(registerPayload.email);
        });
        it('Should return 409 if email is already present', async () => {
            await request(app).post('/auth/register').send(registerPayload);
            const res = await request(app).post('/auth/register').send(registerPayload);

            expect(res.statusCode).toBe(409);
        });
    });
    describe('POST /auth/login', () => {
        beforeEach(async () => {
            const seedRes = await request(app).post('/auth/register').send(registerPayload);
            console.log("SEEDING ERROR:", seedRes.statusCode, seedRes.body); 
        });
        it('Should return 200 and return a token on successful login', async () => {
            const res = await request(app).post('/auth/login').send(loginPayload);
            console.log("LOGIN RESULT: ", res.statusCode, res.body);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
        });
        it('Should return 401 if email or password is wrong', async () => {
            const res = await request(app).post('/auth/login').send(wrongLoginPayload);

            expect(res.statusCode).toBe(401);
        });
        it('Should return 401 if no user is found', async () => {
            const res = await request(app).post('/auth/login').send({
                email: "invaliduser@example.com",
                password: "123456"
            });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /auth/me', () => {
        let token;

        beforeEach(async () => {
            // Seed user and generate token for secure routes
            await request(app).post('/auth/register').send(registerPayload);
            const res = await request(app).post('/auth/login').send(loginPayload);
            token = res.body.token;
        });

        it('Should return 200 and the user profile if authenticated', async () => {
            const res = await request(app)
                .get('/auth/me')
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.statusCode).toBe(200);
            expect(res.body.user).toHaveProperty('email', loginPayload.email);
            expect(res.body.user).not.toHaveProperty('password'); // Ensure password isn't leaked
        });

        it('Should return 401 if no authorization token is provided', async () => {
            const res = await request(app).get('/auth/me');
            expect(res.statusCode).toBe(401);
        });
    });
});