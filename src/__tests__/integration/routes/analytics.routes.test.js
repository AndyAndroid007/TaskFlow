const request = require('supertest');
const app = require('../../../../src/app');

describe('Analytics Routes Integration', () => {
    let token;

    const userPayload = {
        name: "Analytics User",
        email: "analytics@example.com",
        password: "password123"
    };

    beforeEach(async () => {
        // Seed user and generate JWT token
        await request(app).post('/auth/register').send(userPayload);
        const loginRes = await request(app).post('/auth/login').send({
            email: userPayload.email,
            password: userPayload.password
        });
        token = loginRes.body.token;

        const taskPayload = {
            title: "Analytics Demo Task",
            description: "Task for checking analytics",
            priority: 1,
            assignee: loginRes.body.user._id
        };

        // Seed a task to ensure analytics isn't just an empty mathematical zero
        await request(app)
            .post('/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send(taskPayload);
    });

    describe('GET /analytics/summary', () => {
        it('Should fetch the task analytics summary and return 200', async () => {
            const res = await request(app)
                .get('/analytics/summary')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('TotalTasks');
            expect(res.body.TotalTasks).toBeGreaterThanOrEqual(1); // Since we seeded 1
        });

        it('Should return 401 if unauthorized', async () => {
            const res = await request(app).get('/analytics/summary');
            expect(res.statusCode).toBe(401);
        });
    });
});
