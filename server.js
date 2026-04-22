const express = require('express');
const { getChatbotResponse } = require('./ai_logic');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/chat', async (req, res) => {
    const { message, major, task } = req.body;
    try {
        const result = await getChatbotResponse(message, major, task);
        res.json(result); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "The AI is overthinking. Try again." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));