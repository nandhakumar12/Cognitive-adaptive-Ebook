import axios from 'axios';

const endpoints = [
    'http://localhost:3001/health', // Gateway (self)
    process.env.EVENT_SERVICE_URL ? `${process.env.EVENT_SERVICE_URL}/health` : 'http://localhost:3002/health',
    process.env.COGNITIVE_SERVICE_URL ? `${process.env.COGNITIVE_SERVICE_URL}/health` : 'http://localhost:3003/health',
    process.env.ADAPTATION_SERVICE_URL ? `${process.env.ADAPTATION_SERVICE_URL}/health` : 'http://localhost:3004/health',
];

async function checkHealth() {
    console.log('Verifying Microservices Health...');

    for (const url of endpoints) {
        try {
            const start = Date.now();
            const response = await axios.get(url, { timeout: 2000 });
            const duration = Date.now() - start;
            console.log(`[PASS] ${url} - Status: ${response.status} (${duration}ms)`);
        } catch (error) {
            console.error(`[FAIL] ${url} - Error: ${error.message}`);
        }
    }
}

checkHealth();
