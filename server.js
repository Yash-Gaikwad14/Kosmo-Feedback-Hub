const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;
const BASE_DIR = __dirname;
const RAW_DIR = path.join(BASE_DIR, 'RAW_IMAGES');

// Ensure required directories exist
['RAW_IMAGES', 'APP', 'UI', 'BOTH', 'PROBLEMS', 'public'].forEach(dir => {
    const dirPath = path.join(BASE_DIR, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(BASE_DIR, 'public')));

// Serve image folders static paths
app.use('/images/RAW', express.static(RAW_DIR));
app.use('/images/APP', express.static(path.join(BASE_DIR, 'APP')));
app.use('/images/UI', express.static(path.join(BASE_DIR, 'UI')));
app.use('/images/BOTH', express.static(path.join(BASE_DIR, 'BOTH')));
app.use('/images/PROBLEMS', express.static(path.join(BASE_DIR, 'PROBLEMS')));
app.use('/images/ROOT', express.static(BASE_DIR));

// Storage Engine for Multer Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Save to RAW_IMAGES and root for maximum script compatibility
        cb(null, RAW_DIR);
    },
    filename: (req, file, cb) => {
        const uniquePrefix = `WhatsApp Image ${new Date().toISOString().slice(0, 10)} at ${Date.now()}`;
        const ext = path.extname(file.originalname) || '.jpeg';
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
        cb(null, `${cleanName}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname || mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG, PNG, and WEBP image files are allowed!'));
    }
});

// Helper: Get files in directory
function getImagesInDir(dirPath) {
    if (!fs.existsSync(dirPath)) return [];
    return fs.readdirSync(dirPath)
        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .map(f => {
            const full = path.join(dirPath, f);
            const stat = fs.statSync(full);
            return {
                name: f,
                size: stat.size,
                mtime: stat.mtime
            };
        })
        .sort((a, b) => b.mtime - a.mtime);
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// 1. Get Stats Overview
app.get('/api/stats', (req, res) => {
    try {
        const rawFiles = getImagesInDir(RAW_DIR);
        const appFiles = getImagesInDir(path.join(BASE_DIR, 'APP'));
        const uiFiles = getImagesInDir(path.join(BASE_DIR, 'UI'));
        const bothFiles = getImagesInDir(path.join(BASE_DIR, 'BOTH'));
        const problemFiles = getImagesInDir(path.join(BASE_DIR, 'PROBLEMS'));

        // Check script tracking
        const scriptPath = path.join(BASE_DIR, 'organize_feedback.ps1');
        let scriptContent = '';
        if (fs.existsSync(scriptPath)) {
            scriptContent = fs.readFileSync(scriptPath, 'utf-8');
        }

        const rootFiles = getImagesInDir(BASE_DIR);
        const untracked = rootFiles.filter(f => !scriptContent.includes(f.name));

        res.json({
            success: true,
            rawCount: rawFiles.length,
            appCount: appFiles.length,
            uiCount: uiFiles.length,
            bothCount: bothFiles.length,
            problemCount: problemFiles.length,
            untrackedCount: untracked.length
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Get Image List by Category
app.get('/api/images', (req, res) => {
    try {
        const category = (req.query.category || 'ALL').toUpperCase();
        let results = [];

        const categoriesToFetch = category === 'ALL' 
            ? ['RAW', 'APP', 'UI', 'BOTH', 'PROBLEMS']
            : [category];

        categoriesToFetch.forEach(cat => {
            let targetDir = BASE_DIR;
            if (cat === 'RAW') targetDir = RAW_DIR;
            else if (['APP', 'UI', 'BOTH', 'PROBLEMS'].includes(cat)) targetDir = path.join(BASE_DIR, cat);

            const files = getImagesInDir(targetDir);
            files.forEach(f => {
                results.push({
                    name: f.name,
                    category: cat,
                    url: `/images/${cat}/${encodeURIComponent(f.name)}`,
                    size: f.size,
                    mtime: f.mtime
                });
            });
        });

        res.json({ success: true, count: results.length, images: results });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Upload Raw Images Endpoint
app.post('/api/upload', upload.array('photos', 20), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, error: 'No files uploaded.' });
        }

        // Also copy uploaded files into root for powershell script compatibility
        const uploadedFiles = req.files.map(file => {
            const destRoot = path.join(BASE_DIR, file.filename);
            try {
                fs.copyFileSync(file.path, destRoot);
            } catch (e) {
                console.error("Failed to copy to root:", e);
            }
            return {
                originalname: file.originalname,
                filename: file.filename,
                size: file.size,
                url: `/images/RAW/${encodeURIComponent(file.filename)}`
            };
        });

        res.json({
            success: true,
            message: `Successfully uploaded ${uploadedFiles.length} raw image(s).`,
            files: uploadedFiles
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Trigger Auto-Organizer PowerShell Script
app.post('/api/run-organizer', (req, res) => {
    const scriptPath = path.join(BASE_DIR, 'organize_feedback.ps1');
    if (!fs.existsSync(scriptPath)) {
        return res.status(404).json({ success: false, error: 'organize_feedback.ps1 script not found!' });
    }

    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
    exec(cmd, { cwd: BASE_DIR }, (error, stdout, stderr) => {
        if (error) {
            console.error('Execution error:', error);
            return res.status(500).json({
                success: false,
                error: error.message,
                stderr: stderr,
                stdout: stdout
            });
        }
        res.json({
            success: true,
            message: 'Auto-Organizer script executed successfully!',
            output: stdout
        });
    });
});

// 5. Get Documented Problems Catalog
app.get('/api/problems', (req, res) => {
    try {
        const problemsScript = path.join(BASE_DIR, 'organize_problems.ps1');
        let problemList = [];

        if (fs.existsSync(problemsScript)) {
            const content = fs.readFileSync(problemsScript, 'utf-8');
            const lines = content.split('\n');
            let currentComment = '';

            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('#')) {
                    const match = trimmed.match(/^#\s*(\d+)\.\s*(.*)/);
                    if (match) {
                        currentComment = match[2];
                    }
                } else if (trimmed.startsWith('"') && trimmed.includes('.')) {
                    const fileNameMatch = trimmed.match(/"([^"]+)"/);
                    if (fileNameMatch && currentComment) {
                        const imgName = fileNameMatch[1];
                        problemList.push({
                            id: `PROBLEM-${problemList.length + 1}`,
                            description: currentComment,
                            filename: imgName,
                            imageUrl: `/images/PROBLEMS/PROBLEM-${problemList.length + 1}.jpeg`
                        });
                        currentComment = '';
                    }
                }
            });
        }

        res.json({ success: true, count: problemList.length, problems: problemList });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper to get local IP address for LAN sharing
const os = require('os');
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

// Start Server listening on 0.0.0.0 for Team Network Access
app.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIp();
    console.log(`====================================================`);
    console.log(`🚀 Kosmo Feedback Hub Web App is running!`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`📡 Team Network URL: http://${localIp}:${PORT}`);
    console.log(`📁 Raw Images Folder: ${RAW_DIR}`);
    console.log(`====================================================`);
});
