const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Middleware
app.use(express.json());

// API endpoints
app.get('/api/config', (req, res) => {
    fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading config file:', err);
            return res.status(500).json({ error: 'Failed to read configuration' });
        }
        try {
            const config = JSON.parse(data);
            res.json(config);
        } catch (parseErr) {
            console.error('Error parsing config JSON:', parseErr);
            res.status(500).json({ error: 'Configuration file has invalid JSON' });
        }
    });
});

app.post('/api/config', (req, res) => {
    const newConfig = req.body;
    
    // Quick validation
    if (!newConfig || typeof newConfig !== 'object') {
        return res.status(400).json({ error: 'Invalid configuration object' });
    }

    fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error writing config file:', err);
            return res.status(500).json({ error: 'Failed to save configuration' });
        }
        console.log('Configuration successfully updated and saved.');
        res.json({ success: true, message: 'Configuration saved successfully' });
    });
});

// Admin panel route (must render admin.html)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve static assets and main files
app.use(express.static(__dirname));

// Start server
app.listen(PORT, () => {
    console.log(`Plenilune server running at http://localhost:${PORT}`);
});
