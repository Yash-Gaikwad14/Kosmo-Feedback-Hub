const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL;
const isPostgresAvailable = Boolean(DATABASE_URL);

let pool = null;

if (isPostgresAvailable) {
    pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
    });
    console.log(`[DATABASE] Hosted PostgreSQL Database connected.`);
} else {
    console.log(`[DATABASE] DATABASE_URL not found. Using local db.json database fallback.`);
}

const DB_PATH = path.join(__dirname, '..', 'config', 'db.json');

// Local DB JSON Helpers
function loadLocalDb() {
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

function saveLocalDb(dbData) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf-8');
    } catch (e) {
        console.error("Error saving db.json:", e);
    }
}

// -------------------------------------------------------------
// DB INIT & SCHEMA MIGRATION
// -------------------------------------------------------------

async function initDb() {
    if (isPostgresAvailable) {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS team_users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS image_metadata (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(512) UNIQUE NOT NULL,
                    uploaded_by VARCHAR(255),
                    channel VARCHAR(255),
                    user_handle VARCHAR(255),
                    severity VARCHAR(50),
                    topic VARCHAR(255),
                    notes TEXT,
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS problem_clusters (
                    id SERIAL PRIMARY KEY,
                    topic VARCHAR(255) UNIQUE NOT NULL,
                    count INT DEFAULT 1,
                    severity VARCHAR(50),
                    description TEXT
                );
            `);

            // Seed default users if empty
            const userRes = await client.query(`SELECT COUNT(*) FROM team_users`);
            if (parseInt(userRes.rows[0].count, 10) === 0) {
                const defaultUsers = ["Yash", "Priyal", "Dipak", "Ankit", "Kunal"];
                for (const u of defaultUsers) {
                    await client.query(`INSERT INTO team_users (username) VALUES ($1) ON CONFLICT DO NOTHING`, [u]);
                }
                console.log(`[DATABASE] Seeded default team users in PostgreSQL.`);
            }

            // Seed from local db.json if available
            const localDb = loadLocalDb();
            if (localDb.users && localDb.users.length > 0) {
                for (const u of localDb.users) {
                    await client.query(`INSERT INTO team_users (username) VALUES ($1) ON CONFLICT DO NOTHING`, [u]);
                }
            }
            if (localDb.imageMetadata && Object.keys(localDb.imageMetadata).length > 0) {
                for (const [filename, meta] of Object.entries(localDb.imageMetadata)) {
                    await client.query(`
                        INSERT INTO image_metadata (filename, uploaded_by, channel, user_handle, severity, topic, notes, uploaded_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (filename) DO UPDATE SET
                            uploaded_by = EXCLUDED.uploaded_by,
                            channel = EXCLUDED.channel,
                            severity = EXCLUDED.severity,
                            topic = EXCLUDED.topic,
                            notes = EXCLUDED.notes;
                    `, [
                        filename,
                        meta.uploadedBy || 'Yash',
                        meta.channel || 'WhatsApp',
                        meta.userHandle || meta.uploadedBy || 'Community User',
                        meta.severity || 'MEDIUM',
                        meta.topic || 'General Feedback',
                        meta.notes || '',
                        meta.uploadedAt ? new Date(meta.uploadedAt) : new Date()
                    ]);
                }
            }
        } catch (err) {
            console.error('[DATABASE FATAL ERROR] Failed to connect to or initialize PostgreSQL database:', err.message);
            throw err;
        } finally {
            client.release();
        }
    } else {
        // Ensure local db.json exists
        loadLocalDb();
    }
}

// -------------------------------------------------------------
// PUBLIC INTERFACE METHODS
// -------------------------------------------------------------

async function getUsers() {
    if (isPostgresAvailable) {
        try {
            const res = await pool.query(`SELECT username FROM team_users ORDER BY id ASC`);
            return res.rows.map(r => r.username);
        } catch (err) {
            console.error('Error fetching users from Postgres:', err);
            return ["Yash", "Priyal", "Dipak", "Ankit", "Kunal"];
        }
    } else {
        const local = loadLocalDb();
        return local.users || ["Yash", "Priyal", "Dipak", "Ankit", "Kunal"];
    }
}

async function addUser(username) {
    const cleanName = username.trim();
    if (!cleanName) return await getUsers();

    if (isPostgresAvailable) {
        try {
            await pool.query(`INSERT INTO team_users (username) VALUES ($1) ON CONFLICT DO NOTHING`, [cleanName]);
        } catch (err) {
            console.error('Error adding user in Postgres:', err);
        }
        return await getUsers();
    } else {
        const local = loadLocalDb();
        if (!local.users.includes(cleanName)) {
            local.users.push(cleanName);
            saveLocalDb(local);
        }
        return local.users;
    }
}

async function getMetadataForFile(filename) {
    if (isPostgresAvailable) {
        try {
            const res = await pool.query(`SELECT * FROM image_metadata WHERE filename = $1`, [filename]);
            if (res.rows.length > 0) {
                const row = res.rows[0];
                return {
                    uploadedBy: row.uploaded_by || 'Yash',
                    channel: row.channel || 'WhatsApp',
                    userHandle: row.user_handle || 'Community Feedback',
                    severity: row.severity || 'MEDIUM',
                    topic: row.topic || 'General Feedback',
                    notes: row.notes || '',
                    uploadedAt: row.uploaded_at
                };
            }
        } catch (err) {
            console.error('Error getting metadata from Postgres:', err);
        }
    } else {
        const local = loadLocalDb();
        if (local.imageMetadata && local.imageMetadata[filename]) {
            return local.imageMetadata[filename];
        }
    }

    // Default fallback metadata
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

async function saveMetadataForFile(filename, meta) {
    if (isPostgresAvailable) {
        try {
            await pool.query(`
                INSERT INTO image_metadata (filename, uploaded_by, channel, user_handle, severity, topic, notes, uploaded_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (filename) DO UPDATE SET
                    uploaded_by = EXCLUDED.uploaded_by,
                    channel = EXCLUDED.channel,
                    severity = EXCLUDED.severity,
                    topic = EXCLUDED.topic,
                    notes = EXCLUDED.notes;
            `, [
                filename,
                meta.uploadedBy || 'Yash',
                meta.channel || 'WhatsApp',
                meta.userHandle || meta.uploadedBy || 'Community User',
                meta.severity || 'MEDIUM',
                meta.topic || 'General Feedback',
                meta.notes || '',
                meta.uploadedAt ? new Date(meta.uploadedAt) : new Date()
            ]);
        } catch (err) {
            console.error('Error saving metadata to Postgres:', err);
        }
    } else {
        const local = loadLocalDb();
        if (!local.imageMetadata) local.imageMetadata = {};
        local.imageMetadata[filename] = meta;
        saveLocalDb(local);
    }
}

async function getProblemClusters() {
    if (isPostgresAvailable) {
        try {
            const res = await pool.query(`SELECT topic, count, severity, description FROM problem_clusters ORDER BY count DESC`);
            return res.rows;
        } catch (err) {
            console.error('Error getting problem clusters from Postgres:', err);
        }
    }
    const local = loadLocalDb();
    return local.problemClusters || [];
}

module.exports = {
    isPostgresAvailable,
    initDb,
    getUsers,
    addUser,
    getMetadataForFile,
    saveMetadataForFile,
    getProblemClusters
};
