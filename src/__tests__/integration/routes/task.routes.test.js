const request = require('supertest');
const app = require('../../../../src/app');

describe('Task Routes Integration', () => {
    let token;
    let secondUserToken;
    let secondUserId;
    let taskId;

    const userPayload = {
        name: "Task User",
        email: "taskuser@example.com",
        password: "password123"
    };

    const secondUserPayload = {
        name: "Assignee User",
        email: "assignee@example.com",
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
        await request(app).post('/auth/register').send(secondUserPayload);
        const secondLoginRes = await request(app).post('/auth/login').send({
            email: secondUserPayload.email,
            password: secondUserPayload.password
        });
        secondUserToken = secondLoginRes.body.token;
        secondUserId = secondLoginRes.body.user._id;
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

        it('Should show a task on the assignee dashboard when a different owner created it', async () => {
            await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ ...taskPayload, assignee: secondUserId, title: 'Delegated Task' });

            const ownerRes = await request(app)
                .get('/tasks')
                .set('Authorization', `Bearer ${token}`);

            const assigneeRes = await request(app)
                .get('/tasks')
                .set('Authorization', `Bearer ${secondUserToken}`);

            expect(ownerRes.statusCode).toBe(200);
            expect(ownerRes.body.some(task => task.title === 'Delegated Task')).toBe(true);
            expect(assigneeRes.statusCode).toBe(200);
            expect(assigneeRes.body.some(task => task.title === 'Delegated Task')).toBe(true);
        });

        it('Should allow the assignee to fetch a delegated task by ID', async () => {
            const createRes = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ ...taskPayload, assignee: secondUserId, title: 'Delegated Task' });

            const res = await request(app)
                .get(`/tasks/${createRes.body._id}`)
                .set('Authorization', `Bearer ${secondUserToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toBe('Delegated Task');
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

        it('Should allow the assignee to update a delegated task', async () => {
            const delegatedRes = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ ...taskPayload, assignee: secondUserId, title: 'Delegated Task' });

            const res = await request(app)
                .put(`/tasks/${delegatedRes.body._id}`)
                .set('Authorization', `Bearer ${secondUserToken}`)
                .send({ status: 'In Progress' });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('In Progress');
        });

        it('Should prevent the assignee from editing delegated task fields other than status', async () => {
            const delegatedRes = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ ...taskPayload, assignee: secondUserId, title: 'Delegated Task' });

            const res = await request(app)
                .put(`/tasks/${delegatedRes.body._id}`)
                .set('Authorization', `Bearer ${secondUserToken}`)
                .send({ title: 'Changed By Assignee' });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toBe('Assignees can only update task status');
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

        it('Should prevent the assignee from deleting a delegated task', async () => {
            const delegatedRes = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ ...taskPayload, assignee: secondUserId, title: 'Delegated Task' });

            const res = await request(app)
                .delete(`/tasks/${delegatedRes.body._id}`)
                .set('Authorization', `Bearer ${secondUserToken}`);

            expect(res.statusCode).toBe(403);
        });
    });
});
