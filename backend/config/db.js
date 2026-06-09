const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || '';
let client = null;
let db = null;

async function getDb() {
  if (db) return db;
  if (!uri) return null;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db('managementsystems');
  return db;
}

module.exports = { getDb };
