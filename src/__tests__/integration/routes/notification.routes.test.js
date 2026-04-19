const request = require('supertest');
const app = require('../../../../src/app');
const Notification = require('../../../../src/models/notification.model');
const notificationService = require('../../../../src/services/notification.service');

describe('Notification Routes Integration', () => {
    let token;
    let userId;

    const userPayload = {
        name: 'Notification User',
        email: 'notificationuser@example.com',
        password: 'password123',
    };

    beforeEach(async () => {
        await request(app).post('/auth/register').send(userPayload);
        const loginRes = await request(app).post('/auth/login').send({
            email: userPayload.email,
            password: userPayload.password,
        });

        token = loginRes.body.token;
        userId = loginRes.body.user._id;
    });

    it('Should fetch persisted notifications for the authenticated user', async () => {
        await notificationService.createNotification(userId, {
            type: 'TASK_CREATED',
            title: 'Task Alpha',
            message: 'Task Alpha was created.',
        });

        const res = await request(app)
            .get('/notifications')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe('Task Alpha');
    });

    it('Should cap persisted notifications at 10 per user', async () => {
        for (let index = 1; index <= 12; index += 1) {
            await notificationService.createNotification(userId, {
                type: 'TASK_UPDATED',
                title: `Task ${index}`,
                message: `Task ${index} was updated.`,
            });
        }

        const res = await request(app)
            .get('/notifications')
            .set('Authorization', `Bearer ${token}`);

        const storedNotifications = await Notification.find({ userId }).sort({ receivedAt: -1, _id: -1 });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(10);
        expect(storedNotifications).toHaveLength(10);
        expect(storedNotifications.some((notification) => notification.title === 'Task 1')).toBe(false);
        expect(storedNotifications.some((notification) => notification.title === 'Task 12')).toBe(true);
    });

    it('Should delete a single notification', async () => {
        const notification = await notificationService.createNotification(userId, {
            type: 'TASK_UPDATED',
            title: 'Task Delete',
            message: 'Task Delete was updated.',
        });

        const res = await request(app)
            .delete(`/notifications/${notification._id}`)
            .set('Authorization', `Bearer ${token}`);

        const storedNotification = await Notification.findById(notification._id);

        expect(res.statusCode).toBe(200);
        expect(storedNotification).toBeNull();
    });

    it('Should clear all notifications for the authenticated user', async () => {
        await notificationService.createNotification(userId, {
            type: 'TASK_CREATED',
            title: 'Task One',
            message: 'Task One was created.',
        });
        await notificationService.createNotification(userId, {
            type: 'TASK_COMPLETED',
            title: 'Task Two',
            message: 'Task Two was completed.',
        });

        const res = await request(app)
            .delete('/notifications')
            .set('Authorization', `Bearer ${token}`);

        const storedNotifications = await Notification.find({ userId });

        expect(res.statusCode).toBe(200);
        expect(storedNotifications).toHaveLength(0);
    });
});
