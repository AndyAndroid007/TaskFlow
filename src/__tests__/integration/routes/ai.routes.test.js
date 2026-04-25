// IMPORTANT: mock callGemini BEFORE requiring anything that imports it
jest.mock('../../../../src/modules/ai/llmClient', () => ({
    callGemini: jest.fn().mockResolvedValue({ type: 'text', text: 'This is a test reply.' }),
}));

const request = require('supertest');
const app = require('../../../../src/app');

describe('AI Routes Integration', () => {
    let token;

    const userPayload = {
        name: 'AI Test User',
        email: 'aitest@example.com',
        password: 'password123',
    };

    beforeEach(async () => {
        await request(app).post('/auth/register').send(userPayload);
        const loginRes = await request(app).post('/auth/login').send({
            email: userPayload.email,
            password: userPayload.password,
        });
        token = loginRes.body.token;
    });

    // ─── GET /ai/conversation ────────────────────────────────────────────────

    describe('GET /ai/conversation', () => {
        it('should return 200 with empty messages when no conversation exists', async () => {
            const res = await request(app)
                .get('/ai/conversation')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('messages');
            expect(Array.isArray(res.body.messages)).toBe(true);
            expect(res.body.messages).toHaveLength(0);
        });

        it('should return 401 without an auth token', async () => {
            const res = await request(app).get('/ai/conversation');
            expect(res.statusCode).toBe(401);
        });
    });

    // ─── POST /ai/chat ───────────────────────────────────────────────────────

    describe('POST /ai/chat', () => {
        it('should return 200 with a reply for a valid message', async () => {
            const res = await request(app)
                .post('/ai/chat')
                .set('Authorization', `Bearer ${token}`)
                .send({ message: 'Hello, what should I work on today?' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('reply');
            expect(typeof res.body.reply).toBe('string');
            expect(res.body.reply.length).toBeGreaterThan(0);
        });

        it('should return 400 when message is an empty string', async () => {
            const res = await request(app)
                .post('/ai/chat')
                .set('Authorization', `Bearer ${token}`)
                .send({ message: '' });

            expect(res.statusCode).toBe(400);
        });

        it('should return 400 when message field is missing', async () => {
            const res = await request(app)
                .post('/ai/chat')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.statusCode).toBe(400);
        });

        it('should return 400 when message exceeds 1000 chars', async () => {
            const res = await request(app)
                .post('/ai/chat')
                .set('Authorization', `Bearer ${token}`)
                .send({ message: 'a'.repeat(1001) });

            expect(res.statusCode).toBe(400);
        });

        it('should return 401 without an auth token', async () => {
            const res = await request(app)
                .post('/ai/chat')
                .send({ message: 'Hello' });

            expect(res.statusCode).toBe(401);
        });

        it('should persist the message and reply in the conversation', async () => {
            await request(app)
                .post('/ai/chat')
                .set('Authorization', `Bearer ${token}`)
                .send({ message: 'What tasks do I have?' });

            const convRes = await request(app)
                .get('/ai/conversation')
                .set('Authorization', `Bearer ${token}`);

            expect(convRes.body.messages.length).toBeGreaterThan(0);
            expect(convRes.body.messages[0].role).toBe('user');
        });
    });

    // ─── POST /ai/confirm-task ───────────────────────────────────────────────

    describe('POST /ai/confirm-task', () => {
        it('should return 400 when confirmed: true but no pending proposal', async () => {
            const res = await request(app)
                .post('/ai/confirm-task')
                .set('Authorization', `Bearer ${token}`)
                .send({ confirmed: true });

            expect(res.statusCode).toBe(400);
        });

        it('should return 400 when confirmed field is missing', async () => {
            const res = await request(app)
                .post('/ai/confirm-task')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.statusCode).toBe(400);
        });

        it('should return 401 without an auth token', async () => {
            const res = await request(app)
                .post('/ai/confirm-task')
                .send({ confirmed: false });

            expect(res.statusCode).toBe(401);
        });
    });

    // ─── DELETE /ai/conversation ─────────────────────────────────────────────

    describe('DELETE /ai/conversation', () => {
        it('should return 200 with a confirmation reply', async () => {
            const res = await request(app)
                .delete('/ai/conversation')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('reply');
            expect(typeof res.body.reply).toBe('string');
        });

        it('should clear the conversation so GET returns empty messages', async () => {
            // First send a message to create a conversation
            await request(app)
                .post('/ai/chat')
                .set('Authorization', `Bearer ${token}`)
                .send({ message: 'Hello!' });

            // Then clear it
            await request(app)
                .delete('/ai/conversation')
                .set('Authorization', `Bearer ${token}`);

            // Verify it's gone
            const convRes = await request(app)
                .get('/ai/conversation')
                .set('Authorization', `Bearer ${token}`);

            expect(convRes.body.messages).toHaveLength(0);
        });

        it('should return 401 without an auth token', async () => {
            const res = await request(app).delete('/ai/conversation');
            expect(res.statusCode).toBe(401);
        });
    });
});
