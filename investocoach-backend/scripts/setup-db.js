'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const applySchema = async () => {
  const password = process.argv[2];
  if (!password) {
    console.error('❌ Error: Please provide the database password as an argument.');
    console.log('Usage: node scripts/setup-db.js YOUR_PASSWORD');
    process.exit(1);
  }

  const projectRef = process.env.SUPABASE_URL.split('//')[1].split('.')[0];
  const host = `db.${projectRef}.supabase.co`;
  
  const client = new Client({
    host: host,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`⏳ Connecting to Supabase database: ${host}...`);
    await client.connect();
    console.log('✅ Connected to database.');

    const schemaPath = path.join(__dirname, '../database/schema.sql');
    console.log(`📖 Reading schema from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🚀 Applying schema (this may take a few seconds)...');
    // Split by semicolons isn't always reliable for complex SQL with triggers/functions
    // but pg client supports multiple statements in one query.
    await client.query(schemaSql);
    
    console.log('🎉 Database schema applied successfully!');
  } catch (err) {
    console.error('❌ Failed to apply schema:', err.message);
    if (err.message.includes('authentication failed')) {
      console.log('💡 Tip: Double check your database password in the Supabase dashboard (Project Settings -> Database).');
    }
  } finally {
    await client.end();
  }
};

applySchema();
