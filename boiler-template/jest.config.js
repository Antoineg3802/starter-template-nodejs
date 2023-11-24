module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/*.test.js'],
    collectCoverage: true,
    collectCoverageFrom: ["./src/routes/*"],
    coverageThreshold: {
        global: {
            lines: 90
        }
    }
};