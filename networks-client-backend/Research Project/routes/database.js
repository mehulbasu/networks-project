const express = require('express');
const router = express.Router();
const dbUtils = require('../utils/db');

// Create new user
router.post('/users', async (req, res) => {
    try {
        const { username, filepath } = req.body;
        await dbUtils.createUserTable(username);
        const result = await dbUtils.addUser(username, filepath);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add image to user's table
router.post('/images/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { fileName, dateTaken, location } = req.body;
        const result = await dbUtils.addImage(username, fileName, dateTaken, location);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user's images
router.get('/images/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const result = await dbUtils.getUserImages(username);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;