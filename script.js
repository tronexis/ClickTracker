class ClickTracker {
    constructor() {
        this.state = {
            activeSession: null, // 'A' or 'B' or null
            startTime: null,
            data: {
                A: [],
                B: []
            },
            timerInterval: null
        };

        this.elements = {
            btnStartA: document.getElementById('btn-start-a'),
            btnStartB: document.getElementById('btn-start-b'),
            btnStop: document.getElementById('btn-stop'),
            btnReset: document.getElementById('btn-reset'),
            btnCompare: document.getElementById('btn-compare'),
            statusBadge: document.getElementById('status-badge'),
            timer: document.getElementById('timer'),
            gridBtns: document.querySelectorAll('.grid-btn'),
            logA: document.getElementById('log-a'),
            logB: document.getElementById('log-b'),
            emptyA: document.getElementById('empty-a'),
            emptyB: document.getElementById('empty-b'),
            countA: document.getElementById('count-a'),
            countB: document.getElementById('count-b'),
            results: document.getElementById('comparison-results')
        };

        this.init();
    }

    init() {
        this.elements.btnStartA.addEventListener('click', () => this.startSession('A'));
        this.elements.btnStartB.addEventListener('click', () => this.startSession('B'));
        this.elements.btnStop.addEventListener('click', () => this.stopSession());
        this.elements.btnReset.addEventListener('click', () => this.resetAll());
        this.elements.btnCompare.addEventListener('click', () => this.compareSessions());

        this.elements.gridBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleGridClick(e));
        });
    }

    startSession(sessionName) {
        if (this.state.activeSession) {
            this.stopSession();
        }

        this.state.activeSession = sessionName;
        this.state.startTime = Date.now();
        this.state.data[sessionName] = []; // Reset data for this session
        
        // Update UI
        this.updateStatus(`Recording Session ${sessionName}...`, sessionName);
        this.clearLog(sessionName);
        this.updateCount(sessionName, 0);
        
        // Update button states
        this.elements.btnStartA.style.display = 'none';
        this.elements.btnStartB.style.display = 'none';
        this.elements.btnStop.style.display = 'inline-flex';
        
        // Start Timer
        if (this.state.timerInterval) clearInterval(this.state.timerInterval);
        this.state.timerInterval = setInterval(() => {
            const elapsed = (Date.now() - this.state.startTime) / 1000;
            this.elements.timer.textContent = elapsed.toFixed(2) + 's';
        }, 50);
    }

    stopSession() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
        this.state.activeSession = null;
        this.updateStatus('Ready');
        
        // Reset button states
        this.elements.btnStartA.style.display = 'inline-flex';
        this.elements.btnStartB.style.display = 'inline-flex';
        this.elements.btnStop.style.display = 'none';
    }

    handleGridClick(e) {
        if (!this.state.activeSession) return;

        const btn = e.target;
        const btnId = btn.dataset.id;
        const timestamp = Date.now();
        const relativeTime = (timestamp - this.state.startTime) / 1000;

        // Visual feedback
        btn.classList.add('clicked');
        setTimeout(() => btn.classList.remove('clicked'), 300);

        const record = {
            id: btnId,
            time: relativeTime
        };

        this.state.data[this.state.activeSession].push(record);
        this.addLogEntry(this.state.activeSession, record);
        this.updateCount(this.state.activeSession, this.state.data[this.state.activeSession].length);
    }

    addLogEntry(session, record) {
        const li = document.createElement('li');
        li.className = 'log-item';
        li.innerHTML = `
            <span>Button ${record.id}</span>
            <span class="log-time">${record.time.toFixed(3)}s</span>
        `;
        
        const logContainer = session === 'A' ? this.elements.logA : this.elements.logB;
        const emptyState = session === 'A' ? this.elements.emptyA : this.elements.emptyB;
        
        // Hide empty state when first item is added
        if (logContainer.children.length === 0) {
            emptyState.classList.add('hidden');
        }
        
        logContainer.appendChild(li);
        
        // Auto-scroll
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    clearLog(session) {
        const container = session === 'A' ? this.elements.logA : this.elements.logB;
        const emptyState = session === 'A' ? this.elements.emptyA : this.elements.emptyB;
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
    }

    resetAll() {
        this.stopSession();
        this.state.data.A = [];
        this.state.data.B = [];
        this.clearLog('A');
        this.clearLog('B');
        this.updateCount('A', 0);
        this.updateCount('B', 0);
        this.elements.timer.textContent = '0.00s';
        this.elements.results.innerHTML = '';
        this.elements.results.classList.remove('visible');
        this.updateStatus('Ready');
    }

    updateStatus(text, session = null) {
        this.elements.statusBadge.textContent = text;
        
        // Remove all recording classes
        this.elements.statusBadge.classList.remove('recording-a', 'recording-b');
        
        // Add appropriate class if recording
        if (session === 'A') {
            this.elements.statusBadge.classList.add('recording-a');
        } else if (session === 'B') {
            this.elements.statusBadge.classList.add('recording-b');
        }
    }

    updateCount(session, count) {
        const countElement = session === 'A' ? this.elements.countA : this.elements.countB;
        countElement.textContent = `${count} click${count !== 1 ? 's' : ''}`;
    }

    compareSessions() {
        this.stopSession(); // Ensure we aren't recording
        
        // Show the results box
        this.elements.results.classList.add('visible');
        
        const dataA = this.state.data.A;
        const dataB = this.state.data.B;

        if (dataA.length === 0 && dataB.length === 0) {
            this.elements.results.innerHTML = `
                <div class="empty-comparison">
                    <span class="empty-icon"><i class="fa-solid fa-chart-simple"></i></span>
                    <p>No data to compare. Record both sessions first.</p>
                </div>
            `;
            return;
        }

        if (dataA.length === 0 || dataB.length === 0) {
            const missing = dataA.length === 0 ? 'A' : 'B';
            this.elements.results.innerHTML = `
                <div class="empty-comparison">
                    <span class="empty-icon"><i class="fa-solid fa-triangle-exclamation"></i></span>
                    <p>Session ${missing} has no data. Record both sessions to compare.</p>
                </div>
            `;
            return;
        }

        // Calculate statistics
        const stats = this.calculateStatistics(dataA, dataB);
        
        let html = '<div class="comparison-container">';
        
        // Statistics Cards
        html += '<div class="stats-grid">';
        
        // Accuracy Card
        const accuracyPercent = ((stats.matches / stats.minLength) * 100).toFixed(1);
        html += `
            <div class="stat-card ${stats.matches === stats.minLength ? 'success' : 'warning'}">
                <div class="stat-icon">${stats.matches === stats.minLength ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-triangle-exclamation"></i>'}</div>
                <div class="stat-content">
                    <div class="stat-label">Sequence Accuracy</div>
                    <div class="stat-value">${accuracyPercent}%</div>
                    <div class="stat-detail">${stats.matches}/${stats.minLength} matches</div>
                </div>
            </div>
        `;
        
        // Timing Card
        const avgTimeDiff = stats.totalTimeDiff / stats.minLength;
        html += `
            <div class="stat-card">
                <div class="stat-icon"><i class="fa-solid fa-stopwatch"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Avg Time Difference</div>
                    <div class="stat-value">${avgTimeDiff.toFixed(3)}s</div>
                    <div class="stat-detail">Total: ${stats.totalTimeDiff.toFixed(3)}s</div>
                </div>
            </div>
        `;
        
        // Duration Card
        html += `
            <div class="stat-card">
                <div class="stat-icon"><i class="fa-solid fa-ruler"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Session Lengths</div>
                    <div class="stat-value">${dataA.length} vs ${dataB.length}</div>
                    <div class="stat-detail">${stats.lengthMatch ? 'Equal length' : `Diff: ${Math.abs(dataA.length - dataB.length)}`}</div>
                </div>
            </div>
        `;
        
        // Speed Card
        const speedA = dataA.length > 0 ? dataA[dataA.length - 1].time : 0;
        const speedB = dataB.length > 0 ? dataB[dataB.length - 1].time : 0;
        const faster = speedA < speedB ? 'A' : 'B';
        const speedDiff = Math.abs(speedA - speedB).toFixed(3);
        html += `
            <div class="stat-card">
                <div class="stat-icon"><i class="fa-solid fa-rocket"></i></div>
                <div class="stat-content">
                    <div class="stat-label">Completion Time</div>
                    <div class="stat-value">${speedA.toFixed(2)}s vs ${speedB.toFixed(2)}s</div>
                    <div class="stat-detail">Session ${faster} faster by ${speedDiff}s</div>
                </div>
            </div>
        `;
        
        html += '</div>'; // End stats-grid
        
        // Detailed Comparison
        html += '<div class="comparison-details">';
        html += '<h4>Step-by-Step Comparison</h4>';
        html += '<div class="comparison-list">';
        
        const maxLen = Math.max(dataA.length, dataB.length);
        
        for (let i = 0; i < maxLen; i++) {
            const itemA = dataA[i];
            const itemB = dataB[i];
            
            if (!itemA || !itemB) {
                // One session has more clicks
                const extra = itemA || itemB;
                const session = itemA ? 'A' : 'B';
                html += `
                    <div class="comparison-row extra">
                        <div class="step-number">${i + 1}</div>
                        <div class="comparison-content">
                            <div class="comparison-buttons">
                                <span class="btn-display ${itemA ? '' : 'missing'}">
                                    ${itemA ? `Button ${itemA.id}` : '—'}
                                </span>
                                <span class="vs">vs</span>
                                <span class="btn-display ${itemB ? '' : 'missing'}">
                                    ${itemB ? `Button ${itemB.id}` : '—'}
                                </span>
                            </div>
                            <div class="timing-info">
                                <span class="extra-label">Extra click in Session ${session}</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                const match = itemA.id === itemB.id;
                const timeDiff = Math.abs(itemA.time - itemB.time);
                
                html += `
                    <div class="comparison-row ${match ? 'match' : 'mismatch'}">
                        <div class="step-number">${i + 1}</div>
                        <div class="comparison-content">
                            <div class="comparison-buttons">
                                <span class="btn-display">${itemA.id}</span>
                                <span class="vs">vs</span>
                                <span class="btn-display">${itemB.id}</span>
                            </div>
                            <div class="timing-info">
                                <div class="time-values">
                                    <span>${itemA.time.toFixed(3)}s</span>
                                    <span class="time-diff">Δ ${timeDiff.toFixed(3)}s</span>
                                    <span>${itemB.time.toFixed(3)}s</span>
                                </div>
                                ${match ? 
                                    '<span class="match-badge"><i class="fa-solid fa-check"></i> Match</span>' : 
                                    '<span class="mismatch-badge"><i class="fa-solid fa-xmark"></i> Mismatch</span>'
                                }
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        html += '</div>'; // End comparison-list
        html += '</div>'; // End comparison-details
        
        // Summary
        html += '<div class="comparison-summary">';
        if (stats.lengthMatch && stats.matches === stats.minLength) {
            html += `
                <div class="summary-message success">
                    <span class="summary-icon"><i class="fa-solid fa-check-double"></i></span>
                    <div>
                        <strong>Perfect Match!</strong>
                        <p>Both sessions have identical sequences with an average timing difference of ${avgTimeDiff.toFixed(3)}s per click.</p>
                    </div>
                </div>
            `;
        } else {
            const issues = [];
            if (!stats.lengthMatch) issues.push(`${Math.abs(dataA.length - dataB.length)} length difference`);
            if (stats.mismatches > 0) issues.push(`${stats.mismatches} sequence mismatch${stats.mismatches > 1 ? 'es' : ''}`);
            
            html += `
                <div class="summary-message warning">
                    <span class="summary-icon"><i class="fa-solid fa-clipboard-list"></i></span>
                    <div>
                        <strong>Differences Found</strong>
                        <p>${issues.join(', ')}</p>
                    </div>
                </div>
            `;
        }
        html += '</div>'; // End comparison-summary
        
        html += '</div>'; // End comparison-container

        this.elements.results.innerHTML = html;
    }

    calculateStatistics(dataA, dataB) {
        const minLength = Math.min(dataA.length, dataB.length);
        let matches = 0;
        let mismatches = 0;
        let totalTimeDiff = 0;

        for (let i = 0; i < minLength; i++) {
            if (dataA[i].id === dataB[i].id) {
                matches++;
            } else {
                mismatches++;
            }
            totalTimeDiff += Math.abs(dataA[i].time - dataB[i].time);
        }

        return {
            matches,
            mismatches,
            minLength,
            lengthMatch: dataA.length === dataB.length,
            totalTimeDiff
        };
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ClickTracker();
});
