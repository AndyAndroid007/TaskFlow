module.exports = {
    testEnvironment: "node",
    projects: [
        {
            displayName: "unit-pure",
            testMatch: [
                "**/unit/modules/**/*.test.js",
                "**/unit/infrastructure/**/*.test.js",
            ],
            testEnvironment: "node",
        },
        {
            displayName: "unit-db",
            testMatch: [
                "**/unit/services/**/*.test.js",
                "**/unit/middlewares/**/*.test.js",
            ],
            testEnvironment: "node",
            setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.js"],
        },
        {
            displayName: "integration",
            testMatch: ["**/integration/**/*.test.js"],
            testEnvironment: "node",
            setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.js"],
        },
    ],
};