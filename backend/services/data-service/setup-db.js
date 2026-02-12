import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

const tables = [
    {
        TableName: "CognitiveSessions",
        KeySchema: [{ AttributeName: "sessionId", KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: "sessionId", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
        TableName: "UserProgress",
        KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "bookId", KeyType: "RANGE" }
        ],
        AttributeDefinitions: [
            { AttributeName: "userId", AttributeType: "S" },
            { AttributeName: "bookId", AttributeType: "S" }
        ],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    }
];

async function createTables() {
    console.log("Creating DynamoDB Tables...");
    for (const table of tables) {
        try {
            await client.send(new CreateTableCommand(table));
            console.log(`✅ Table '${table.TableName}' creating...`);
        } catch (error) {
            if (error.name === 'ResourceInUseException') {
                console.log(`⚠️ Table '${table.TableName}' already exists.`);
            } else {
                console.error(`❌ Error creating '${table.TableName}':`, error.message);
            }
        }
    }
    console.log("Done.");
}

createTables();
