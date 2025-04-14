const db = require('../config/database');

const dbUtils = {
    async createUserTable(username) {
        const query = `
            CREATE TABLE IF NOT EXISTS user_${username} (
                ImageId SERIAL PRIMARY KEY,
                FileName TEXT,
                DateUploaded DATE,
                DateTaken DATE,
                Location TEXT
            );
        `;
        return db.query(query);
    },

    async addUser(username, filepath) {
        const query = `
            INSERT INTO USERS (Username, Filepath)
            VALUES ($1, $2)
            ON CONFLICT (Username) DO NOTHING
            RETURNING *;
        `;
        return db.query(query, [username, filepath]);
    },

    async addImage(username, fileName, dateTaken, location) {
        const query = `
            INSERT INTO ${username} (FileName, DateUploaded, DateTaken, Location)
            VALUES ($1, CURRENT_DATE, $2, $3)
            RETURNING *;
        `;
        return db.query(query, [fileName, dateTaken, location]);
    },

    async getUserImages(username) {
        const query = `SELECT * FROM ${username} ORDER BY DateUploaded DESC;`;
        return db.query(query);
    }
};

module.exports = dbUtils;