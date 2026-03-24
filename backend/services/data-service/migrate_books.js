import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_SERVICE_URL = process.env.DATA_SERVICE_URL || 'http://localhost:3005';
const JSON_DATA_PATH = path.join(__dirname, 'audiobooks.json');

async function migrate() {
    try {
        console.log('--- Starting Book Migration ---');
        const rawData = fs.readFileSync(JSON_DATA_PATH, 'utf8');
        const { books } = JSON.parse(rawData);

        console.log(`Found ${books.length} books in JSON. Migrating to DynamoDB...`);

        for (const book of books) {
            console.log(`Migrating: ${book.title} (ID: ${book.id})...`);

            const response = await fetch(`${DATA_SERVICE_URL}/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(book)
            });

            if (response.ok) {
                console.log(`Successfully migrated: ${book.title}`);
            } else {
                const text = await response.text();
                console.error(`Failed to migrate ${book.title}. Status: ${response.status} ${response.statusText}`);
                console.error(`Response content (check for HTML/Errors): ${text.substring(0, 200)}...`);
            }
        }

        console.log('--- Migration Complete! ---');
    } catch (err) {
        console.error('Migration failed:', err.message);
    }
}

await migrate();
