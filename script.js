class BehavioralVerification {
    constructor() {
        this.state = {
            currentAttempt: 0, // 0 = not started, 1-3 = attempt number
            startTime: null,
            timerInterval: null,
            attempts: [
                { pattern: [], timings: [], clicks: 0, duration: 0 },
                { pattern: [], timings: [], clicks: 0, duration: 0 },
                { pattern: [], timings: [], clicks: 0, duration: 0 }
            ],
            isAuthenticated: false,
            isGuest: false,
            currentUser: null,
            sessionToken: null
        };

        this.elements = {
            // Status Section
            attemptTitle: document.getElementById('attempt-title'),
            attemptSubtitle: document.getElementById('attempt-subtitle'),
            btnStart: document.getElementById('btn-start'),
            
            // Interaction Zone
            interactionZone: document.getElementById('interaction-zone'),
            timer: document.getElementById('timer'),
            choiceBtns: document.querySelectorAll('.choice-btn'),
            btnComplete: document.getElementById('btn-complete'),
            
            // Attempt Cards
            attemptCards: {
                1: document.getElementById('attempt-card-1'),
                2: document.getElementById('attempt-card-2'),
                3: document.getElementById('attempt-card-3')
            },
            
            // Verification Result
            verificationResult: document.getElementById('verification-result'),
            resultIcon: document.getElementById('result-icon'),
            resultTitle: document.getElementById('result-title'),
            resultMessage: document.getElementById('result-message'),
            resultDetails: document.getElementById('result-details'),
            btnReset: document.getElementById('btn-reset'),
            
            // Mobile Menu
            mobileMenuBtn: document.getElementById('mobile-menu-btn'),
            sidebarOverlay: document.getElementById('sidebar-overlay'),
            sidebar: document.querySelector('.sidebar'),

            // Authentication Modal
            authModal: document.getElementById('auth-modal'),
            closeAuthModalBtns: document.querySelectorAll('.close-auth-modal'),
            authTabs: document.querySelectorAll('.auth-tab'),
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            
            // Login Form
            loginUsername: document.getElementById('login-username'),
            loginMessage: document.getElementById('login-message'),
            btnLogin: document.getElementById('btn-login'),
            btnGuestMode: document.getElementById('btn-guest-mode'),
            
            // Register Form
            registerUsername: document.getElementById('register-username'),
            registerMessage: document.getElementById('register-message'),
            btnRegister: document.getElementById('btn-register'),

            // User Profile Modal
            userProfileBtn: document.getElementById('user-profile-btn'),
            profileModal: document.getElementById('profile-modal'),
            profileAvatarLarge: document.getElementById('profile-avatar-large'),
            profileUsernameDisplay: document.getElementById('profile-username-display'),
            profileSinceDisplay: document.getElementById('profile-since-display'),
            btnLogout: document.getElementById('btn-logout'),
            closeModalBtns: document.querySelectorAll('.close-modal'),
            sidebarName: document.getElementById('sidebar-name'),
            sidebarId: document.getElementById('sidebar-id'),
            sidebarAvatar: document.getElementById('sidebar-avatar'),

            // History
            navHistory: document.getElementById('nav-history'),
            mobileNavHistory: document.getElementById('mobile-nav-history'),
            navHome: document.querySelector('.nav-item.active'), // Assuming first one is home initially
            mobileNavHome: document.getElementById('mobile-nav-home'),
            historySection: document.getElementById('history-section'),
            statusSection: document.querySelector('.status-section'),
            attemptsSummary: document.getElementById('attempts-summary'),
            historyList: document.getElementById('history-list'),
            btnClearHistory: document.getElementById('btn-clear-history')
        };

        this.init();
    }

    init() {
        // Check authentication status
        this.checkAuthStatus();

        // Start/Reset buttons
        this.elements.btnStart.addEventListener('click', () => this.startAttempt());
        this.elements.btnComplete.addEventListener('click', () => this.completeAttempt());
        this.elements.btnReset.addEventListener('click', () => this.resetAll());

        // Choice buttons
        this.elements.choiceBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleChoiceClick(e));
        });

        // Mobile menu
        if (this.elements.mobileMenuBtn) {
            this.elements.mobileMenuBtn.addEventListener('click', () => this.toggleSidebar());
        }
        if (this.elements.sidebarOverlay) {
            this.elements.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
        }

        // Authentication Events
        this.elements.authTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
        });
        this.elements.btnLogin.addEventListener('click', () => this.login());
        this.elements.btnRegister.addEventListener('click', () => this.register());
        this.elements.btnGuestMode.addEventListener('click', () => this.continueAsGuest());
        
        // Add Enter key support for login/register
        this.elements.loginUsername.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        this.elements.registerUsername.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.register();
        });

        // User Profile Events
        this.elements.userProfileBtn.addEventListener('click', () => this.openProfileModal());
        if (this.elements.btnLogout) {
            this.elements.btnLogout.addEventListener('click', () => this.logout());
        }
        this.elements.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeProfileModal());
        });

        // History Navigation
        this.elements.navHistory.addEventListener('click', (e) => {
            e.preventDefault();
            this.showHistory();
        });
        if (this.elements.mobileNavHistory) {
            this.elements.mobileNavHistory.addEventListener('click', (e) => {
                e.preventDefault();
                this.showHistory();
            });
        }

        // Home Navigation
        const homeHandler = (e) => {
            if (e) e.preventDefault();
            this.showHome();
        };
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.textContent.includes('Home')) {
                item.addEventListener('click', homeHandler);
            }
        });
        if (this.elements.mobileNavHome) {
            this.elements.mobileNavHome.addEventListener('click', homeHandler);
        }

        // Clear History
        if (this.elements.btnClearHistory) {
            this.elements.btnClearHistory.addEventListener('click', () => this.clearHistory());
        }
    }

    // --- Authentication Methods ---

    generateSessionToken() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    checkAuthStatus() {
        const session = localStorage.getItem('clickExp_session');
        if (session) {
            const sessionData = JSON.parse(session);
            const now = Date.now();
            
            // Check if session is still valid (24 hours)
            if (sessionData.expiry > now) {
                this.state.isAuthenticated = true;
                this.state.isGuest = sessionData.isGuest || false;
                this.state.currentUser = sessionData.user;
                this.state.sessionToken = sessionData.token;
                this.updateUserProfileUI();
                return;
            } else {
                // Session expired
                localStorage.removeItem('clickExp_session');
            }
        }
        
        // No valid session, show auth modal
        this.showAuthModal();
    }

    showAuthModal() {
        this.elements.authModal.style.display = 'flex';
        this.switchAuthTab('login');
    }

    closeAuthModal() {
        this.elements.authModal.style.display = 'none';
    }

    switchAuthTab(tab) {
        // Update tabs
        this.elements.authTabs.forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        
        // Show/hide forms
        if (tab === 'login') {
            this.elements.loginForm.style.display = 'flex';
            this.elements.registerForm.style.display = 'none';
            this.clearMessage('login');
        } else {
            this.elements.loginForm.style.display = 'none';
            this.elements.registerForm.style.display = 'flex';
            this.clearMessage('register');
        }
    }

    showMessage(type, message, isError = false) {
        const messageEl = type === 'login' ? this.elements.loginMessage : this.elements.registerMessage;
        messageEl.textContent = message;
        messageEl.className = 'form-message ' + (isError ? 'error' : 'success');
    }

    clearMessage(type) {
        const messageEl = type === 'login' ? this.elements.loginMessage : this.elements.registerMessage;
        messageEl.textContent = '';
        messageEl.className = 'form-message';
    }

    register() {
        const username = this.elements.registerUsername.value.trim();

        // Validation
        if (!username) {
            this.showMessage('register', 'Please enter a username', true);
            return;
        }

        if (username.length < 3) {
            this.showMessage('register', 'Username must be at least 3 characters', true);
            return;
        }

        // Check if username already exists
        const users = JSON.parse(localStorage.getItem('clickExp_users') || '{}');
        if (users[username.toLowerCase()]) {
            this.showMessage('register', 'Username already taken. Please choose another.', true);
            return;
        }

        // Create user
        const user = {
            username,
            registeredAt: Date.now()
        };

        // Save user
        users[username.toLowerCase()] = user;
        localStorage.setItem('clickExp_users', JSON.stringify(users));

        // Auto-login
        this.showMessage('register', 'Account created! Logging you in...', false);
        setTimeout(() => {
            this.createSession(user, false);
            this.closeAuthModal();
        }, 800);
    }

    login() {
        const username = this.elements.loginUsername.value.trim();

        // Validation
        if (!username) {
            this.showMessage('login', 'Please enter your username', true);
            return;
        }

        // Check credentials
        const users = JSON.parse(localStorage.getItem('clickExp_users') || '{}');
        const user = users[username.toLowerCase()];

        if (!user) {
            this.showMessage('login', 'Username not found', true);
            return;
        }

        // Login successful
        this.showMessage('login', 'Welcome back!', false);
        setTimeout(() => {
            this.createSession(user, false);
            this.closeAuthModal();
        }, 500);
    }

    continueAsGuest() {
        const guestUser = {
            username: 'Guest',
            registeredAt: Date.now()
        };
        this.createSession(guestUser, true);
        this.closeAuthModal();
    }

    createSession(user, isGuest = false) {
        const token = this.generateSessionToken();
        const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

        const session = {
            user: { username: user.username, registeredAt: user.registeredAt },
            token,
            expiry,
            isGuest
        };

        localStorage.setItem('clickExp_session', JSON.stringify(session));
        
        this.state.isAuthenticated = true;
        this.state.isGuest = isGuest;
        this.state.currentUser = session.user;
        this.state.sessionToken = token;
        
        this.updateUserProfileUI();
    }

    updateUserProfileUI() {
        if (!this.state.currentUser) return;
        
        const username = this.state.currentUser.username;
        
        // Update sidebar
        this.elements.sidebarName.textContent = username;
        this.elements.sidebarId.textContent = this.state.isGuest ? 'Guest' : '@' + username.toLowerCase();
        this.elements.sidebarAvatar.textContent = username.charAt(0).toUpperCase();
        
        // Update profile modal
        if (this.elements.profileAvatarLarge) {
            this.elements.profileAvatarLarge.textContent = username.charAt(0).toUpperCase();
        }
        if (this.elements.profileUsernameDisplay) {
            this.elements.profileUsernameDisplay.textContent = '@' + username.toLowerCase();
        }
        if (this.elements.profileSinceDisplay && this.state.currentUser.registeredAt) {
            const date = new Date(this.state.currentUser.registeredAt);
            this.elements.profileSinceDisplay.textContent = date.toLocaleDateString();
        }
    }

    openProfileModal() {
        if (!this.state.isAuthenticated) {
            this.showAuthModal();
            return;
        }
        this.elements.profileModal.style.display = 'flex';
    }

    closeProfileModal() {
        this.elements.profileModal.style.display = 'none';
    }

    logout() {
        const message = this.state.isGuest 
            ? 'Are you sure you want to logout?' 
            : 'Are you sure you want to logout? Your verification history will be preserved.';
            
        if (confirm(message)) {
            // Clear session
            localStorage.removeItem('clickExp_session');
            
            // If guest, clear their history too
            if (this.state.isGuest) {
                localStorage.removeItem('clickExp_history');
            }
            
            // Reset state
            this.state.isAuthenticated = false;
            this.state.isGuest = false;
            this.state.currentUser = null;
            this.state.sessionToken = null;
            
            // Close modals
            this.closeProfileModal();
            
            // Reset verification state
            this.resetAll();
            
            // Show auth modal
            this.showAuthModal();
        }
    }

    // --- History Methods ---

    showHistory() {
        // Hide Verification Views
        this.elements.statusSection.style.display = 'none';
        this.elements.interactionZone.style.display = 'none';
        this.elements.attemptsSummary.style.display = 'none';
        this.elements.verificationResult.style.display = 'none';
        
        // Show History View
        this.elements.historySection.style.display = 'block';
        
        // Update Nav State
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        this.elements.navHistory.classList.add('active');
        
        document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
        if (this.elements.mobileNavHistory) this.elements.mobileNavHistory.classList.add('active');

        this.renderHistoryList();
        this.closeSidebar(); // For mobile
    }

    showHome() {
        // Show Verification Views
        this.elements.statusSection.style.display = 'flex'; // status-section is flex
        this.elements.attemptsSummary.style.display = 'block';
        
        // Restore state of interaction zone / result based on current flow
        if (this.state.currentAttempt > 0 && this.state.currentAttempt <= 3 && this.elements.verificationResult.style.display !== 'block') {
             this.elements.interactionZone.style.display = 'block';
        } else if (this.elements.verificationResult.style.display === 'block') {
             // Keep result visible
        } else {
             this.elements.interactionZone.style.display = 'none';
        }

        // Hide History View
        this.elements.historySection.style.display = 'none';

        // Update Nav State
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        // Find home nav item again to be safe
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.textContent.includes('Home')) item.classList.add('active');
        });

        document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
        if (this.elements.mobileNavHome) this.elements.mobileNavHome.classList.add('active');
        
        this.closeSidebar(); // For mobile
    }

    renderHistoryList() {
        const history = JSON.parse(localStorage.getItem('clickExp_history') || '[]');
        const listContainer = this.elements.historyList;
        listContainer.innerHTML = '';

        if (history.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-history">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    <p>No verification history found</p>
                </div>
            `;
            return;
        }

        // Sort by newest first
        history.reverse().forEach(record => {
            const date = new Date(record.timestamp);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            const statusClass = record.isVerified ? 'verified' : (record.isSuspicious ? 'suspicious' : 'warning');
            const statusIcon = record.isVerified ? 'fa-circle-check' : (record.isSuspicious ? 'fa-triangle-exclamation' : 'fa-clipboard-question');
            const statusText = record.isVerified ? 'Verified' : (record.isSuspicious ? 'Suspicious' : 'Inconclusive');

            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-icon ${statusClass}">
                    <i class="fa-solid ${statusIcon}"></i>
                </div>
                <div class="history-info">
                    <div class="history-header">
                        <span class="history-status ${statusClass}">${statusText}</span>
                        <span class="history-date">${dateStr}</span>
                    </div>
                    <div class="history-user">@${record.user.username}</div>
                    <div class="history-stats">
                        <span>Similarity: ${(record.stats.overallSimilarity * 100).toFixed(1)}%</span>
                        <span>•</span>
                        <span>Avg Speed: ${record.avgSpeed.toFixed(2)}s</span>
                    </div>
                </div>
            `;
            listContainer.appendChild(item);
        });
    }

    saveVerificationResult(isVerified, isSuspicious, stats) {
        const history = JSON.parse(localStorage.getItem('clickExp_history') || '[]');
        
        // Calculate average speed across all attempts
        let totalDuration = 0;
        let totalClicks = 0;
        this.state.attempts.forEach(a => {
            totalDuration += a.duration;
            totalClicks += a.clicks;
        });
        const avgSpeed = totalClicks > 0 ? totalDuration / totalClicks : 0;

        const record = {
            id: Date.now(),
            timestamp: Date.now(),
            user: this.state.currentUser,
            isVerified,
            isSuspicious,
            stats,
            avgSpeed
        };

        history.push(record);
        localStorage.setItem('clickExp_history', JSON.stringify(history));
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all verification history?')) {
            localStorage.removeItem('clickExp_history');
            this.renderHistoryList();
        }
    }

    // --- Existing Methods (Modified) ---

    toggleSidebar() {
        this.elements.sidebar.classList.toggle('active');
        this.elements.sidebarOverlay.classList.toggle('active');
        document.body.style.overflow = this.elements.sidebar.classList.contains('active') ? 'hidden' : '';
    }

    closeSidebar() {
        this.elements.sidebar.classList.remove('active');
        this.elements.sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    startAttempt() {
        // Require authentication
        if (!this.state.isAuthenticated) {
            this.showAuthModal();
            return;
        }
        
        this.state.currentAttempt++;
        
        if (this.state.currentAttempt > 3) {
            return;
        }

        // Reset current attempt data
        const attemptIndex = this.state.currentAttempt - 1;
        this.state.attempts[attemptIndex] = {
            pattern: [],
            timings: [],
            clicks: 0,
            duration: 0
        };

        // Update UI
        this.updateStatusSection();
        this.showInteractionZone();
        this.updateAttemptCard(this.state.currentAttempt, 'in-progress');
        
        // Start timer
        this.state.startTime = Date.now();
        this.startTimer();
        
        // Reset choice buttons
        this.elements.choiceBtns.forEach(btn => btn.classList.remove('clicked'));
    }

    startTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
        }

        this.state.timerInterval = setInterval(() => {
            const elapsed = (Date.now() - this.state.startTime) / 1000;
            this.elements.timer.textContent = elapsed.toFixed(2) + 's';
        }, 50);
    }

    stopTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
    }

    handleChoiceClick(e) {
        if (this.state.currentAttempt === 0 || this.state.currentAttempt > 3) {
            return;
        }

        const btn = e.target.closest('.choice-btn');
        const buttonId = btn.dataset.id;
        const timestamp = Date.now();
        const relativeTime = (timestamp - this.state.startTime) / 1000;

        // Visual feedback
        btn.classList.add('clicked');
        setTimeout(() => btn.classList.remove('clicked'), 300);

        // Record click
        const attemptIndex = this.state.currentAttempt - 1;
        this.state.attempts[attemptIndex].pattern.push(buttonId);
        this.state.attempts[attemptIndex].timings.push(relativeTime);
        this.state.attempts[attemptIndex].clicks++;

        // Show complete button after first click
        if (this.state.attempts[attemptIndex].clicks === 1) {
            this.elements.btnComplete.style.display = 'inline-flex';
        }
    }

    completeAttempt() {
        if (this.state.currentAttempt === 0 || this.state.currentAttempt > 3) {
            return;
        }

        const attemptIndex = this.state.currentAttempt - 1;
        
        // Make sure at least one click was made
        if (this.state.attempts[attemptIndex].clicks === 0) {
            alert('Please make at least one selection before completing the attempt.');
            return;
        }

        // Calculate duration
        this.stopTimer();
        this.state.attempts[attemptIndex].duration = (Date.now() - this.state.startTime) / 1000;

        // Update attempt card
        this.updateAttemptCard(this.state.currentAttempt, 'completed');
        this.populateAttemptData(this.state.currentAttempt);

        // Hide interaction zone
        this.hideInteractionZone();

        // Check if all 3 attempts are complete
        if (this.state.currentAttempt === 3) {
            this.performVerification();
        } else {
            // Prepare for next attempt
            this.updateStatusSection();
        }
    }

    updateStatusSection() {
        if (this.state.currentAttempt === 0) {
            this.elements.attemptTitle.textContent = 'Ready to Start';
            this.elements.attemptSubtitle.textContent = 'Click "Start Verification" to begin Attempt 1 of 3';
            this.elements.btnStart.innerHTML = '<span class="btn-icon"><i class="fa-solid fa-play"></i></span><span>Start Verification</span>';
            this.elements.btnStart.style.display = 'inline-flex';
        } else if (this.state.currentAttempt < 3) {
            this.elements.attemptTitle.textContent = `Attempt ${this.state.currentAttempt} Complete`;
            this.elements.attemptSubtitle.textContent = `Ready to begin Attempt ${this.state.currentAttempt + 1} of 3`;
            this.elements.btnStart.innerHTML = `<span class="btn-icon"><i class="fa-solid fa-play"></i></span><span>Start Attempt ${this.state.currentAttempt + 1}</span>`;
            this.elements.btnStart.style.display = 'inline-flex';
        } else {
            this.elements.btnStart.style.display = 'none';
        }
    }

    showInteractionZone() {
        this.elements.interactionZone.style.display = 'block';
        this.elements.btnStart.style.display = 'none';
        this.elements.btnComplete.style.display = 'none';
        this.elements.timer.textContent = '0.00s';
    }

    hideInteractionZone() {
        this.elements.interactionZone.style.display = 'none';
    }

    updateAttemptCard(attemptNum, status) {
        const card = this.elements.attemptCards[attemptNum];
        const statusBadge = card.querySelector('.attempt-status');
        
        // Remove all active classes
        Object.values(this.elements.attemptCards).forEach(c => c.classList.remove('active'));
        
        // Update status
        statusBadge.className = 'attempt-status ' + status;
        statusBadge.textContent = status.replace('-', ' ');
        
        // Add active class if in progress
        if (status === 'in-progress') {
            card.classList.add('active');
        }
    }

    populateAttemptData(attemptNum) {
        const attemptIndex = attemptNum - 1;
        const attempt = this.state.attempts[attemptIndex];
        
        const card = this.elements.attemptCards[attemptNum];
        const emptyState = card.querySelector('.empty-state');
        const attemptData = card.querySelector('.attempt-data');
        
        // Hide empty state, show data
        emptyState.style.display = 'none';
        attemptData.style.display = 'flex';
        
        // Populate data
        const pattern = attempt.pattern.join(' → ');
        const avgSpeed = attempt.clicks > 0 ? (attempt.duration / attempt.clicks).toFixed(2) : '0.00';
        
        document.getElementById(`pattern-${attemptNum}`).textContent = pattern || '-';
        document.getElementById(`clicks-${attemptNum}`).textContent = attempt.clicks;
        document.getElementById(`duration-${attemptNum}`).textContent = attempt.duration.toFixed(2) + 's';
        document.getElementById(`speed-${attemptNum}`).textContent = avgSpeed + 's';
    }

    performVerification() {
        // Calculate similarity between attempts
        const similarity12 = this.calculateSimilarity(this.state.attempts[0], this.state.attempts[1]);
        const similarity13 = this.calculateSimilarity(this.state.attempts[0], this.state.attempts[2]);
        const similarity23 = this.calculateSimilarity(this.state.attempts[1], this.state.attempts[2]);
        
        const avgSimilarity12 = (similarity12.pattern + similarity12.timing) / 2;
        const avgSimilarity13 = (similarity13.pattern + similarity13.timing) / 2;
        const avgSimilarity23 = (similarity23.pattern + similarity23.timing) / 2;
        
        // Overall average similarity
        const overallSimilarity = (avgSimilarity12 + avgSimilarity13 + avgSimilarity23) / 3;
        
        // Check if attempt 3 is significantly different
        const attempt3Deviation = ((avgSimilarity13 + avgSimilarity23) / 2);
        
        // Verification logic
        let isVerified = false;
        let isSuspicious = false;
        let resultMessage = '';
        
        if (overallSimilarity >= 0.8) {
            // All attempts are very similar
            isVerified = true;
            resultMessage = 'All three attempts show consistent behavior patterns. Your identity has been successfully verified.';
        } else if (attempt3Deviation < 0.6) {
            // Attempt 3 is significantly different
            isSuspicious = true;
            resultMessage = 'Attempt 3 shows significant deviation from the first two attempts. This may indicate suspicious behavior.';
        } else {
            // Moderate similarity
            resultMessage = 'Your attempts show moderate consistency. Additional verification may be required.';
        }
        
        const stats = {
            overallSimilarity,
            attempt3Deviation,
            similarity12: avgSimilarity12,
            similarity13: avgSimilarity13,
            similarity23: avgSimilarity23
        };

        // Save result to history
        this.saveVerificationResult(isVerified, isSuspicious, stats);

        // Display result
        this.showVerificationResult(isVerified, isSuspicious, stats);
    }

    calculateSimilarity(attempt1, attempt2) {
        // Pattern similarity (sequence match)
        let patternSimilarity = 0;
        if (attempt1.pattern.length > 0 && attempt2.pattern.length > 0) {
            const minLength = Math.min(attempt1.pattern.length, attempt2.pattern.length);
            let matches = 0;
            
            for (let i = 0; i < minLength; i++) {
                if (attempt1.pattern[i] === attempt2.pattern[i]) {
                    matches++;
                }
            }
            
            // Penalize length differences
            const lengthPenalty = Math.abs(attempt1.pattern.length - attempt2.pattern.length) * 0.1;
            patternSimilarity = (matches / Math.max(attempt1.pattern.length, attempt2.pattern.length)) - lengthPenalty;
            patternSimilarity = Math.max(0, Math.min(1, patternSimilarity));
        }
        
        // Timing similarity (response speed consistency)
        let timingSimilarity = 0;
        if (attempt1.clicks > 0 && attempt2.clicks > 0) {
            const avgSpeed1 = attempt1.duration / attempt1.clicks;
            const avgSpeed2 = attempt2.duration / attempt2.clicks;
            const speedDiff = Math.abs(avgSpeed1 - avgSpeed2);
            
            // Normalize timing similarity (assuming speeds within 0.5s are very similar)
            timingSimilarity = Math.max(0, 1 - (speedDiff / 0.5));
        }
        
        return {
            pattern: patternSimilarity,
            timing: timingSimilarity
        };
    }

    showVerificationResult(isVerified, isSuspicious, stats) {
        // Update status section
        this.elements.attemptTitle.textContent = 'Verification Complete';
        this.elements.attemptSubtitle.textContent = 'Analysis of all three attempts has been completed';
        
        // Show result section
        this.elements.verificationResult.style.display = 'block';
        
        // Update result icon and message
        if (isVerified) {
            this.elements.resultIcon.className = 'result-icon verified';
            this.elements.resultIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
            this.elements.resultTitle.textContent = 'User Verified';
            this.elements.resultTitle.style.color = 'var(--success-green)';
            this.elements.resultMessage.textContent = 'All three attempts show consistent behavior patterns. Your identity has been successfully verified.';
        } else if (isSuspicious) {
            this.elements.resultIcon.className = 'result-icon suspicious';
            this.elements.resultIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            this.elements.resultTitle.textContent = 'Suspicious Behavior Detected';
            this.elements.resultTitle.style.color = 'var(--alert-red)';
            this.elements.resultMessage.textContent = 'Attempt 3 shows significant deviation from the first two attempts. This may indicate suspicious behavior.';
        } else {
            this.elements.resultIcon.className = 'result-icon';
            this.elements.resultIcon.innerHTML = '<i class="fa-solid fa-clipboard-question"></i>';
            this.elements.resultTitle.textContent = 'Additional Verification Required';
            this.elements.resultTitle.style.color = 'var(--warning-orange)';
            this.elements.resultMessage.textContent = 'Your attempts show moderate consistency. Additional verification may be required.';
        }
        
        // Populate detailed statistics
        let detailsHTML = '';
        
        detailsHTML += `
            <div class="result-stat">
                <span class="stat-label">Overall Similarity</span>
                <span class="stat-value">${(stats.overallSimilarity * 100).toFixed(1)}%</span>
            </div>
            <div class="result-stat">
                <span class="stat-label">Attempt 1 vs 2</span>
                <span class="stat-value">${(stats.similarity12 * 100).toFixed(1)}%</span>
            </div>
            <div class="result-stat">
                <span class="stat-label">Attempt 1 vs 3</span>
                <span class="stat-value">${(stats.similarity13 * 100).toFixed(1)}%</span>
            </div>
            <div class="result-stat">
                <span class="stat-label">Attempt 2 vs 3</span>
                <span class="stat-value">${(stats.similarity23 * 100).toFixed(1)}%</span>
            </div>
            <div class="result-stat">
                <span class="stat-label">Attempt 3 Consistency</span>
                <span class="stat-value">${(stats.attempt3Deviation * 100).toFixed(1)}%</span>
            </div>
        `;
        
        this.elements.resultDetails.innerHTML = detailsHTML;
        
        // Scroll to result
        this.elements.verificationResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    resetAll() {
        // Reset state
        this.state.currentAttempt = 0;
        this.state.startTime = null;
        this.state.attempts = [
            { pattern: [], timings: [], clicks: 0, duration: 0 },
            { pattern: [], timings: [], clicks: 0, duration: 0 },
            { pattern: [], timings: [], clicks: 0, duration: 0 }
        ];
        
        this.stopTimer();
        
        // Reset UI
        this.updateStatusSection();
        this.hideInteractionZone();
        this.elements.verificationResult.style.display = 'none';
        
        // Reset attempt cards
        for (let i = 1; i <= 3; i++) {
            const card = this.elements.attemptCards[i];
            card.classList.remove('active');
            
            const statusBadge = card.querySelector('.attempt-status');
            statusBadge.className = 'attempt-status pending';
            statusBadge.textContent = 'Pending';
            
            const emptyState = card.querySelector('.empty-state');
            const attemptData = card.querySelector('.attempt-data');
            emptyState.style.display = 'block';
            attemptData.style.display = 'none';
        }
        
        // Reset buttons
        this.elements.choiceBtns.forEach(btn => btn.classList.remove('clicked'));
        this.elements.btnStart.style.display = 'inline-flex';
        this.elements.btnComplete.style.display = 'none';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new BehavioralVerification();
});
