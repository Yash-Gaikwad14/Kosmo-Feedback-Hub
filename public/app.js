// Kosmo Feedback Hub - Client Side Controller
document.addEventListener('DOMContentLoaded', () => {
    
    let currentCategory = 'ALL';
    let allImagesData = [];
    let currentUploadFiles = [];

    // DOM Elements
    const statRaw = document.getElementById('statRaw');
    const statApp = document.getElementById('statApp');
    const statUi = document.getElementById('statUi');
    const statBoth = document.getElementById('statBoth');
    const statProblems = document.getElementById('statProblems');

    const runScriptBtn = document.getElementById('runScriptBtn');
    const scriptStatusBadge = document.getElementById('scriptStatusBadge');
    const terminalOutput = document.getElementById('terminalOutput');

    const uploadForm = document.getElementById('uploadForm');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const filePreviewList = document.getElementById('filePreviewList');
    const channelSelect = document.getElementById('channelSelect');
    const uploaderName = document.getElementById('uploaderName');
    const submitUploadBtn = document.getElementById('submitUploadBtn');

    const imageGrid = document.getElementById('imageGrid');
    const problemBoard = document.getElementById('problemBoard');
    const searchInput = document.getElementById('searchInput');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const statCards = document.querySelectorAll('.stat-card');

    // Lightbox Elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxCat = document.getElementById('lightboxCat');
    const lightboxFilename = document.getElementById('lightboxFilename');
    const lightboxSize = document.getElementById('lightboxSize');
    const lightboxDate = document.getElementById('lightboxDate');
    const lightboxDownload = document.getElementById('lightboxDownload');
    const closeLightbox = document.getElementById('closeLightbox');

    // ---------------------------------------------------------
    // 1. STATS FETCHING
    // ---------------------------------------------------------
    async function loadStats() {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            if (data.success) {
                statRaw.textContent = data.rawCount || 0;
                statApp.textContent = data.appCount || 0;
                statUi.textContent = data.uiCount || 0;
                statBoth.textContent = data.bothCount || 0;
                statProblems.textContent = data.problemCount || 0;
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }

    // ---------------------------------------------------------
    // 2. GALLERY FETCHING & RENDERING
    // ---------------------------------------------------------
    async function loadGallery(category = 'ALL') {
        currentCategory = category;

        if (category === 'PROBLEMS_LIST') {
            imageGrid.classList.add('hidden');
            problemBoard.classList.remove('hidden');
            loadProblemBoard();
            return;
        } else {
            imageGrid.classList.remove('hidden');
            problemBoard.classList.add('hidden');
        }

        imageGrid.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading ${category} feedback gallery...</div>`;

        try {
            const res = await fetch(`/api/images?category=${category}`);
            const data = await res.json();

            if (data.success) {
                allImagesData = data.images;
                renderGallery(allImagesData);
            } else {
                imageGrid.innerHTML = `<p class="error-msg">Error: ${data.error}</p>`;
            }
        } catch (err) {
            console.error('Failed to fetch gallery:', err);
            imageGrid.innerHTML = `<p class="error-msg">Failed to load images from server.</p>`;
        }
    }

    function renderGallery(images) {
        const query = searchInput.value.trim().toLowerCase();
        const filtered = images.filter(img => img.name.toLowerCase().includes(query) || img.category.toLowerCase().includes(query));

        if (filtered.length === 0) {
            imageGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                    <i class="fa-regular fa-image" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>No feedback images found in this category.</p>
                </div>
            `;
            return;
        }

        imageGrid.innerHTML = filtered.map(img => {
            const sizeKb = (img.size / 1024).toFixed(1);
            const dateStr = new Date(img.mtime).toLocaleString();
            const badgeClass = getBadgeClass(img.category);

            return `
                <div class="img-card" data-url="${img.url}" data-name="${img.name}" data-cat="${img.category}" data-size="${sizeKb} KB" data-date="${dateStr}">
                    <div class="img-wrapper">
                        <img src="${img.url}" alt="${img.name}" loading="lazy">
                        <div class="img-zoom-overlay">
                            <i class="fa-solid fa-expand"></i>
                        </div>
                    </div>
                    <div class="card-details">
                        <div class="card-title">${img.name}</div>
                        <div class="card-meta">
                            <span class="badge ${badgeClass}">${img.category}</span>
                            <span>${sizeKb} KB</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click handlers to open lightbox
        document.querySelectorAll('.img-card').forEach(card => {
            card.addEventListener('click', () => {
                openLightboxModal({
                    url: card.dataset.url,
                    name: card.dataset.name,
                    category: card.dataset.cat,
                    size: card.dataset.size,
                    date: card.dataset.date
                });
            });
        });
    }

    function getBadgeClass(cat) {
        switch (cat) {
            case 'APP': return 'badge-purple';
            case 'UI': return 'badge-gray';
            case 'BOTH': return 'badge-green';
            case 'PROBLEMS': return 'badge-purple';
            default: return 'badge-gray';
        }
    }

    // ---------------------------------------------------------
    // 3. PROBLEM BOARD FETCHING
    // ---------------------------------------------------------
    async function loadProblemBoard() {
        problemBoard.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading documented problems...</div>`;
        try {
            const res = await fetch('/api/problems');
            const data = await res.json();
            if (data.success) {
                if (data.problems.length === 0) {
                    problemBoard.innerHTML = `<p class="empty-msg">No documented problems found.</p>`;
                    return;
                }
                problemBoard.innerHTML = data.problems.map(prob => `
                    <div class="problem-card">
                        <div class="problem-id">${prob.id}</div>
                        <div class="problem-desc">${prob.description}</div>
                        <img src="${prob.imageUrl}" class="problem-thumb" alt="${prob.id}" onclick="openLightboxModal({url: '${prob.imageUrl}', name: '${prob.filename}', category: 'PROBLEMS', size: 'N/A', date: 'Documented'})">
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error('Failed to load problems:', err);
        }
    }

    // ---------------------------------------------------------
    // 4. DROPZONE & UPLOAD HANDLERS
    // ---------------------------------------------------------
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        currentUploadFiles = Array.from(files);
        filePreviewList.innerHTML = currentUploadFiles.map(f => `
            <div class="file-chip">
                <i class="fa-regular fa-image"></i>
                <span>${f.name}</span>
            </div>
        `).join('');
    }

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (currentUploadFiles.length === 0) {
            alert('Please select or drag at least one raw image file!');
            return;
        }

        submitUploadBtn.disabled = true;
        submitUploadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;

        const formData = new FormData();
        currentUploadFiles.forEach(file => {
            formData.append('photos', file);
        });
        formData.append('channel', channelSelect.value);
        formData.append('uploader', uploaderName.value || 'Anonymous');

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                appendTerminalLog(`\n[UPLOAD SUCCESS] ${data.message}`);
                currentUploadFiles = [];
                filePreviewList.innerHTML = '';
                fileInput.value = '';
                loadStats();
                loadGallery(currentCategory);
            } else {
                appendTerminalLog(`\n[UPLOAD ERROR] ${data.error}`);
            }
        } catch (err) {
            console.error('Upload failed:', err);
            appendTerminalLog(`\n[UPLOAD FAILED] Network or server error.`);
        } finally {
            submitUploadBtn.disabled = false;
            submitUploadBtn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload Raw Images`;
        }
    });

    // ---------------------------------------------------------
    // 5. BACKEND SCRIPT TRIGGER
    // ---------------------------------------------------------
    runScriptBtn.addEventListener('click', async () => {
        runScriptBtn.disabled = true;
        runScriptBtn.innerHTML = `<i class="fa-solid fa-gear fa-spin"></i> Organizing...`;
        scriptStatusBadge.textContent = 'Running';
        scriptStatusBadge.className = 'badge badge-purple';

        appendTerminalLog(`\n> powershell -ExecutionPolicy Bypass -File organize_feedback.ps1\nExecuting auto-organizer backend script...`);

        try {
            const res = await fetch('/api/run-organizer', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                scriptStatusBadge.textContent = 'Completed';
                scriptStatusBadge.className = 'badge badge-green';
                appendTerminalLog(`\n${data.output}\n[DONE] Successfully categorized and organized images!`);
                loadStats();
                loadGallery(currentCategory);
            } else {
                scriptStatusBadge.textContent = 'Failed';
                scriptStatusBadge.className = 'badge badge-rose';
                appendTerminalLog(`\n[ERROR] ${data.error}\n${data.stderr || ''}`);
            }
        } catch (err) {
            console.error('Script execution error:', err);
            appendTerminalLog(`\n[FATAL ERROR] Failed to contact backend server.`);
        } finally {
            runScriptBtn.disabled = false;
            runScriptBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Run Auto-Organizer`;
        }
    });

    function appendTerminalLog(msg) {
        terminalOutput.textContent += msg;
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    // ---------------------------------------------------------
    // 6. TAB FILTERS & SEARCH
    // ---------------------------------------------------------
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadGallery(btn.dataset.category);
        });
    });

    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.dataset.cat;
            tabBtns.forEach(b => {
                if (b.dataset.category === cat) {
                    b.click();
                }
            });
        });
    });

    searchInput.addEventListener('input', () => {
        renderGallery(allImagesData);
    });

    // ---------------------------------------------------------
    // 7. LIGHTBOX MODAL
    // ---------------------------------------------------------
    window.openLightboxModal = function(info) {
        lightboxImg.src = info.url;
        lightboxTitle.textContent = info.name;
        lightboxCat.textContent = info.category;
        lightboxCat.className = `badge ${getBadgeClass(info.category)}`;
        lightboxFilename.textContent = info.name;
        lightboxSize.textContent = info.size;
        lightboxDate.textContent = info.date;
        lightboxDownload.href = info.url;

        lightbox.classList.remove('modal-hidden');
    };

    closeLightbox.addEventListener('click', () => {
        lightbox.classList.add('modal-hidden');
    });

    document.querySelector('.lightbox-overlay').addEventListener('click', () => {
        lightbox.classList.add('modal-hidden');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            lightbox.classList.add('modal-hidden');
        }
    });

    // Initial Load
    loadStats();
    loadGallery('ALL');
});
