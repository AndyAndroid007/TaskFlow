const request = require('supertest');
const app = require('../../../../src/app');

describe('Task Routes Integration', () => {
    let token;
    let taskId;

    const userPayload = {
        name: "Task User",
        email: "taskuser@example.com",
        password: "password123"
    };

    const taskPayload = {
        title: "Test Task",
        description: "Integration testing task",
        priority: 1
    };

    beforeEach(async () => {
        // Seed user and generate token for task routes
        await request(app).post('/auth/register').send(userPayload);
        const loginRes = await request(app).post('/auth/login').send({
            email: userPayload.email,
            password: userPayload.password
        });
        token = loginRes.body.token;
        // Mongoose heavily enforces assignee ID!
        taskPayload.assignee = loginRes.body.user._id;
    });

    describe('POST /tasks', () => {
        it('Should create a new task and return 201', async () => {
            const res = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send(taskPayload);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.title).toBe(taskPayload.title);
            taskId = res.body._id; // Save globally for the GET/PUT/DELETE tests
        });

        it('Should return 401 if unauthorized', async () => {
            const res = await request(app).post('/tasks').send(taskPayload);
            expect(res.statusCode).toBe(401);
        });

        it('Should return 500 if Mongoose required fields are missing', async () => {
            const res = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ description: "Missing title and assignee" });

            // Global error handler interprets raw Mongoose validation errors as 500!
            expect(res.statusCode).toBe(500);
        });
    });

    describe('GET /tasks', () => {
        beforeEach(async () => {
            // Seed a task before triggering GET
            const seed = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send(taskPayload);
            taskId = seed.body._id;
        });

        it('Should fetch all tasks for the authenticated user', async () => {
            const res = await request(app)
                .get('/tasks')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            // The controller directly returns the array
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBeGreaterThan(0);
        });

        it('Should fetch a single task by ID', async () => {
            const res = await request(app)
                .get(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body._id).toBe(taskId);
        });

        it('Should return 404 for a non-existent task ID', async () => {
            // Generating a fake 24 char hex mongoose ID
            const fakeId = '123456789012345678901234'; 
            const res = await request(app)
                .get(`/tasks/${fakeId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(404);
        });
    });

    describe('PUT /tasks/:id', () => {
        beforeEach(async () => {
            const seed = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send(taskPayload);
            taskId = seed.body._id;
        });

        it('Should update an existing task and return 200', async () => {
            const res = await request(app)
                .put(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: "Updated Title", status: "Completed" });

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toBe("Updated Title");
            expect(res.body.status).toBe("Completed");
        });
    });

    describe('DELETE /tasks/:id', () => {
        beforeEach(async () => {
            const seed = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send(taskPayload);
            taskId = seed.body._id;
        });

        it('Should delete a task and return 200 with success message', async () => {
            const res = await request(app)
                .delete(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message');

            // Verify it was actually deleted
            const getRes = await request(app)
                .get(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${token}`);
            expect(getRes.statusCode).toBe(404);
        });
    });
});
