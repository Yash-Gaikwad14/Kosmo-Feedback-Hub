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
    let currentUsersList = [];
    let currentPage = 1;
    const PAGE_LIMIT = 24;
    let pendingDeleteFilename = '';
    let savedPasscode = sessionStorage.getItem('kosmo_team_passcode') || '';

    // DOM Elements
    const toastContainer = document.getElementById('toastContainer');
    const statRaw = document.getElementById('statRaw');
    const statApp = document.getElementById('statApp');
    const statUi = document.getElementById('statUi');
    const statBoth = document.getElementById('statBoth');
    const statProblems = document.getElementById('statProblems');

    const openFolderBtn = document.getElementById('openFolderBtn');
    const runScriptBtn = document.getElementById('runScriptBtn');
    const lockHubBtn = document.getElementById('lockHubBtn');
    const scriptStatusBadge = document.getElementById('scriptStatusBadge');
    const terminalOutput = document.getElementById('terminalOutput');

    const uploadForm = document.getElementById('uploadForm');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const filePreviewList = document.getElementById('filePreviewList');
    const channelSelect = document.getElementById('channelSelect');
    const uploaderSelect = document.getElementById('uploaderSelect');
    const submitUploadBtn = document.getElementById('submitUploadBtn');
    const uploadStatusBanner = document.getElementById('uploadStatusBanner');
    const uploadProgressContainer = document.getElementById('uploadProgressContainer');
    const uploadProgressBar = document.getElementById('uploadProgressBar');
    const uploadProgressText = document.getElementById('uploadProgressText');

    const imageGrid = document.getElementById('imageGrid');
    const problemBoard = document.getElementById('problemBoard');
    const searchInput = document.getElementById('searchInput');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const statCards = document.querySelectorAll('.stat-card');
    const paginationContainer = document.getElementById('paginationContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    // Team Management Elements
    const manageTeamBtn = document.getElementById('manageTeamBtn');
    const teamModal = document.getElementById('teamModal');
    const closeTeamModal = document.getElementById('closeTeamModal');
    const teamMembersList = document.getElementById('teamMembersList');
    const newMemberInput = document.getElementById('newMemberInput');
    const submitNewMemberBtn = document.getElementById('submitNewMemberBtn');

    // Delete Modal Elements
    const deleteModal = document.getElementById('deleteModal');
    const deleteTargetFilename = document.getElementById('deleteTargetFilename');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const lightboxDeleteBtn = document.getElementById('lightboxDeleteBtn');

    // Duplicate Modal Elements
    const duplicateModal = document.getElementById('duplicateModal');
    const duplicateFileList = document.getElementById('duplicateFileList');
    const cancelDuplicateBtn = document.getElementById('cancelDuplicateBtn');
    const confirmDuplicateBtn = document.getElementById('confirmDuplicateBtn');
    let pendingDuplicateFormData = null;

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
    const lightboxUserMeta = document.getElementById('lightboxUserMeta');
    const lightboxFilename = document.getElementById('lightboxFilename');
    const lightboxSize = document.getElementById('lightboxSize');
    const lightboxDate = document.getElementById('lightboxDate');
    const lightboxDownload = document.getElementById('lightboxDownload');
    const closeLightbox = document.getElementById('closeLightbox');

    // User & Controls Elements
    const activeUserSelect = document.getElementById('activeUserSelect');
    const memberFilterSelect = document.getElementById('memberFilterSelect');
    const sortSelect = document.getElementById('sortSelect');
    const commonProblemsGrid = document.getElementById('commonProblemsGrid');

    // ---------------------------------------------------------
    // TOAST NOTIFICATIONS SYSTEM
    // ---------------------------------------------------------
    function showToast(message, type = 'info', duration = 4000) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'fa-circle-info';
        if (type === 'success') icon = 'fa-circle-check';
        if (type === 'error') icon = 'fa-circle-exclamation';

        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ---------------------------------------------------------
    // AUTHENTICATED FETCH HELPER (Header Only)
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

    // Helper to format image URL with passcode query param for standard <img> tags
    function getAuthenticatedImageUrl(rawUrl) {
        if (!rawUrl) return '';
        if (rawUrl.startsWith('http')) return rawUrl;
        const joiner = rawUrl.includes('?') ? '&' : '?';
        return `${rawUrl}${joiner}passcode=${encodeURIComponent(savedPasscode)}`;
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
                showToast('Welcome to Kosmo Feedback Hub!', 'success');
                loadStats();
                loadCommonProblems();
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

    // Restore active user from session or default
    if (sessionStorage.getItem('kosmo_active_user')) {
        const savedUser = sessionStorage.getItem('kosmo_active_user');
        if (activeUserSelect) activeUserSelect.value = savedUser;
        if (uploaderSelect) uploaderSelect.value = savedUser;
    }

    // Team Member Dropdown Handlers (Synchronized)
    function handleUserDropdownChange(e) {
        const val = e.target.value;
        if (val === 'ADD_NEW') {
            const savedUser = sessionStorage.getItem('kosmo_active_user') || currentUsersList[0] || 'Aditya';
            activeUserSelect.value = savedUser;
            uploaderSelect.value = savedUser;
            openTeamModal();
            return;
        }
        sessionStorage.setItem('kosmo_active_user', val);
        activeUserSelect.value = val;
        uploaderSelect.value = val;
    }

    activeUserSelect.addEventListener('change', handleUserDropdownChange);
    uploaderSelect.addEventListener('change', handleUserDropdownChange);
    manageTeamBtn?.addEventListener('click', openTeamModal);

    function openTeamModal() {
        renderTeamManagementList();
        teamModal.classList.remove('modal-hidden');
        if (newMemberInput) {
            newMemberInput.value = '';
            setTimeout(() => newMemberInput.focus(), 100);
        }
    }

    closeTeamModal?.addEventListener('click', () => teamModal.classList.add('modal-hidden'));

    function populateUserDropdowns(usersList, activeUser) {
        if (!usersList || usersList.length === 0) return;
        currentUsersList = usersList;
        
        const optionsHtml = usersList.map(u => `<option value="${u}">@${u}</option>`).join('') + `<option value="ADD_NEW">+ Manage Team Members...</option>`;
        activeUserSelect.innerHTML = optionsHtml;
        uploaderSelect.innerHTML = optionsHtml;

        const targetUser = activeUser || usersList[0];
        activeUserSelect.value = targetUser;
        uploaderSelect.value = targetUser;
        sessionStorage.setItem('kosmo_active_user', targetUser);

        // Member Filter Dropdown
        memberFilterSelect.innerHTML = `<option value="ALL">All Team Members</option>` + usersList.map(u => `<option value="${u}">Added by @${u}</option>`).join('');
    }

    // Render Team Members Management Modal Content
    function renderTeamManagementList() {
        if (!currentUsersList || currentUsersList.length === 0) {
            teamMembersList.innerHTML = `<p class="empty-msg">No team members defined.</p>`;
            return;
        }

        teamMembersList.innerHTML = currentUsersList.map(u => `
            <div class="team-member-row">
                <span class="member-name-tag"><i class="fa-solid fa-user"></i> @${u}</span>
                <div class="member-actions">
                    <button class="btn-icon-action edit-user-btn" data-username="${u}" title="Edit Name"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon-action delete-hover delete-user-btn" data-username="${u}" title="Delete User Profile"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `).join('');

        // Edit User Handlers
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const oldName = btn.dataset.username;
                const newName = prompt(`Edit team member name for @${oldName}:`, oldName);
                if (newName && newName.trim() && newName.trim() !== oldName) {
                    try {
                        const res = await authFetch(`/api/users/${encodeURIComponent(oldName)}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ newName: newName.trim() })
                        });
                        const data = await res.json();
                        if (data.success) {
                            populateUserDropdowns(data.users, newName.trim());
                            renderTeamManagementList();
                            showToast(`Updated profile to @${newName.trim()}!`, 'success');
                            loadGallery(currentCategory);
                        }
                    } catch (err) {
                        console.error('Failed to update user:', err);
                        showToast('Failed to edit team member profile.', 'error');
                    }
                }
            });
        });

        // Delete User Handlers
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const targetName = btn.dataset.username;
                if (confirm(`Are you sure you want to remove team member profile @${targetName}? (Their past uploads will remain attributed to historical records).`)) {
                    try {
                        const res = await authFetch(`/api/users/${encodeURIComponent(targetName)}`, {
                            method: 'DELETE'
                        });
                        const data = await res.json();
                        if (data.success) {
                            populateUserDropdowns(data.users);
                            renderTeamManagementList();
                            showToast(`Removed team member profile @${targetName}.`, 'success');
                        }
                    } catch (err) {
                        console.error('Failed to delete user:', err);
                        showToast('Failed to delete team member profile.', 'error');
                    }
                }
            });
        });
    }

    async function handleAddNewMember() {
        const cleanName = newMemberInput.value.trim();
        if (!cleanName) {
            showToast('Please enter a team member name.', 'error');
            return;
        }

        try {
            const res = await authFetch('/api/add-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: cleanName })
            });
            const data = await res.json();
            if (data.success && data.users) {
                populateUserDropdowns(data.users, cleanName);
                renderTeamManagementList();
                newMemberInput.value = '';
                showToast(`Added @${cleanName} to Team Members!`, 'success');
            } else {
                showToast(data.error || 'Failed to add team member.', 'error');
            }
        } catch (err) {
            console.error('Failed to add user:', err);
            showToast('Failed to add team member.', 'error');
        }
    }

    submitNewMemberBtn?.addEventListener('click', handleAddNewMember);
    newMemberInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddNewMember();
        }
    });

    memberFilterSelect.addEventListener('change', () => {
        currentPage = 1;
        loadGallery(currentCategory);
    });

    sortSelect.addEventListener('change', () => {
        currentPage = 1;
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
            commonProblemsGrid.innerHTML = `
                <div class="error-box">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>Unable to load problem clusters.</p>
                    <button onclick="loadCommonProblems()" class="btn btn-secondary retry-btn"><i class="fa-solid fa-rotate-right"></i> Retry</button>
                </div>
            `;
        }
    }

    function renderCommonProblems(clusters) {
        if (!clusters || clusters.length === 0) {
            commonProblemsGrid.innerHTML = `<p class="empty-msg" style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No common problem clusters detected yet.</p>`;
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

                if (data.users && data.users.length > 0) {
                    const currentActive = sessionStorage.getItem('kosmo_active_user') || data.users[0];
                    populateUserDropdowns(data.users, currentActive);
                }
            } else {
                showToast(`Failed to load stats: ${data.error}`, 'error');
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }

    // ---------------------------------------------------------
    // 2. GALLERY FETCHING & RENDERING (With Pagination & Delete)
    // ---------------------------------------------------------
    async function loadGallery(category = 'ALL', append = false) {
        if (!savedPasscode) {
            showLoginModal();
            return;
        }
        currentCategory = category;

        if (category === 'PROBLEMS_LIST') {
            imageGrid.classList.add('hidden');
            problemBoard.classList.remove('hidden');
            paginationContainer.classList.add('hidden');
            loadProblemBoard();
            return;
        } else {
            imageGrid.classList.remove('hidden');
            problemBoard.classList.add('hidden');
        }

        if (!append) {
            currentPage = 1;
            imageGrid.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading ${category} feedback gallery...</div>`;
        }

        try {
            const sortVal = sortSelect.value || 'severity';
            const userVal = memberFilterSelect.value || 'ALL';
            
            // Limit pagination for Recent Uploads view or large lists
            const limit = category === 'RECENT' ? PAGE_LIMIT : 0;
            const res = await authFetch(`/api/images?category=${category}&sort=${sortVal}&user=${userVal}&page=${currentPage}&limit=${limit}`);
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();

            if (data.success) {
                if (append) {
                    allImagesData = [...allImagesData, ...data.images];
                } else {
                    allImagesData = data.images;
                }
                
                renderGallery(allImagesData);

                // Show Pagination Load More Button if recent category has more items
                if (category === 'RECENT' && data.count > allImagesData.length) {
                    paginationContainer.classList.remove('hidden');
                } else {
                    paginationContainer.classList.add('hidden');
                }
            } else {
                renderGalleryError(data.error || 'Failed to fetch gallery images');
            }
        } catch (err) {
            console.error('Failed to fetch gallery:', err);
            renderGalleryError(err.message || 'Network error fetching feedback gallery');
        }
    }

    loadMoreBtn?.addEventListener('click', () => {
        currentPage++;
        loadGallery(currentCategory, true);
    });

    function renderGalleryError(errMsg) {
        imageGrid.innerHTML = `
            <div class="error-box">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>Unable to load gallery images (${errMsg}).</p>
                <button id="retryGalleryBtn" class="btn btn-secondary retry-btn"><i class="fa-solid fa-rotate-right"></i> Retry Loading</button>
            </div>
        `;
        document.getElementById('retryGalleryBtn')?.addEventListener('click', () => loadGallery(currentCategory));
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
            const userTag = img.uploadedBy || 'Yash';
            const displayUrl = getAuthenticatedImageUrl(img.url);

            return `
                <div class="img-card" data-url="${displayUrl}" data-name="${img.name}" data-cat="${img.category}" data-user="${userTag}" data-sev="${img.severity}" data-topic="${img.topic}" data-size="${sizeKb} KB" data-date="${dateStr}">
                    <button class="btn-card-delete delete-image-btn" data-filename="${img.name}" title="Delete Image & Category Copies"><i class="fa-solid fa-trash"></i></button>
                    <div class="img-wrapper">
                        <img src="${displayUrl}" alt="${img.name}" loading="lazy">
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

        // Card Click Handler
        document.querySelectorAll('.img-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.delete-image-btn')) return;
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

        // Delete Card Buttons Handlers
        document.querySelectorAll('.delete-image-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const filename = btn.dataset.filename;
                openDeleteConfirmationModal(filename);
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
    // 3. DELETE IMAGE CONFIRMATION MODAL
    // ---------------------------------------------------------
    function openDeleteConfirmationModal(filename) {
        pendingDeleteFilename = filename;
        deleteTargetFilename.textContent = filename;
        deleteModal.classList.remove('modal-hidden');
    }

    cancelDeleteBtn?.addEventListener('click', () => {
        deleteModal.classList.add('modal-hidden');
        pendingDeleteFilename = '';
    });

    confirmDeleteBtn?.addEventListener('click', async () => {
        if (!pendingDeleteFilename) return;

        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Deleting...`;

        try {
            const res = await authFetch(`/api/images/${encodeURIComponent(pendingDeleteFilename)}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (data.success) {
                showToast(`Deleted ${pendingDeleteFilename} and all category copies!`, 'success');
                deleteModal.classList.add('modal-hidden');
                lightbox.classList.add('modal-hidden');
                pendingDeleteFilename = '';
                loadStats();
                loadGallery(currentCategory);
            } else {
                showToast(`Failed to delete: ${data.error}`, 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Failed to delete image.', 'error');
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i> Yes, Delete Image`;
        }
    });

    lightboxDeleteBtn?.addEventListener('click', () => {
        const currentFilename = lightboxFilename.textContent;
        if (currentFilename && currentFilename !== '--') {
            openDeleteConfirmationModal(currentFilename);
        }
    });

    // ---------------------------------------------------------
    // 4. PROBLEM BOARD FETCHING
    // ---------------------------------------------------------
    async function loadProblemBoard() {
        problemBoard.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading documented problems...</div>`;
        try {
            const res = await authFetch('/api/problems');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            if (data.success) {
                if (data.problems.length === 0) {
                    problemBoard.innerHTML = `<p class="empty-msg" style="text-align: center; padding: 2rem; color: var(--text-muted);">No documented problems found.</p>`;
                    return;
                }
                problemBoard.innerHTML = data.problems.map(prob => {
                    const probUrl = getAuthenticatedImageUrl(prob.imageUrl);
                    return `
                        <div class="problem-card">
                            <div class="problem-id">${prob.id}</div>
                            <div class="problem-desc">${prob.description}</div>
                            <img src="${probUrl}" class="problem-thumb" alt="${prob.id}" onclick="openLightboxModal({url: '${probUrl}', name: '${prob.filename}', category: 'PROBLEMS', size: 'N/A', date: 'Documented'})">
                        </div>
                    `;
                }).join('');
            }
        } catch (err) {
            console.error('Failed to load problems:', err);
            problemBoard.innerHTML = `
                <div class="error-box">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <p>Unable to load problems board (${err.message}).</p>
                    <button id="retryProblemsBtn" class="btn btn-secondary retry-btn"><i class="fa-solid fa-rotate-right"></i> Retry Loading</button>
                </div>
            `;
            document.getElementById('retryProblemsBtn')?.addEventListener('click', loadProblemBoard);
        }
    }

    // ---------------------------------------------------------
    // 5. DROPZONE & UPLOAD HANDLERS
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
        handleFiles(dt.files);
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
        uploadStatusBanner.classList.add('hidden');
    }

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (currentUploadFiles.length === 0) {
            showToast('Please select or drag at least one raw image file!', 'error');
            return;
        }

        submitUploadBtn.disabled = true;
        submitUploadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;
        uploadProgressContainer.classList.remove('hidden');
        uploadProgressBar.style.width = '30%';
        uploadProgressText.textContent = `Uploading ${currentUploadFiles.length} file(s)...`;

        const formData = new FormData();
        currentUploadFiles.forEach(file => {
            formData.append('photos', file);
        });
        formData.append('channel', channelSelect.value);
        formData.append('uploader', uploaderSelect.value || 'Yash');

        try {
            uploadProgressBar.style.width = '70%';
            const res = await authFetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            uploadProgressBar.style.width = '100%';

            if (data.success) {
                showToast(`✅ Uploaded ${data.files.length} screenshot(s) by @${uploaderSelect.value}!`, 'success', 5000);
                appendTerminalLog(`\n[UPLOAD SUCCESS] ${data.message}`);

                // Render Upload Status Banner
                uploadStatusBanner.innerHTML = `
                    <div class="banner-header">
                        <span><i class="fa-solid fa-circle-check"></i> Upload Completed Successfully</span>
                        <span class="user-pill">@${uploaderSelect.value}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">${data.message}</p>
                    <div class="uploaded-thumbs-grid">
                        ${data.files.map(f => `<img src="${getAuthenticatedImageUrl(f.url)}" class="uploaded-thumb" title="${f.filename}">`).join('')}
                    </div>
                `;
                uploadStatusBanner.classList.remove('hidden');

                currentUploadFiles = [];
                filePreviewList.innerHTML = '';
                fileInput.value = '';
                loadStats();
                loadGallery(currentCategory);
            } else if (data.isDuplicate) {
                pendingDuplicateFormData = formData;
                if (duplicateFileList) {
                    duplicateFileList.innerHTML = (data.duplicates || []).map(d => `<div>• ${d}</div>`).join('');
                }
                duplicateModal?.classList.remove('modal-hidden');
                showToast('Duplicate screenshot detected!', 'info');
            } else {
                showToast(`Upload failed: ${data.error}`, 'error');
                appendTerminalLog(`\n[UPLOAD ERROR] ${data.error}`);
            }
        } catch (err) {
            console.error('Upload failed:', err);
            showToast(`Upload failed: ${err.message}`, 'error');
        } finally {
            submitUploadBtn.disabled = false;
            submitUploadBtn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload Raw Images`;
            setTimeout(() => {
                uploadProgressContainer.classList.add('hidden');
                uploadProgressBar.style.width = '0%';
            }, 800);
        }
    });

    // ---------------------------------------------------------
    // 6. OPEN FOLDERS & AUTO-ORGANIZER HANDLERS
    // ---------------------------------------------------------
    openFolderBtn.addEventListener('click', () => openFolderAction('RAW'));

    async function openFolderAction(folderName = 'RAW') {
        showToast(`📂 Opening ${folderName} organized folder...`, 'info');
        try {
            const res = await authFetch('/api/open-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folder: folderName })
            });
            const data = await res.json();
            if (data.message) {
                showToast(data.message, 'success');
            }
        } catch (err) {
            console.error('Open folder error:', err);
        }
        
        // Switch gallery to that category and scroll
        const tabToClick = document.querySelector(`.tab-btn[data-category="${folderName}"]`) || document.querySelector(`.tab-btn[data-category="ALL"]`);
        if (tabToClick) tabToClick.click();

        const gallerySection = document.getElementById('gallerySection');
        if (gallerySection) {
            gallerySection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    runScriptBtn.addEventListener('click', async () => {
        runScriptBtn.disabled = true;
        runScriptBtn.innerHTML = `<i class="fa-solid fa-gear fa-spin"></i> Organizing...`;
        scriptStatusBadge.textContent = 'Running';
        scriptStatusBadge.className = 'badge badge-purple';

        showToast('⚡ Auto-Organizer started! Categorizing screenshots...', 'info');
        appendTerminalLog(`\n> powershell -ExecutionPolicy Bypass -File organize_feedback.ps1\nExecuting auto-organizer backend script...`);

        try {
            const res = await authFetch('/api/run-organizer', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                scriptStatusBadge.textContent = 'Completed';
                scriptStatusBadge.className = 'badge badge-green';
                showToast('🎉 Feedback organized into APP, UI, BOTH & PROBLEMS folders!', 'success', 5000);
                appendTerminalLog(`\n${data.output}\n[DONE] Successfully categorized and organized images!`);
                loadStats();
                loadGallery(currentCategory);
            } else {
                scriptStatusBadge.textContent = 'Failed';
                scriptStatusBadge.className = 'badge badge-rose';
                showToast(`Auto-Organizer failed: ${data.error}`, 'error');
                appendTerminalLog(`\n[ERROR] ${data.error}\n${data.stderr || ''}`);
            }
        } catch (err) {
            console.error('Script execution error:', err);
            showToast('Auto-Organizer execution error', 'error');
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
    // 7. TAB FILTERS & SEARCH
    // ---------------------------------------------------------
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPage = 1;
            loadGallery(btn.dataset.category);
        });
    });

    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.dataset.cat;
            openFolderAction(cat);
        });
    });

    searchInput.addEventListener('input', () => {
        renderGallery(allImagesData);
    });

    // ---------------------------------------------------------
    // 8. LIGHTBOX MODAL
    // ---------------------------------------------------------
    window.openLightboxModal = function(info) {
        lightboxImg.src = getAuthenticatedImageUrl(info.url);
        lightboxTitle.textContent = info.name;
        lightboxCat.textContent = info.category;
        lightboxCat.className = `badge ${getBadgeClass(info.category)}`;
        lightboxFilename.textContent = info.name;
        lightboxSize.textContent = info.size;
        lightboxDate.textContent = info.date;
        lightboxDownload.href = getAuthenticatedImageUrl(info.url);

        if (lightboxUserMeta) {
            lightboxUserMeta.textContent = info.uploadedBy ? `@${info.uploadedBy}` : '@Yash';
        }

        lightbox.classList.remove('modal-hidden');
    };

    closeLightbox.addEventListener('click', () => {
        lightbox.classList.add('modal-hidden');
    });

    document.querySelectorAll('.lightbox-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            const parentModal = overlay.closest('.lightbox');
            if (parentModal) parentModal.classList.add('modal-hidden');
        });
    });

    cancelDuplicateBtn?.addEventListener('click', () => {
        duplicateModal?.classList.add('modal-hidden');
        pendingDuplicateFormData = null;
        showToast('Upload cancelled. Existing files preserved.', 'info');
    });

    confirmDuplicateBtn?.addEventListener('click', async () => {
        if (!pendingDuplicateFormData) return;
        duplicateModal?.classList.add('modal-hidden');
        pendingDuplicateFormData.append('forceUpload', 'true');

        submitUploadBtn.disabled = true;
        submitUploadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Overwriting...`;
        uploadProgressContainer.classList.remove('hidden');
        uploadProgressBar.style.width = '50%';

        try {
            const res = await authFetch('/api/upload', {
                method: 'POST',
                body: pendingDuplicateFormData
            });
            const data = await res.json();
            uploadProgressBar.style.width = '100%';

            if (data.success) {
                showToast(`✅ Uploaded ${data.files.length} screenshot(s) by @${uploaderSelect.value}!`, 'success', 5000);
                appendTerminalLog(`\n[UPLOAD SUCCESS] ${data.message}`);

                uploadStatusBanner.innerHTML = `
                    <div class="banner-header">
                        <span><i class="fa-solid fa-circle-check"></i> Upload Completed Successfully</span>
                        <span class="user-pill">@${uploaderSelect.value}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">${data.message}</p>
                    <div class="uploaded-thumbs-grid">
                        ${data.files.map(f => `<img src="${getAuthenticatedImageUrl(f.url)}" class="uploaded-thumb" title="${f.filename}">`).join('')}
                    </div>
                `;
                uploadStatusBanner.classList.remove('hidden');

                currentUploadFiles = [];
                filePreviewList.innerHTML = '';
                fileInput.value = '';
                loadStats();
                loadGallery(currentCategory);
            } else {
                showToast(`Upload failed: ${data.error}`, 'error');
            }
        } catch (err) {
            showToast(`Upload failed: ${err.message}`, 'error');
        } finally {
            pendingDuplicateFormData = null;
            submitUploadBtn.disabled = false;
            submitUploadBtn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload Raw Images`;
            setTimeout(() => uploadProgressContainer.classList.add('hidden'), 2000);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            lightbox.classList.add('modal-hidden');
            teamModal.classList.add('modal-hidden');
            deleteModal.classList.add('modal-hidden');
            duplicateModal?.classList.add('modal-hidden');
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
