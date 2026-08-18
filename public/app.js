// Global error handler to catch rendering issues
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('JS Error caught:', msg, 'at', url, lineNo);
    return false;
};

// Kosmo Feedback Hub - Client Side Controller with Team Passcode Auth
document.addEventListener('DOMContentLoaded', () => {
    
    let currentCategory = 'ALL';
    let allImagesData = [];
    let currentUploadFiles = [];
    let savedPasscode = sessionStorage.getItem('kosmo_team_passcode') || '';

    // DOM Elements
    const statRaw = document.getElementById('statRaw');
    const statApp = document.getElementById('statApp');
    const statUi = document.getElementById('statUi');
    const statBoth = document.getElementById('statBoth');
    const statProblems = document.getElementById('statProblems');

    const runScriptBtn = document.getElementById('runScriptBtn');
    const lockHubBtn = document.getElementById('lockHubBtn');
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

    // Login Modal Elements
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const passcodeInput = document.getElementById('passcodeInput');
    const loginErrorAlert = document.getElementById('loginErrorAlert');
    const loginErrorText = document.getElementById('loginErrorText');
    const submitLoginBtn = document.getElementById('submitLoginBtn');

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
    // AUTHENTICATED FETCH HELPER
    // ---------------------------------------------------------
    async function authFetch(url, options = {}) {
        options.headers = options.headers || {};
        if (options.body instanceof FormData) {
            options.headers['x-team-passcode'] = savedPasscode;
        } else {
            options.headers = {
                ...options.headers,
                'x-team-passcode': savedPasscode
            };
        }

        const res = await fetch(url, options);
        if (res.status === 401) {
            showLoginModal('Session expired or unauthorized. Please re-enter Team Passcode.');
            throw new Error('Unauthorized');
        }
        return res;
    }

    function showLoginModal(msg = '') {
        if (msg) {
            loginErrorText.textContent = msg;
            loginErrorAlert.classList.remove('hidden');
        } else {
            loginErrorAlert.classList.add('hidden');
        }
        loginModal.classList.remove('hidden');
        passcodeInput.value = '';
        passcodeInput.focus();
    }

    function hideLoginModal() {
        loginModal.classList.add('hidden');
    }

    // ---------------------------------------------------------
    // LOGIN FORM SUBMISSION
    // ---------------------------------------------------------
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const enteredPasscode = passcodeInput.value.trim();
        if (!enteredPasscode) return;

        submitLoginBtn.disabled = true;
        submitLoginBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying...`;
        loginErrorAlert.classList.add('hidden');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode: enteredPasscode })
            });

            const data = await res.json();
            if (data.success) {
                savedPasscode = enteredPasscode;
                sessionStorage.setItem('kosmo_team_passcode', savedPasscode);
                hideLoginModal();
                loadStats();
                loadGallery(currentCategory);
            } else {
                loginErrorText.textContent = data.error || 'Incorrect Team Passcode.';
                loginErrorAlert.classList.remove('hidden');
            }
        } catch (err) {
            console.error('Login error:', err);
            loginErrorText.textContent = 'Failed to connect to authentication server.';
            loginErrorAlert.classList.remove('hidden');
        } finally {
            submitLoginBtn.disabled = false;
            submitLoginBtn.innerHTML = `<i class="fa-solid fa-lock-open"></i> Unlock Dashboard`;
        }
    });

    lockHubBtn.addEventListener('click', () => {
        sessionStorage.removeItem('kosmo_team_passcode');
        savedPasscode = '';
        showLoginModal('Dashboard locked. Re-enter Team Passcode to access.');
    });

    // User & Controls Elements
    const activeUserSelect = document.getElementById('activeUserSelect');
    const memberFilterSelect = document.getElementById('memberFilterSelect');
    const sortSelect = document.getElementById('sortSelect');
    const commonProblemsGrid = document.getElementById('commonProblemsGrid');

    // Restore active user from session or default
    if (sessionStorage.getItem('kosmo_active_user')) {
        activeUserSelect.value = sessionStorage.getItem('kosmo_active_user');
        uploaderName.value = sessionStorage.getItem('kosmo_active_user');
    }

    activeUserSelect.addEventListener('change', (e) => {
        sessionStorage.setItem('kosmo_active_user', e.target.value);
        uploaderName.value = e.target.value;
    });

    memberFilterSelect.addEventListener('change', () => {
        loadGallery(currentCategory);
    });

    sortSelect.addEventListener('change', () => {
        loadGallery(currentCategory);
    });

    // ---------------------------------------------------------
    // COMMON PROBLEM FINDER FETCHING
    // ---------------------------------------------------------
    async function loadCommonProblems() {
        if (!savedPasscode || !commonProblemsGrid) return;
        try {
            const res = await authFetch('/api/common-problems');
            const data = await res.json();
            if (data.success && data.clusters) {
                renderCommonProblems(data.clusters);
            }
        } catch (err) {
            console.error('Failed to load common problems:', err);
        }
    }

    function renderCommonProblems(clusters) {
        if (!clusters || clusters.length === 0) {
            commonProblemsGrid.innerHTML = `<p class="empty-msg">No common problem clusters detected yet.</p>`;
            return;
        }

        const maxCount = Math.max(...clusters.map(c => c.count), 1);

        commonProblemsGrid.innerHTML = clusters.map(c => {
            const fillPct = Math.round((c.count / maxCount) * 100);
            const badgeClass = getSeverityBadgeClass(c.severity);

            return `
                <div class="cluster-card">
                    <div class="cluster-header">
                        <span class="cluster-topic">${c.topic}</span>
                        <span class="cluster-count ${badgeClass}">${c.count} Reports</span>
                    </div>
                    <p class="cluster-desc">${c.description}</p>
                    <div class="freq-bar-bg">
                        <div class="freq-bar-fill" style="width: ${fillPct}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function getSeverityBadgeClass(sev) {
        switch (sev ? sev.toUpperCase() : '') {
            case 'CRITICAL': return 'badge-critical';
            case 'HIGH': return 'badge-high';
            case 'MEDIUM': return 'badge-medium';
            case 'LOW': return 'badge-low';
            default: return 'badge-gray';
        }
    }

    // ---------------------------------------------------------
    // 1. STATS FETCHING
    // ---------------------------------------------------------
    async function loadStats() {
        if (!savedPasscode) {
            showLoginModal();
            return;
        }
        try {
            const res = await authFetch('/api/stats');
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
        if (!savedPasscode) {
            showLoginModal();
            return;
        }
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
            const sortVal = sortSelect.value || 'severity';
            const userVal = memberFilterSelect.value || 'ALL';
            const res = await authFetch(`/api/images?category=${category}&sort=${sortVal}&user=${userVal}`);
            const data = await res.json();

            if (data.success) {
                allImagesData = data.images;
                renderGallery(allImagesData);
            } else {
                imageGrid.innerHTML = `<p class="error-msg">Error: ${data.error}</p>`;
            }
        } catch (err) {
            console.error('Failed to fetch gallery:', err);
        }
    }

    function renderGallery(images) {
        const query = searchInput.value.trim().toLowerCase();
        const filtered = images.filter(img => 
            img.name.toLowerCase().includes(query) || 
            img.category.toLowerCase().includes(query) ||
            (img.topic && img.topic.toLowerCase().includes(query)) ||
            (img.uploadedBy && img.uploadedBy.toLowerCase().includes(query))
        );

        if (filtered.length === 0) {
            imageGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                    <i class="fa-regular fa-image" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>No feedback images found in this category or member filter.</p>
                </div>
            `;
            return;
        }

        imageGrid.innerHTML = filtered.map(img => {
            const sizeKb = (img.size / 1024).toFixed(1);
            const dateStr = new Date(img.mtime).toLocaleString();
            const badgeClass = getBadgeClass(img.category);
            const severityClass = getSeverityBadgeClass(img.severity);
            const authUrl = `${img.url}?passcode=${encodeURIComponent(savedPasscode)}`;
            const userTag = img.uploadedBy || 'Yash';

            return `
                <div class="img-card" data-url="${authUrl}" data-name="${img.name}" data-cat="${img.category}" data-user="${userTag}" data-sev="${img.severity}" data-topic="${img.topic}" data-size="${sizeKb} KB" data-date="${dateStr}">
                    <div class="img-wrapper">
                        <img src="${authUrl}" alt="${img.name}" loading="lazy">
                        <div class="img-zoom-overlay">
                            <i class="fa-solid fa-expand"></i>
                        </div>
                    </div>
                    <div class="card-details">
                        <div class="card-title" title="${img.name}">${img.name}</div>
                        <div class="card-meta">
                            <span class="badge ${badgeClass}">${img.category}</span>
                            <span class="user-pill"><i class="fa-solid fa-user"></i> @${userTag}</span>
                            <span class="badge ${severityClass}">${img.severity}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.img-card').forEach(card => {
            card.addEventListener('click', () => {
                openLightboxModal({
                    url: card.dataset.url,
                    name: card.dataset.name,
                    category: card.dataset.cat,
                    uploadedBy: card.dataset.user,
                    severity: card.dataset.sev,
                    topic: card.dataset.topic,
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
            const res = await authFetch('/api/problems');
            const data = await res.json();
            if (data.success) {
                if (data.problems.length === 0) {
                    problemBoard.innerHTML = `<p class="empty-msg">No documented problems found.</p>`;
                    return;
                }
                problemBoard.innerHTML = data.problems.map(prob => {
                    const authImgUrl = `${prob.imageUrl}?passcode=${encodeURIComponent(savedPasscode)}`;
                    return `
                        <div class="problem-card">
                            <div class="problem-id">${prob.id}</div>
                            <div class="problem-desc">${prob.description}</div>
                            <img src="${authImgUrl}" class="problem-thumb" alt="${prob.id}" onclick="openLightboxModal({url: '${authImgUrl}', name: '${prob.filename}', category: 'PROBLEMS', size: 'N/A', date: 'Documented'})">
                        </div>
                    `;
                }).join('');
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
            const res = await authFetch('/api/upload', {
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
            const res = await authFetch('/api/run-organizer', { method: 'POST' });
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

        // Populate User & Severity Meta if available
        const userMeta = document.getElementById('lightboxUserMeta');
        if (userMeta) {
            userMeta.textContent = info.uploadedBy ? `@${info.uploadedBy}` : '@Yash';
        }

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

    // Initial Auth Check & Load
    if (savedPasscode) {
        hideLoginModal();
        loadStats();
        loadCommonProblems();
        loadGallery('ALL');
    } else {
        showLoginModal();
    }
});
