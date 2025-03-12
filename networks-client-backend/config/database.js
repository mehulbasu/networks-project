const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'postgres',
    database: process.env.POSTGRES_DB || 'imagedb',
    password: process.env.POSTGRES_PASSWORD || 'compsci640',
    port: 5432,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};