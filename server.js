const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const https = require('https');

const app = express();
const PORT = process.env.PORT || 8080;
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Multer Memory Storage Configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(express.json());

// API: Get Configuration
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

// API: Save Configuration
app.post('/api/config', (req, res) => {
    const newConfig = req.body;
    
    if (!newConfig || typeof newConfig !== 'object') {
        return res.status(400).json({ error: 'Invalid configuration object' });
    }

    fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error writing config file:', err);
            return res.status(500).json({ error: 'Failed to save configuration' });
        }
        console.log('Configuration successfully updated.');
        res.json({ success: true, message: 'Configuration saved successfully' });
    });
});

// API: Upload image to Cloudinary using configured credentials
app.post('/api/upload', upload.single('image'), (req, res) => {
    fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read settings file' });
        }
        
        let config;
        try {
            config = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ error: 'Settings file has invalid JSON' });
        }

        const creds = config.cloudinary;
        if (!creds || !creds.cloudName || !creds.apiKey || !creds.apiSecret) {
            return res.status(400).json({ 
                error: 'Faltan configurar las credenciales de Cloudinary en los ajustes generales del panel.' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo de imagen' });
        }

        // Configure Cloudinary client
        cloudinary.config({
            cloud_name: creds.cloudName,
            api_key: creds.apiKey,
            api_secret: creds.apiSecret
        });

        // Pipe memory buffer to Cloudinary API
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'plenilune' },
            (uploadErr, result) => {
                if (uploadErr) {
                    console.error('Cloudinary Upload Error:', uploadErr);
                    return res.status(500).json({ error: 'Error al subir a Cloudinary: ' + uploadErr.message });
                }
                res.json({ url: result.secure_url });
            }
        );

        uploadStream.end(req.file.buffer);
    });
});

// Proxy HTTP requests to Nominatim
const fetchHttpsJson = (url, callback) => {
    const options = {
        headers: {
            'User-Agent': 'PlenilunePasteleriaWebsite/1.0'
        }
    };
    https.get(url, options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            try {
                callback(null, JSON.parse(body));
            } catch (err) {
                callback(err);
            }
        });
    }).on('error', (err) => {
        callback(err);
    });
};

// API Proxy: Geocoding Search (Bias: Lima, Peru)
app.get('/api/geocode', (req, res) => {
    const q = req.query.q;
    if (!q) {
        return res.status(400).json({ error: 'Missing query parameter q' });
    }
    const encodedQ = encodeURIComponent(q + ', Lima, Peru');
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQ}&limit=5&countrycodes=pe&addressdetails=1`;
    
    fetchHttpsJson(url, (err, data) => {
        if (err) {
            console.error('Geocoding search proxy error:', err);
            return res.status(500).json({ error: 'Failed to search address' });
        }
        res.json(data);
    });
});

// API Proxy: Reverse Geocoding Coordinates to Address
app.get('/api/reverse', (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
        return res.status(400).json({ error: 'Missing lat or lng parameters' });
    }
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    
    fetchHttpsJson(url, (err, data) => {
        if (err) {
            console.error('Reverse geocoding proxy error:', err);
            return res.status(500).json({ error: 'Failed to reverse address' });
        }
        res.json(data);
    });
});

// Admin panel route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve static assets and main files
app.use(express.static(__dirname));

// Start server
app.listen(PORT, () => {
    console.log(`Plenilune server running at http://localhost:${PORT}`);
});
