const express = require('express');
const { getChatbotResponse } = require('../ai_logic'); // Points to ai_logic in the root
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

/** * This ensures the server can find your CSS/JS files 
 * and index.html from inside the /api folder 
 */
const rootDir = path.join(__dirname, '../');
app.use(express.static(rootDir));

// Landing page route
app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});

// AI Chat route
app.post('/chat', async (req, res) => {
    const { message, major, task } = req.body;
    try {
        const result = await getChatbotResponse(message, major, task);
        res.json(result); 
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "The AI is overthinking. Try again." });
    }
});

/**
 * Vercel is a serverless environment, so it doesn't 
 * need app.listen in production.
 */
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

// THE MOST IMPORTANT LINE FOR VERCEL
module.exports = app;