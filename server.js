const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), aiConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

// Optional backend proxy for Gemini API if server-side key is preferred
app.post('/api/gemini/forecast', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || req.headers['x-gemini-key'];
  if (!apiKey) {
    return res.status(400).json({ error: 'GEMINI_API_KEY is not configured on server or in request header.' });
  }

  try {
    const { prompt, systemInstruction } = req.body;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
    };
    if (systemInstruction) {
      payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`⚡ Smart Canteen Server running on http://localhost:${PORT}`);
});
