const express = require('express');
const dotenv = require('dotenv');
const twilio = require('twilio');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const client = new twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Enable CORS for all routes
app.use(cors());

// Endpoint to get SMS messages
app.get('/api/sms', async (req, res) => {
    try {
        const messages = await client.messages.list({ limit: 20 });
        res.json(messages);
    } catch (error) {
        console.error('Error retrieving SMS messages:', error);
        res.status(500).send('Error retrieving SMS messages');
    }
});


// Endpoint to delete an SMS by SID
app.delete('/api/sms/:sid', async (req, res) => {
    const { sid } = req.params;
    try {
        await client.messages(sid).remove();
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error(`Error deleting SMS with SID ${sid}:`, error);
        res.status(500).json({ error: 'Error deleting SMS' });
    }
});

app.use(express.static(path.join(__dirname, '../frontend/dist/frontend')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/frontend/index.html'));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
