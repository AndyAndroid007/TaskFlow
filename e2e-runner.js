const { spawn } = require('child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');
const cypress = require('./mern-frontend/node_modules/cypress');

// Global E2E state
let isShuttingDown = false;
let mongod;
let backend;
let frontend;

async function cleanupDatabase() {
    console.log("🧹 Stopping sandbox MongoDB instance...");
    try {
        if (mongod) await mongod.stop();
        console.log("✅ Sandbox MongoDB stopped and wiped.");
    } catch (err) {
        console.error("❌ Failed to stop MongoDB:", err.message);
    }
}

async function waitForServer(url, label, maxRetries = 30, delayMs = 1000) {
    const http = require('http');
    for (let i = 0; i < maxRetries; i++) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        try {
            await new Promise((resolve, reject) => {
                http.get(url, (res) => {
                    if (res.statusCode < 500) resolve();
                    else reject(new Error(`Status ${res.statusCode}`));
                }).on('error', reject);
            });
            console.log(`✅ ${label} is ready.`);
            return;
        } catch {
            console.log(`⏳ Waiting for ${label}... (attempt ${i + 1}/${maxRetries})`);
        }
    }
    throw new Error(`❌ ${label} never became ready at ${url}`);
}

async function shutdown(code = 0) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n🛑 Shutting down E2E environment...`);
    try {
        if (backend) backend.kill('SIGTERM');
        if (frontend) frontend.kill('SIGTERM');
    } catch (e) {
        // Silently ignore if already dead
    }

    await cleanupDatabase();
    console.log("🏁 All E2E systems successfully terminated.");
    process.exit(code);
}

async function runTests() {
    console.log("🚀 Booting isolated E2E Environment...");

    // 1. Start in-memory MongoDB via MMS
    mongod = await MongoMemoryServer.create();
    const TEST_DB_URI = mongod.getUri();
    console.log(`🗄️  Sandbox MongoDB URI: ${TEST_DB_URI}`);

    // 2. Start Backend with isolated DB URI
    backend = spawn('/opt/homebrew/bin/npm', ['run', 'dev'], {
        cwd: process.cwd(),
        env: { ...process.env, MONGO_URI: TEST_DB_URI },
        stdio: 'pipe'
    });

    backend.stdout.on('data', data => console.log(`[BACKEND]: ${data.toString().trim()}`));
    backend.stderr.on('data', data => console.error(`[BACKEND ERR]: ${data.toString().trim()}`));

    // 3. Start Frontend (Vite)
    frontend = spawn('/opt/homebrew/bin/npm', ['run', 'dev'], {
        cwd: process.cwd() + '/mern-frontend',
        env: { ...process.env },
        stdio: 'pipe'
    });

    frontend.stdout.on('data', data => console.log(`[FRONTEND]: ${data.toString().trim()}`));
    frontend.stderr.on('data', data => console.error(`[FRONTEND ERR]: ${data.toString().trim()}`));

    // 4. Health-check both servers before opening Cypress
    console.log("⏳ Waiting for servers to be ready...");
    await waitForServer('http://localhost:8080', 'Backend');
    await waitForServer('http://localhost:5173', 'Frontend (Vite)');

    // 5. Open Cypress via Module API (Promise-based — resolves when GUI is closed)
    console.log("🔬 Launching Cypress Orchestrator...");
    await cypress.open({
        project: process.cwd() + '/mern-frontend',
    });

    // 6. Cypress GUI was closed by user — run graceful shutdown
    await shutdown(0);
}

// Handle Ctrl+C during server startup (before Cypress opens)
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

runTests().catch(async (err) => {
    console.error("❌ E2E Runner failed to boot:", err.message);
    await shutdown(1);
});
