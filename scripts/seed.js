require('dotenv').config();
const path = require('path');
const fs = require('fs');
const storage = require('../lib/storage');
const db = require('../lib/db');

async function seed() {
    console.log('====================================================');
    console.log('🌱 Kosmo Cloud Storage & DB Migration Seed Engine');
    console.log('====================================================');

    try {
        await db.initDb();
    } catch (err) {
        console.warn('⚠️ Warning: Database initialization failed during local seed run:', err.message);
        console.warn('Continuing with Cloud Storage file uploads...');
    }

    const BASE_DIR = path.resolve(__dirname, '..');
    const categories = ['RAW', 'APP', 'UI', 'BOTH', 'PROBLEMS'];

    let totalUploaded = 0;

    for (const cat of categories) {
        const catDir = cat === 'RAW' ? path.join(BASE_DIR, 'RAW_IMAGES') : path.join(BASE_DIR, cat);
        if (!fs.existsSync(catDir)) continue;

        const files = fs.readdirSync(catDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
        console.log(`\n📁 Processing ${cat} folder (${files.length} images)...`);

        for (const file of files) {
            const filePath = path.join(catDir, file);
            try {
                if (storage.isCloudStorageAvailable) {
                    await storage.uploadFile(cat, file, filePath);
                }
                
                // Get or seed metadata
                try {
                    const meta = await db.getMetadataForFile(file);
                    await db.saveMetadataForFile(file, meta);
                } catch (metaErr) {
                    // Ignore DB metadata errors if DB is unreachable
                }

                totalUploaded++;
            } catch (err) {
                console.error(`❌ Failed processing ${cat}/${file}:`, err.message);
            }
        }
    }

    console.log(`\n====================================================`);
    console.log(`✅ Seed process finished! Uploaded ${totalUploaded} image(s) to Supabase Storage.`);
    console.log(`Cloud Storage Enabled: ${storage.isCloudStorageAvailable}`);
    console.log(`PostgreSQL DB Enabled: ${db.isPostgresAvailable}`);
    console.log(`====================================================`);
}

seed().catch(err => {
    console.error('Fatal seed error:', err);
    process.exit(1);
});
