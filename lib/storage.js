const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'kosmo-feedback';

const isCloudStorageAvailable = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

let supabase = null;

if (isCloudStorageAvailable) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
    });
    console.log(`[STORAGE] Supabase Storage initialized. Bucket: ${SUPABASE_STORAGE_BUCKET}`);
} else if (SUPABASE_URL || SUPABASE_SERVICE_ROLE_KEY) {
    console.error(`[STORAGE ERROR] Partial Supabase configuration detected. Both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided.`);
} else {
    console.log(`[STORAGE] Cloud credentials not found. Using local filesystem fallback.`);
}

const BASE_DIR = path.resolve(__dirname, '..');

// Helper to determine content type
function getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.png': return 'image/png';
        case '.webp': return 'image/webp';
        case '.gif': return 'image/gif';
        default: return 'image/jpeg';
    }
}

// -------------------------------------------------------------
// SUPABASE / LOCAL STORAGE INTERFACE
// -------------------------------------------------------------

async function uploadFile(categoryKey, filename, fileBufferOrPath, contentType) {
    const mimeType = contentType || getContentType(filename);
    const key = `${categoryKey.toLowerCase()}/${filename}`;

    if (isCloudStorageAvailable) {
        let buffer;
        if (Buffer.isBuffer(fileBufferOrPath)) {
            buffer = fileBufferOrPath;
        } else {
            buffer = fs.readFileSync(fileBufferOrPath);
        }

        const { data, error } = await supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .upload(key, buffer, {
                contentType: mimeType,
                upsert: true
            });

        if (error) {
            throw new Error(`Supabase Storage upload error for ${key}: ${error.message}`);
        }

        return getFileUrl(categoryKey, filename);
    } else {
        // Local Filesystem Fallback
        const categoryDir = categoryKey === 'RAW' ? path.join(BASE_DIR, 'RAW_IMAGES') : path.join(BASE_DIR, categoryKey);
        if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true });
        }
        const destPath = path.join(categoryDir, filename);
        if (Buffer.isBuffer(fileBufferOrPath)) {
            fs.writeFileSync(destPath, fileBufferOrPath);
        } else if (fileBufferOrPath !== destPath) {
            fs.copyFileSync(fileBufferOrPath, destPath);
        }
        return `/images/${categoryKey}/${encodeURIComponent(filename)}`;
    }
}

async function copyFile(sourceCategory, sourceFilename, destCategory, destFilename) {
    const srcKey = `${sourceCategory.toLowerCase()}/${sourceFilename}`;
    const destKey = `${destCategory.toLowerCase()}/${destFilename}`;

    if (isCloudStorageAvailable) {
        // Try native copy first
        const { data, error } = await supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .copy(srcKey, destKey);

        if (error) {
            // Fallback download & upload if native copy fails
            const { data: fileData, error: dlErr } = await supabase.storage
                .from(SUPABASE_STORAGE_BUCKET)
                .download(srcKey);

            if (dlErr) {
                throw new Error(`Supabase Storage copy/download error (${srcKey} -> ${destKey}): ${dlErr.message}`);
            }

            const arrayBuf = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);
            const { error: upErr } = await supabase.storage
                .from(SUPABASE_STORAGE_BUCKET)
                .upload(destKey, buffer, {
                    contentType: getContentType(destFilename),
                    upsert: true
                });

            if (upErr) {
                throw new Error(`Supabase Storage copy/re-upload error (${destKey}): ${upErr.message}`);
            }
        }

        return getFileUrl(destCategory, destFilename);
    } else {
        // Local Filesystem Fallback
        const srcDir = sourceCategory === 'RAW' ? path.join(BASE_DIR, 'RAW_IMAGES') : path.join(BASE_DIR, sourceCategory);
        const destDir = destCategory === 'RAW' ? path.join(BASE_DIR, 'RAW_IMAGES') : path.join(BASE_DIR, destCategory);

        let srcPath = path.join(srcDir, sourceFilename);
        if (!fs.existsSync(srcPath)) {
            srcPath = path.join(BASE_DIR, 'RAW_IMAGES', sourceFilename);
        }
        if (!fs.existsSync(srcPath)) {
            srcPath = path.join(BASE_DIR, sourceFilename);
        }

        if (fs.existsSync(srcPath)) {
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            const destPath = path.join(destDir, destFilename);
            fs.copyFileSync(srcPath, destPath);
            return `/images/${destCategory}/${encodeURIComponent(destFilename)}`;
        }
        throw new Error(`Source file missing: ${sourceFilename}`);
    }
}

async function listFiles(categoryKey) {
    const prefix = categoryKey.toLowerCase();

    if (isCloudStorageAvailable) {
        const { data, error } = await supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .list(prefix, {
                limit: 200,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) {
            throw new Error(`Supabase Storage list error for ${prefix}: ${error.message}`);
        }

        return (data || [])
            .filter(item => item.name && /\.(jpg|jpeg|png|webp)$/i.test(item.name))
            .map(item => ({
                name: item.name,
                size: item.metadata?.size || 0,
                mtime: item.created_at || new Date()
            }))
            .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    } else {
        // Local Filesystem Fallback
        const targetDir = categoryKey === 'RAW' ? path.join(BASE_DIR, 'RAW_IMAGES') : path.join(BASE_DIR, categoryKey);
        if (!fs.existsSync(targetDir)) return [];

        return fs.readdirSync(targetDir)
            .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
            .map(f => {
                const full = path.join(targetDir, f);
                const stat = fs.statSync(full);
                return {
                    name: f,
                    size: stat.size,
                    mtime: stat.mtime
                };
            })
            .sort((a, b) => b.mtime - a.mtime);
    }
}

async function getFileStreamOrBuffer(categoryKey, filename) {
    const key = `${categoryKey.toLowerCase()}/${filename}`;

    if (isCloudStorageAvailable) {
        const { data, error } = await supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .download(key);

        if (error) {
            throw new Error(`Supabase Storage download error for ${key}: ${error.message}`);
        }

        const arrayBuf = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        return { stream: buffer, contentType: getContentType(filename), contentLength: buffer.length };
    } else {
        const targetDir = categoryKey === 'RAW' ? path.join(BASE_DIR, 'RAW_IMAGES') : path.join(BASE_DIR, categoryKey);
        const fullPath = path.join(targetDir, filename);
        if (!fs.existsSync(fullPath)) throw new Error(`File not found: ${filename}`);
        const stat = fs.statSync(fullPath);
        return { stream: fs.createReadStream(fullPath), contentType: getContentType(filename), contentLength: stat.size };
    }
}

function getFileUrl(categoryKey, filename) {
    if (isCloudStorageAvailable) {
        const key = `${categoryKey.toLowerCase()}/${filename}`;
        const { data } = supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .getPublicUrl(key);

        if (data && data.publicUrl) {
            return data.publicUrl;
        }
    }
    return `/images/${categoryKey}/${encodeURIComponent(filename)}`;
}

module.exports = {
    isCloudStorageAvailable,
    uploadFile,
    copyFile,
    listFiles,
    getFileStreamOrBuffer,
    getFileUrl,
    getContentType
};
