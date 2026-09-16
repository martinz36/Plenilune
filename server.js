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

// Admin panel route
app.get(['/admin', '/admin/cierre-diario', '/admin/cierre', '/admin/tandas', '/admin/tanda'], (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// API: Get Daily Closures History
app.get('/api/daily-closures', (req, res) => {
    fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });
        try {
            const config = JSON.parse(data);
            res.json(config.dailyClosures || []);
        } catch (e) {
            res.status(500).json({ error: 'Invalid data format' });
        }
    });
});

// API: Save Daily Closure Record
app.post('/api/daily-closures', (req, res) => {
    const record = req.body;
    if (!record || !record.product) {
        return res.status(400).json({ error: 'Invalid record data' });
    }

    fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });
        try {
            const config = JSON.parse(data);
            if (!config.dailyClosures) config.dailyClosures = [];
            
            config.dailyClosures.unshift({
                id: Date.now().toString(),
                created_at: new Date().toISOString(),
                ...record
            });

            fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8', (writeErr) => {
                if (writeErr) return res.status(500).json({ error: 'Failed to save record' });
                res.json({ success: true, closures: config.dailyClosures });
            });
        } catch (e) {
            res.status(500).json({ error: 'Invalid data format' });
        }
    });
});

// API: Get Tandas History
app.get('/api/tandas', (req, res) => {
    fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });
        try {
            const config = JSON.parse(data);
            res.json(config.tandas || []);
        } catch (e) {
            res.status(500).json({ error: 'Invalid data format' });
        }
    });
});

// API: Save Tanda Record
app.post('/api/tandas', (req, res) => {
    const record = req.body;
    if (!record || !record.name) {
        return res.status(400).json({ error: 'Invalid tanda record data' });
    }

    fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });
        try {
            const config = JSON.parse(data);
            if (!config.tandas) config.tandas = [];
            
            config.tandas.unshift({
                id: `tanda-${Date.now()}`,
                created_at: new Date().toISOString(),
                ...record
            });

            fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8', (writeErr) => {
                if (writeErr) return res.status(500).json({ error: 'Failed to save record' });
                res.json({ success: true, tandas: config.tandas });
            });
        } catch (e) {
            res.status(500).json({ error: 'Invalid data format' });
        }
    });
});

// API: Get Tanda Products Catalog
app.get('/api/tanda-products', (req, res) => {
    fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });
        try {
            const config = JSON.parse(data);
            const defaultProds = [
                'Galleta de orea and creme',
                'Galleta de chin chin',
                'Brownies de chocolate',
                'Muffins de arandano'
            ];
            res.json(config.tandaProducts || defaultProds);
        } catch (e) {
            res.status(500).json({ error: 'Invalid data format' });
        }
    });
});

// API: Add Tanda Product
app.post('/api/tanda-products', (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Invalid product name' });
    }

    fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });
        try {
            const config = JSON.parse(data);
            if (!config.tandaProducts) {
                config.tandaProducts = [
                    'Galleta de orea and creme',
                    'Galleta de chin chin',
                    'Brownies de chocolate',
                    'Muffins de arandano'
                ];
            }
            const trimmedName = name.trim();
            if (!config.tandaProducts.includes(trimmedName)) {
                config.tandaProducts.push(trimmedName);
            }

            fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8', (writeErr) => {
                if (writeErr) return res.status(500).json({ error: 'Failed to save product' });
                res.json({ success: true, products: config.tandaProducts });
            });
        } catch (e) {
            res.status(500).json({ error: 'Invalid data format' });
        }
    });
});

// API: Delete Tanda Product
app.post('/api/tanda-products/delete', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Invalid product name' });
    }

    fs.readFile(CONFIG_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });
        try {
            const config = JSON.parse(data);
            if (config.tandaProducts) {
                config.tandaProducts = config.tandaProducts.filter(p => p.trim() !== name.trim());
            }

            fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8', (writeErr) => {
                if (writeErr) return res.status(500).json({ error: 'Failed to delete product' });
                res.json({ success: true, products: config.tandaProducts || [] });
            });
        } catch (e) {
            res.status(500).json({ error: 'Invalid data format' });
        }
    });
});

// Serve static assets and main files
app.use(express.static(__dirname));

// Start server
app.listen(PORT, () => {
    console.log(`Plenilune server running at http://localhost:${PORT}`);
});
