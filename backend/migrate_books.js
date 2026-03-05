import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_SERVICE_URL = process.env.DATA_SERVICE_URL || 'http://localhost:3005';
const JSON_DATA_PATH = path.join(__dirname, '../frontend/src/data/audiobooks.json');

async function migrate() {
    try {
        console.log('--- Starting Book Migration ---');
        const rawData = fs.readFileSync(JSON_DATA_PATH, 'utf8');
        const { books } = JSON.parse(rawData);

        console.log(`Found ${books.length} books in JSON. Migrating to DynamoDB...`);

        for (const book of books) {
            console.log(`Migrating: ${book.title} (ID: ${book.id})...`);
            await axios.post(`${DATA_SERVICE_URL}/books`, book);
        }

        console.log('--- Migration Complete! ---');
    } catch (err) {
        console.error('Migration failed:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
    }
}

migrate();
