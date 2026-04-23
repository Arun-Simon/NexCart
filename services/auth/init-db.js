const { Client } = require('pg');
const fs = require('fs');

async function initDB() {
  // Connect to default postgres db first to create nexcart
  const client0 = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client0.connect();
    const res = await client0.query("SELECT datname FROM pg_database WHERE datname = 'nexcart'");
    if (res.rows.length === 0) {
      console.log('Creating database "nexcart"...');
      await client0.query('CREATE DATABASE nexcart;');
      console.log('Database created.');
    } else {
      console.log('Database "nexcart" already exists.');
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
  } finally {
    await client0.end();
  }

  // Now connect to nexcart and run init.sql
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'nexcart',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    const sql = fs.readFileSync('m:/dev-application/nexcart/db/init.sql', 'utf8');
    await client.query(sql);
    console.log('Successfully executed init.sql');
  } catch (err) {
    console.error('Error executing init.sql:', err.message);
  } finally {
    await client.end();
  }
}

initDB();
