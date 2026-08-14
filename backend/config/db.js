const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                          // maximum number of clients in the pool
  connectionTimeoutMillis: 10000,   // wait up to 10s for a connection before failing
  idleTimeoutMillis: 30000,         // close idle clients after 30 seconds
  ssl: {
    rejectUnauthorized: false       // required for Supabase / many managed Postgres
  }
});

// Log errors but do NOT crash the process
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err.message);
});

module.exports = pool;
