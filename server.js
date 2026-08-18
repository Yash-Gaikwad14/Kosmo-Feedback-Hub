const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const BASE_DIR = __dirname;
const RAW_DIR = path.join(BASE_DIR, 'RAW_IMAGES');

// Ensure required directories exist
['RAW_IMAGES', 'APP', 'UI', 'BOTH', 'PROBLEMS', 'public'].forEach(dir => {
    const dirPath = path.join(BASE_DIR, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

const TEAM_PASSCODE = process.env.TEAM_PASSCODE || 'kosmo2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(BASE_DIR, 'public')));

// Root & Health Check Routes
app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/', (req, res) => {
    res.sendFile(path.join(BASE_DIR, 'public', 'index.html'));
});

// Authentication Middleware
function authenticateTeam(req, res, next) {
    const providedPasscode = req.headers['x-team-passcode'] || req.query.passcode;
    if (!providedPasscode || providedPasscode !== TEAM_PASSCODE) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or missing Team Passcode.' });
    }
    next();
}

// Public Login Endpoint
app.post('/api/login', (req, res) => {
    const { passcode } = req.body;
    if (passcode === TEAM_PASSCODE) {
        res.json({ success: true, message: 'Authenticated successfully.' });
    } else {
        res.status(401).json({ success: false, error: 'Incorrect Team Passcode. Please try again.' });
    }
});

// Serve protected image static paths with auth check
app.use('/images/RAW', authenticateTeam, express.static(RAW_DIR));
app.use('/images/APP', authenticateTeam, express.static(path.join(BASE_DIR, 'APP')));
app.use('/images/UI', authenticateTeam, express.static(path.join(BASE_DIR, 'UI')));
app.use('/images/BOTH', authenticateTeam, express.static(path.join(BASE_DIR, 'BOTH')));
app.use('/images/PROBLEMS', authenticateTeam, express.static(path.join(BASE_DIR, 'PROBLEMS')));
app.use('/images/ROOT', authenticateTeam, express.static(BASE_DIR));

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

// Database Helpers for Metadata Persistence & User Profiles
const DB_PATH = path.join(BASE_DIR, 'config', 'db.json');

function loadDb() {
    try {
        if (!fs.existsSync(path.dirname(DB_PATH))) {
            fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
        }
        if (fs.existsSync(DB_PATH)) {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        }
    } catch (e) {
        console.error("Error loading db.json:", e);
    }
    return { users: ["Yash", "Priyal", "Dipak", "Ankit", "Kunal"], problemClusters: [], imageMetadata: {} };
}

function saveDb(dbData) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf-8');
    } catch (e) {
        console.error("Error saving db.json:", e);
    }
}

function getMetadataForFile(filename) {
    const db = loadDb();
    if (db.imageMetadata && db.imageMetadata[filename]) {
        return db.imageMetadata[filename];
    }
    // Default fallback metadata for historical files
    return {
        uploadedBy: "Yash",
        channel: "WhatsApp",
        userHandle: "Community Feedback",
        severity: "MEDIUM",
        topic: "General Feedback",
        notes: "Historical feedback screenshot",
        uploadedAt: new Date().toISOString()
    };
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// 1. Get Stats Overview
app.get('/api/stats', authenticateTeam, (req, res) => {
    try {
        const rawFiles = getImagesInDir(RAW_DIR);
        const appFiles = getImagesInDir(path.join(BASE_DIR, 'APP'));
        const uiFiles = getImagesInDir(path.join(BASE_DIR, 'UI'));
        const bothFiles = getImagesInDir(path.join(BASE_DIR, 'BOTH'));
        const problemFiles = getImagesInDir(path.join(BASE_DIR, 'PROBLEMS'));

        const scriptPath = path.join(BASE_DIR, 'organize_feedback.ps1');
        let scriptContent = '';
        if (fs.existsSync(scriptPath)) {
            scriptContent = fs.readFileSync(scriptPath, 'utf-8');
        }

        const rootFiles = getImagesInDir(BASE_DIR);
        const untracked = rootFiles.filter(f => !scriptContent.includes(f.name));

        const db = loadDb();

        res.json({
            success: true,
            rawCount: rawFiles.length,
            appCount: appFiles.length,
            uiCount: uiFiles.length,
            bothCount: bothFiles.length,
            problemCount: problemFiles.length,
            untrackedCount: untracked.length,
            users: db.users || ["Yash", "Priyal", "Dipak", "Ankit", "Kunal"]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Get Image List by Category with Smart Content-Based Sorting & User Filtering
app.get('/api/images', authenticateTeam, (req, res) => {
    try {
        const category = (req.query.category || 'ALL').toUpperCase();
        const sortBy = req.query.sort || 'severity'; // severity | topic | user | date
        const userFilter = req.query.user || 'ALL';
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
                const meta = getMetadataForFile(f.name);
                
                // User Profile Filter check
                if (userFilter !== 'ALL' && meta.uploadedBy.toLowerCase() !== userFilter.toLowerCase()) {
                    return;
                }

                results.push({
                    name: f.name,
                    category: cat,
                    url: `/images/${cat}/${encodeURIComponent(f.name)}`,
                    size: f.size,
                    mtime: f.mtime,
                    uploadedBy: meta.uploadedBy || 'Anonymous',
                    channel: meta.channel || 'WhatsApp',
                    severity: meta.severity || 'MEDIUM',
                    topic: meta.topic || 'General Feedback',
                    notes: meta.notes || '',
                    userHandle: meta.userHandle || 'Community User'
                });
            });
        });

        // Content-Based Smart Sorting Algorithm (Not just file name matching)
        const severityRank = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        
        results.sort((a, b) => {
            if (sortBy === 'severity') {
                const rankA = severityRank[a.severity] || 0;
                const rankB = severityRank[b.severity] || 0;
                if (rankB !== rankA) return rankB - rankA;
            } else if (sortBy === 'topic') {
                return a.topic.localeCompare(b.topic);
            } else if (sortBy === 'user') {
                return a.uploadedBy.localeCompare(b.uploadedBy);
            }
            // Default / Date Recency sort
            return new Date(b.mtime) - new Date(a.mtime);
        });

        res.json({ success: true, count: results.length, images: results });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Upload Raw Images Endpoint with User Profile Attribution
app.post('/api/upload', authenticateTeam, upload.array('photos', 20), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, error: 'No files uploaded.' });
        }

        const uploadedBy = req.body.uploader || 'Yash';
        const channel = req.body.channel || 'WhatsApp';
        const notes = req.body.notes || '';
        const severity = req.body.severity || 'MEDIUM';

        const db = loadDb();

        const uploadedFiles = req.files.map(file => {
            const destRoot = path.join(BASE_DIR, file.filename);
            try {
                fs.copyFileSync(file.path, destRoot);
            } catch (e) {
                console.error("Failed to copy to root:", e);
            }

            // Save User Attribution & Metadata into Database
            db.imageMetadata[file.filename] = {
                uploadedBy,
                channel,
                userHandle: uploadedBy,
                severity,
                topic: severity === 'CRITICAL' ? 'Bug Report' : 'User Upload',
                notes,
                uploadedAt: new Date().toISOString()
            };

            return {
                originalname: file.originalname,
                filename: file.filename,
                size: file.size,
                uploadedBy,
                url: `/images/RAW/${encodeURIComponent(file.filename)}`
            };
        });

        saveDb(db);

        res.json({
            success: true,
            message: `Successfully uploaded ${uploadedFiles.length} raw image(s) by @${uploadedBy}.`,
            files: uploadedFiles
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Add New Team Member Profile Endpoint
app.post('/api/add-user', authenticateTeam, (req, res) => {
    try {
        const { username } = req.body;
        if (!username || !username.trim()) {
            return res.status(400).json({ success: false, error: 'Username required.' });
        }
        const db = loadDb();
        const cleanName = username.trim();
        if (!db.users.includes(cleanName)) {
            db.users.push(cleanName);
            saveDb(db);
        }
        res.json({ success: true, users: db.users, added: cleanName });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Common Problem Finder API Endpoint
app.get('/api/common-problems', authenticateTeam, (req, res) => {
    try {
        const db = loadDb();
        res.json({
            success: true,
            count: db.problemClusters.length,
            clusters: db.problemClusters
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper: Parse script array from organize_feedback.ps1
function parsePs1Array(content, varName) {
    const regex = new RegExp(`\\$${varName}\\s*=\\s*@\\(([\\s\\S]*?)\\)`, 'i');
    const match = content.match(regex);
    if (!match) return [];
    
    const lines = match[1].split('\n');
    const items = [];
    lines.forEach(l => {
        const trimmed = l.trim();
        if (trimmed.startsWith('"') && trimmed.includes('.')) {
            const m = trimmed.match(/"([^"]+)"/);
            if (m) items.push(m[1]);
        }
    });
    return items;
}

// Native Node.js Organizer (Runs on Linux / Render when PowerShell is absent)
function runNativeNodeOrganizer() {
    const scriptPath = path.join(BASE_DIR, 'organize_feedback.ps1');
    const content = fs.readFileSync(scriptPath, 'utf-8');

    const appImages = parsePs1Array(content, 'appImages');
    const uiImages = parsePs1Array(content, 'uiImages');
    const bothImages = parsePs1Array(content, 'bothImages');
    const problemImages = parsePs1Array(content, 'problemImages');

    // Helper: Clear folder
    function clearFolder(folderName) {
        const folderPath = path.join(BASE_DIR, folderName);
        if (fs.existsSync(folderPath)) {
            fs.readdirSync(folderPath).forEach(f => {
                const fp = path.join(folderPath, f);
                if (fs.statSync(fp).isFile()) fs.unlinkSync(fp);
            });
        } else {
            fs.mkdirSync(folderPath, { recursive: true });
        }
    }

    // Helper: Copy & rename
    function copyRenamed(items, folderName, prefix) {
        let counter = 1;
        const logs = [];
        items.forEach(img => {
            let src = path.join(RAW_DIR, img);
            if (!fs.existsSync(src)) src = path.join(BASE_DIR, img);

            if (fs.existsSync(src)) {
                const ext = path.extname(img) || '.jpeg';
                const dest = path.join(BASE_DIR, folderName, `${prefix}-${counter}${ext}`);
                fs.copyFileSync(src, dest);
                logs.push(`  ${prefix}-${counter} <- ${img}`);
                counter++;
            } else {
                logs.push(`  MISSING: ${img}`);
            }
        });
        return { count: counter - 1, logs };
    }

    ['APP', 'UI', 'BOTH', 'PROBLEMS'].forEach(clearFolder);

    const appRes = copyRenamed(appImages, 'APP', 'APP');
    const uiRes = copyRenamed(uiImages, 'UI', 'UI');
    const bothRes = copyRenamed(bothImages, 'BOTH', 'BOTH');
    const probRes = copyRenamed(problemImages, 'PROBLEMS', 'PROBLEM');

    return `===== NATIVE AUTO-ORGANIZER OUTPUT =====\nCleared all folders.\n\n===== APP FOLDER =====\n${appRes.logs.join('\n')}\n\n===== UI FOLDER =====\n${uiRes.logs.join('\n')}\n\n===== BOTH FOLDER =====\n${bothRes.logs.join('\n')}\n\n===== PROBLEMS FOLDER =====\n${probRes.logs.join('\n')}\n\n========== SUMMARY ==========\nAPP folder: ${appRes.count} images\nUI folder: ${uiRes.count} images\nBOTH folder: ${bothRes.count} images\nPROBLEMS folder: ${probRes.count} images\n`;
}

// 4. Trigger Auto-Organizer PowerShell / Native Script
app.post('/api/run-organizer', authenticateTeam, (req, res) => {
    const scriptPath = path.join(BASE_DIR, 'organize_feedback.ps1');
    if (!fs.existsSync(scriptPath)) {
        return res.status(404).json({ success: false, error: 'organize_feedback.ps1 script not found!' });
    }

    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
    exec(cmd, { cwd: BASE_DIR }, (error, stdout, stderr) => {
        if (error) {
            console.log('PowerShell unavailable, falling back to Native Node.js Organizer...');
            try {
                const output = runNativeNodeOrganizer();
                return res.json({
                    success: true,
                    message: 'Auto-Organizer native engine executed successfully!',
                    output: output
                });
            } catch (fallbackErr) {
                return res.status(500).json({
                    success: false,
                    error: fallbackErr.message
                });
            }
        }
        res.json({
            success: true,
            message: 'Auto-Organizer script executed successfully!',
            output: stdout
        });
    });
});

// 5. Get Documented Problems Catalog
app.get('/api/problems', authenticateTeam, (req, res) => {
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

// Catch-all route handler for frontend single-page application
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/images')) {
        res.sendFile(path.join(BASE_DIR, 'public', 'index.html'));
    } else {
        res.status(404).json({ success: false, error: 'Endpoint not found.' });
    }
});
app.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIp();
    console.log(`====================================================`);
    console.log(`🚀 Kosmo Feedback Hub Web App is running!`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`📡 Team Network URL: http://${localIp}:${PORT}`);
    console.log(`📁 Raw Images Folder: ${RAW_DIR}`);
    console.log(`====================================================`);
});
