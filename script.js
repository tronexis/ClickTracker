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
            ]
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
            sidebar: document.querySelector('.sidebar')
        };

        this.init();
    }

    init() {
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
    }

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
        
        // Display result
        this.showVerificationResult(isVerified, isSuspicious, {
            overallSimilarity,
            attempt3Deviation,
            similarity12: avgSimilarity12,
            similarity13: avgSimilarity13,
            similarity23: avgSimilarity23
        });
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
