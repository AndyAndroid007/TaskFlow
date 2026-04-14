const {MongoMemoryServer} = require('mongodb-memory-server');
const mongoose = require('mongoose');
require('dotenv').config();
jest.mock('uuid', () => ({
    v4: () => 'test-uuid-1234'
}));


let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for(const key in collections) {
        await collections[key].deleteMany({});
    }

});
afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});