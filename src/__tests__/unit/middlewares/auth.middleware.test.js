const jwt = require("jsonwebtoken");
const authMiddleware = require("../../../../src/middlewares/auth.middleware");
const userRepository = require("../../../../src/repositories/user.repository");
const ApiError = require("../../../../src/exceptions/ApiError");

// Mock the repository to test purely logic without a real database
jest.mock("../../../../src/repositories/user.repository");

describe('Auth Middleware Unit Tests', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = {
            headers: {}
        };
        mockRes = {};
        mockNext = jest.fn(); // Spy function
        process.env.JWT_SECRET = "test-secret";
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Should call next with 401 ApiError if Authorization header is entirely missing', async () => {
        await authMiddleware(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
    });

    it('Should call next with 401 ApiError if token is invalid or malformed', async () => {
        mockReq.headers.authorization = "Bearer invalid-token-string";
        await authMiddleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
    });

    it('Should call next with 404 ApiError if user no longer exists in database', async () => {
        const token = jwt.sign({ userId: 'fake-id' }, process.env.JWT_SECRET);
        mockReq.headers.authorization = `Bearer ${token}`;

        // Mock the repository to simulate user not found
        userRepository.findById.mockResolvedValue(null);

        await authMiddleware(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
        expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });

    it('Should flawlessly attach user to req and call next() on entirely valid token', async () => {
        const validUser = { _id: 'real-id', email: 'test@example.com' };
        const token = jwt.sign({ userId: validUser._id }, process.env.JWT_SECRET);
        mockReq.headers.authorization = `Bearer ${token}`;

        userRepository.findById.mockResolvedValue(validUser);

        await authMiddleware(mockReq, mockRes, mockNext);
        
        expect(mockReq.user).toEqual(validUser);
        expect(mockNext).toHaveBeenCalledWith(); // Called cleanly with no arguments
    });
});
