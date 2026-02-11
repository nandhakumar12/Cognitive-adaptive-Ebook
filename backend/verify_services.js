import axios from 'axios';

const endpoints = [
    'http://localhost:3000/health',
    'http://localhost:3001/health',
    'http://localhost:3002/health', // Event Service direct
    'http://localhost:3003/health', // Cognitive Service direct
    'http://localhost:3004/health', // Adaptation Service direct
    'http://localhost:3000/api/events/health', // Via Gateway
    'http://localhost:3000/api/cognitive/health', // Via Gateway
    'http://localhost:3000/api/adaptations/health' // Via Gateway
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
