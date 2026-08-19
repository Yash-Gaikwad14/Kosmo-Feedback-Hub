require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const storage = require('./lib/storage');
const db = require('./lib/db');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const BASE_DIR = __dirname;

const TEAM_PASSCODE = process.env.TEAM_PASSCODE;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(BASE_DIR, 'public')));

// Root & Health Check Routes
app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/', (req, res) => {
    res.sendFile(path.join(BASE_DIR, 'public', 'index.html'));
});

// Authentication Middleware (Header & Query fallback for <img> tags)
function authenticateTeam(req, res, next) {
    const providedPasscode = req.headers['x-team-passcode'] || req.query.passcode;
    if (!TEAM_PASSCODE) {
        return res.status(500).json({ success: false, error: 'Server configuration error: TEAM_PASSCODE environment variable not set.' });
    }
    if (!providedPasscode || providedPasscode !== TEAM_PASSCODE) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or missing Team Passcode.' });
    }
    next();
}

// Public Login Endpoint
app.post('/api/login', (req, res) => {
    const { passcode } = req.body;
    if (!TEAM_PASSCODE) {
        return res.status(500).json({ success: false, error: 'Server configuration error: TEAM_PASSCODE environment variable not set.' });
    }
    if (passcode === TEAM_PASSCODE) {
        res.json({ success: true, message: 'Authenticated successfully.' });
    } else {
        res.status(401).json({ success: false, error: 'Incorrect Team Passcode. Please try again.' });
    }
});

// Protected Static / Storage Proxy Route for Serving Category Images
app.get('/images/:category/:filename', authenticateTeam, async (req, res) => {
    try {
        const category = req.params.category.toUpperCase();
        const filename = path.basename(req.params.filename);
        
        const fileObj = await storage.getFileStreamOrBuffer(category, filename);
        res.setHeader('Content-Type', fileObj.contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        if (fileObj.contentLength) {
            res.setHeader('Content-Length', fileObj.contentLength);
        }
        if (Buffer.isBuffer(fileObj.stream)) {
            res.send(fileObj.stream);
        } else if (fileObj.stream.pipe) {
            fileObj.stream.pipe(res);
        } else {
            res.send(fileObj.stream);
        }
    } catch (err) {
        res.status(404).json({ success: false, error: 'Image not found.' });
    }
});

// Multer in-memory storage for Cloud / Storage abstraction
const multerStorage = multer.memoryStorage();
const upload = multer({
    storage: multerStorage,
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

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// 1. Get Stats Overview
app.get('/api/stats', authenticateTeam, async (req, res) => {
    try {
        const rawFiles = await storage.listFiles('RAW');
        const appFiles = await storage.listFiles('APP');
        const uiFiles = await storage.listFiles('UI');
        const bothFiles = await storage.listFiles('BOTH');
        const problemFiles = await storage.listFiles('PROBLEMS');

        const usersList = await db.getUsers();

        res.json({
            success: true,
            rawCount: rawFiles.length,
            appCount: appFiles.length,
            uiCount: uiFiles.length,
            bothCount: bothFiles.length,
            problemCount: problemFiles.length,
            untrackedCount: 0,
            users: usersList
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Get Image List by Category with Smart Content-Based Sorting & User Filtering
app.get('/api/images', authenticateTeam, async (req, res) => {
    try {
        const category = (req.query.category || 'ALL').toUpperCase();
        const sortBy = req.query.sort || 'severity';
        const userFilter = req.query.user || 'ALL';
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 0; // 0 means no pagination (all)
        let results = [];

        const categoriesToFetch = category === 'ALL' 
            ? ['RAW', 'APP', 'UI', 'BOTH', 'PROBLEMS']
            : (category === 'RECENT' ? ['RAW'] : [category]);

        // Fetch all metadata in 1 single bulk query to eliminate N+1 latency
        const metadataMap = await db.getAllMetadataMap();

        for (const cat of categoriesToFetch) {
            const files = await storage.listFiles(cat);
            for (const f of files) {
                const meta = metadataMap[f.name] || {
                    uploadedBy: 'Yash',
                    channel: 'WhatsApp',
                    userHandle: 'Community Feedback',
                    severity: 'MEDIUM',
                    topic: 'General Feedback',
                    notes: ''
                };
                
                if (userFilter !== 'ALL' && meta.uploadedBy.toLowerCase() !== userFilter.toLowerCase()) {
                    continue;
                }

                results.push({
                    name: f.name,
                    category: cat,
                    url: storage.getFileUrl(cat, f.name),
                    size: f.size,
                    mtime: f.mtime,
                    uploadedBy: meta.uploadedBy || 'Anonymous',
                    channel: meta.channel || 'WhatsApp',
                    severity: meta.severity || 'MEDIUM',
                    topic: meta.topic || 'General Feedback',
                    notes: meta.notes || '',
                    userHandle: meta.userHandle || 'Community User'
                });
            }
        }

        const severityRank = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        
        results.sort((a, b) => {
            if (category === 'RECENT' || sortBy === 'date') {
                return new Date(b.mtime) - new Date(a.mtime);
            } else if (sortBy === 'severity') {
                const rankA = severityRank[a.severity] || 0;
                const rankB = severityRank[b.severity] || 0;
                if (rankB !== rankA) return rankB - rankA;
            } else if (sortBy === 'topic') {
                return a.topic.localeCompare(b.topic);
            } else if (sortBy === 'user') {
                return a.uploadedBy.localeCompare(b.uploadedBy);
            }
            return new Date(b.mtime) - new Date(a.mtime);
        });

        const totalCount = results.length;
        if (limit > 0) {
            const startIndex = (page - 1) * limit;
            results = results.slice(startIndex, startIndex + limit);
        }

        res.json({ success: true, count: totalCount, page, limit, images: results });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Upload Raw Images Endpoint with User Profile Attribution
app.post('/api/upload', authenticateTeam, upload.array('photos', 20), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, error: 'No files uploaded.' });
        }

        const uploadedBy = req.body.uploader || 'Yash';
        const channel = req.body.channel || 'WhatsApp';
        const notes = req.body.notes || '';
        const severity = req.body.severity || 'MEDIUM';

        const uploadedFiles = [];

        for (const file of req.files) {
            const cleanName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const fileUrl = await storage.uploadFile('RAW', cleanName, file.buffer, file.mimetype);

            const meta = {
                uploadedBy,
                channel,
                userHandle: uploadedBy,
                severity,
                topic: severity === 'CRITICAL' ? 'Bug Report' : 'User Upload',
                notes,
                uploadedAt: new Date().toISOString()
            };

            await db.saveMetadataForFile(cleanName, meta);

            uploadedFiles.push({
                originalname: file.originalname,
                filename: cleanName,
                size: file.size,
                uploadedBy,
                url: fileUrl
            });
        }

        res.json({
            success: true,
            message: `Successfully uploaded ${uploadedFiles.length} raw image(s) by @${uploadedBy}.`,
            files: uploadedFiles
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Team Member Management Endpoints (Add, Edit, Delete)
app.post('/api/add-user', authenticateTeam, async (req, res) => {
    try {
        const { username } = req.body;
        if (!username || !username.trim()) {
            return res.status(400).json({ success: false, error: 'Username required.' });
        }
        const updatedUsers = await db.addUser(username);
        res.json({ success: true, users: updatedUsers, added: username.trim() });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/users/:username', authenticateTeam, async (req, res) => {
    try {
        const username = req.params.username;
        const updatedUsers = await db.deleteUser(username);
        res.json({ success: true, users: updatedUsers, deleted: username });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/users/:username', authenticateTeam, async (req, res) => {
    try {
        const oldName = req.params.username;
        const { newName } = req.body;
        if (!newName || !newName.trim()) {
            return res.status(400).json({ success: false, error: 'New team member name required.' });
        }
        const updatedUsers = await db.updateUser(oldName, newName.trim());
        res.json({ success: true, users: updatedUsers, updated: newName.trim() });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Delete Image & All Category Copies Endpoint
app.delete('/api/images/:filename', authenticateTeam, async (req, res) => {
    try {
        const filename = path.basename(req.params.filename);

        // Delete raw image and any organized copies across raw/, app/, ui/, both/, problems/
        await storage.deleteAllCategoryCopies(filename);
        await db.deleteMetadataForFile(filename);

        res.json({
            success: true,
            message: `Successfully deleted screenshot ${filename} and all corresponding organized category copies.`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Common Problem Finder API Endpoint
app.get('/api/common-problems', authenticateTeam, async (req, res) => {
    try {
        const clusters = await db.getProblemClusters();
        res.json({
            success: true,
            count: clusters.length,
            clusters: clusters
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

// Native Auto-Organizer (Runs seamlessly on Cloud Supabase Storage & Local Node.js)
async function runNativeAutoOrganizer() {
    const scriptPath = path.join(BASE_DIR, 'organize_feedback.ps1');
    const content = fs.readFileSync(scriptPath, 'utf-8');

    const appImages = parsePs1Array(content, 'appImages');
    const uiImages = parsePs1Array(content, 'uiImages');
    const bothImages = parsePs1Array(content, 'bothImages');
    const problemImages = parsePs1Array(content, 'problemImages');

    async function processCategory(items, categoryName, prefix) {
        let counter = 1;
        const logs = [];
        for (const img of items) {
            try {
                const ext = path.extname(img) || '.jpeg';
                const destFilename = `${prefix}-${counter}${ext}`;
                await storage.copyFile('RAW', img, categoryName, destFilename);
                logs.push(`  ${prefix}-${counter} <- ${img}`);
                counter++;
            } catch (err) {
                logs.push(`  MISSING: ${img}`);
            }
        }
        return { count: counter - 1, logs };
    }

    const appRes = await processCategory(appImages, 'APP', 'APP');
    const uiRes = await processCategory(uiImages, 'UI', 'UI');
    const bothRes = await processCategory(bothImages, 'BOTH', 'BOTH');
    const probRes = await processCategory(problemImages, 'PROBLEMS', 'PROBLEM');

    return `===== NATIVE AUTO-ORGANIZER OUTPUT =====\nOrganized all category buckets.\n\n===== APP FOLDER =====\n${appRes.logs.join('\n')}\n\n===== UI FOLDER =====\n${uiRes.logs.join('\n')}\n\n===== BOTH FOLDER =====\n${bothRes.logs.join('\n')}\n\n===== PROBLEMS FOLDER =====\n${probRes.logs.join('\n')}\n\n========== SUMMARY ==========\nAPP folder: ${appRes.count} images\nUI folder: ${uiRes.count} images\nBOTH folder: ${bothRes.count} images\nPROBLEMS folder: ${probRes.count} images\n`;
}

// Trigger Auto-Organizer Script
app.post('/api/run-organizer', authenticateTeam, async (req, res) => {
    try {
        const output = await runNativeAutoOrganizer();
        res.json({
            success: true,
            message: 'Auto-Organizer engine executed successfully!',
            output: output
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Open Folders API Endpoint
app.post('/api/open-folder', authenticateTeam, (req, res) => {
    const { folder } = req.body || {};
    const folderName = folder || 'RAW_IMAGES';

    if (process.env.NODE_ENV !== 'production' && process.platform === 'win32') {
        const targetPath = path.join(BASE_DIR, folderName);
        exec(`explorer "${targetPath}"`, (err) => {
            if (err) {
                return res.json({ success: true, isLocal: false, message: `Viewing ${folderName} category in Web Hub.` });
            }
            res.json({ success: true, isLocal: true, message: `Opened ${folderName} folder in Windows Explorer!` });
        });
    } else {
        res.json({ success: true, isLocal: false, message: `Navigated to ${folderName} category view in Web Hub!` });
    }
});

// 7. Get Documented Problems Catalog
app.get('/api/problems', authenticateTeam, async (req, res) => {
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
                            imageUrl: storage.getFileUrl('PROBLEMS', `PROBLEM-${problemList.length + 1}.jpeg`)
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

// Catch-all route handler for frontend single-page application
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/images')) {
        res.sendFile(path.join(BASE_DIR, 'public', 'index.html'));
    } else {
        res.status(404).json({ success: false, error: 'Endpoint not found.' });
    }
});

// Initialize DB and start server
db.initDb().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`====================================================`);
        console.log(`🚀 Kosmo Feedback Hub Web App is running!`);
        console.log(`🌐 Server Port: ${PORT}`);
        if (storage.isCloudStorageAvailable && db.isPostgresAvailable) {
            console.log(`[PRODUCTION MODE] Active Storage: Supabase Storage Bucket (${process.env.SUPABASE_STORAGE_BUCKET || 'kosmo-feedback'}) | Active DB: Supabase PostgreSQL`);
        } else {
            console.log(`[DEV WARNING] Falling back to local storage & JSON db — DATA IS NOT PERSISTENT ON RENDER FREE TIER!`);
        }
        console.log(`====================================================`);
    });
}).catch(err => {
    console.error('Failed to initialize database on startup:', err);
});
