/** NJ Mastery Suite – Multi-User Engine + Working TestNav Toolbar
 *  DB loaded from math_questions.js + questions.js
 */

const TIMING = { math: 3600, ela: 4500, chinese: 1200 };
const subjectNames = { math: 'Mathematics', ela: 'English Language Arts', chinese: 'Chinese (Grade 2)' };

/* ── USER MANAGEMENT ── */
const users = {
    list() { return JSON.parse(localStorage.getItem('nj_users') || '[]'); },
    save(arr) { localStorage.setItem('nj_users', JSON.stringify(arr)); },
    add(name, pin) {
        const arr = this.list();
        if (!arr.find(u => u.name === name)) {
            arr.push({ name, pin, created: Date.now() });
            this.save(arr);
        }
    },
    remove(name) { this.save(this.list().filter(u => u.name !== name)); localStorage.removeItem(`nj_wrongBook_${name}`); localStorage.removeItem(`nj_scores_${name}`); },
    getWrongBook(name) { return JSON.parse(localStorage.getItem(`nj_wrongBook_${name}`) || '[]'); },
    saveWrongBook(name, wb) { localStorage.setItem(`nj_wrongBook_${name}`, JSON.stringify(wb)); },
    getScores(name) { return JSON.parse(localStorage.getItem(`nj_scores_${name}`) || '[]'); },
    addScore(name, record) { const s = this.getScores(name); s.push(record); localStorage.setItem(`nj_scores_${name}`, JSON.stringify(s)); },
    verify(name, pin) {
        const user = this.list().find(u => u.name === name);
        return user && user.pin === pin;
    }
};

/* ── STATE ── */
let state = {
    user: null,          // {name}
    subject: 'math',
    set: 'set1',
    mode: 'practice',
    currentIdx: 0,
    answers: [],
    wrongBook: [],
    timeLeft: 3600,
    timerInterval: null,
    zoom: 0,             // 0,1,2,3
    highlightMode: false,
    lineReaderOn: false,
    elimMode: false
};

/* ── TOOLBAR ── */
// ... (toolbar object remains same, I'll use multi_replace if needed, but for now I'll use replace_file_content to cover the login block)
// I'll skip to line 107 to replace the app object/login methods
const app = {
    init() { this.showLogin(); },

    /* ────────────── LOGIN ────────────── */
    showLogin() {
        document.body.style.overflow = 'auto';
        const userList = users.list();
        document.getElementById('app').innerHTML = `
        <div class="login-screen">
            <div class="login-box animate-in">
                <img src="https://www.njsba.org/wp-content/uploads/2017/11/NJ-LOGO-RGB.png" alt="NJ" style="height:48px;margin-bottom:1rem;object-fit:contain;" onerror="this.style.display='none'">
                <h2>NJSLA Mastery Suite</h2>
                <p>Secure Student Login</p>
                
                ${userList.length > 0 ? `
                <div class="user-list">
                    ${userList.map(u => `
                        <div class="user-item" onclick="app.requestPIN('${u.name}')">
                            <div class="user-item-name">👤 ${u.name}</div>
                            <button class="user-delete" onclick="event.stopPropagation();app.deleteUser('${u.name}')">✕</button>
                        </div>`).join('')}
                </div>
                <div style="margin:1rem 0;color:#888;font-size:.8rem;">— or create new —</div>` : ''}

                <div id="login-form">
                    <input class="login-input" id="new-user-input" type="text" placeholder="Student Full Name" maxlength="30">
                    <input class="login-input" id="new-user-pin" type="password" inputmode="numeric" pattern="[0-9]*" placeholder="Set 4-Digit PIN" maxlength="4">
                    <button class="btn btn-primary" style="width:100%;padding:.7rem;margin-top:.5rem;" onclick="app.createUser()">Create Profile</button>
                </div>
            </div>
        </div>`;
    },

    requestPIN(name) {
        document.getElementById('login-form').innerHTML = `
            <p style="font-weight:600;color:#003087;margin-bottom:.5rem;">Login as ${name}</p>
            <input class="login-input" id="verify-pin-input" type="password" inputmode="numeric" placeholder="Enter 4-Digit PIN" maxlength="4" autofocus>
            <div style="display:flex;gap:.5rem;margin-top:.5rem;">
                <button class="btn btn-secondary" style="flex:1" onclick="app.showLogin()">Cancel</button>
                <button class="btn btn-primary" style="flex:1" onclick="app.login('${name}')">Login</button>
            </div>
        `;
        document.getElementById('verify-pin-input').focus();
        // Enter key to login
        document.getElementById('verify-pin-input').onkeydown = (e) => { if (e.key === 'Enter') app.login(name); };
    },

    createUser() {
        const name = (document.getElementById('new-user-input')?.value || '').trim();
        const pin = (document.getElementById('new-user-pin')?.value || '').trim();
        if (!name || name.length < 2) { alert('Please enter a valid name.'); return; }
        if (pin.length !== 4 || isNaN(pin)) { alert('PIN must be exactly 4 digits.'); return; }

        const existing = users.list().find(u => u.name === name);
        if (existing) { alert('This name is already taken.'); return; }

        users.add(name, pin);
        this.loginAs(name);
    },

    login(name) {
        const pin = document.getElementById('verify-pin-input').value;
        if (users.verify(name, pin)) {
            this.loginAs(name);
        } else {
            alert('Incorrect PIN. Please try again.');
            document.getElementById('verify-pin-input').value = '';
            document.getElementById('verify-pin-input').focus();
        }
    },

    loginAs(name) {
        state.user = name;
        state.wrongBook = users.getWrongBook(name);
        // Restore the main layout
        document.getElementById('app').innerHTML = `
        <nav class="navbar">
            <div class="logo">NJ Mastery Suite <span>${name}</span></div>
            <div style="display:flex;align-items:center;gap:.75rem;">
                <div id="timer-display">60:00</div>
            </div>
            <div class="nav-buttons">
                <button class="btn btn-secondary" onclick="app.showWrongBook()">📓 Review</button>
                <button class="btn btn-secondary" onclick="app.showLogin()">⇄ Switch</button>
                <button class="btn btn-primary" onclick="app.renderHome()">Home</button>
            </div>
        </nav>
        <div class="testnav-toolbar" id="testnav-toolbar">
            <button class="toolbar-btn" id="tb-zoom" onclick="toolbar.zoom()">🔍 Zoom</button>
            <button class="toolbar-btn" id="tb-hl" onclick="toolbar.highlight()">✏️ Highlighter</button>
            <button class="toolbar-btn" id="tb-lr" onclick="toolbar.lineReader()">📏 Line Reader</button>
            <button class="toolbar-btn" id="tb-elim" onclick="toolbar.eliminator()">✗ Eliminator</button>
            <span class="section-label" id="section-label">Section: Mathematics</span>
        </div>
        <main class="container" id="main-container"></main>
        <footer><p>NJSLA Mastery Suite · 2025 NJ Student Learning Standards · Educational Use Only</p></footer>
        <div id="line-reader"></div>`;

        // Reset toolbar state
        state.zoom = 0; state.highlightMode = false; state.lineReaderOn = false; state.elimMode = false;
        document.removeEventListener('mouseup', toolbar._applyHighlight);
        document.removeEventListener('mousemove', toolbar._moveLineReader);

        this.renderHome();
    },

    deleteUser(name) {
        if (confirm(`Delete student "${name}" and all their data?`)) {
            users.remove(name);
            this.showLogin();
        }
    },

    /* ────────────── HOME ────────────── */
    renderHome() {
        this.stopTimer();
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="home-header">
                <h1>NJSLA Mastery Suite</h1>
                <p>New Jersey Student Learning Assessments — 2025 Official Format</p>
            </div>
            <div class="grid">
                <div class="card" onclick="app.selectSubject('math')">
                    <span class="card-icon">📐</span><h3>Mathematics</h3><p>Grade 3 · 6 Sets · 14 Questions · 60 Min</p>
                </div>
                <div class="card" onclick="app.selectSubject('ela')">
                    <span class="card-icon">📖</span><h3>ELA</h3><p>Grade 3 · 6 Sets · 23 Questions · 75 Min</p>
                </div>
                <div class="card" onclick="app.selectSubject('chinese')">
                    <span class="card-icon">🏮</span><h3>Chinese</h3><p>Grade 2 · 3 Sets · Practice</p>
                </div>
                <div class="card" onclick="app.showWrongBook()">
                    <span class="card-icon">📓</span><h3>Mistake Notebook</h3><p>${state.wrongBook.length} items</p>
                </div>
                <div class="card" onclick="app.showHistory()">
                    <span class="card-icon">📊</span><h3>My Scores</h3><p>${users.getScores(state.user).length} tests taken</p>
                </div>
            </div>
        </div>`;
    },

    /* ────────────── SET SELECT ────────────── */
    selectSubject(sub) { state.subject = sub; this.renderSetList(); },

    renderSetList() {
        const sets = Object.keys(DB[state.subject]);
        const mins = { math: 60, ela: 75, chinese: 20 }[state.subject];
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="section-header">
                <h2>${subjectNames[state.subject]} — Select Unit</h2>
                <button class="btn btn-secondary" onclick="app.renderHome()">← Home</button>
            </div>
            <div class="grid">
                ${sets.map((s, i) => `
                <div class="card" onclick="app.startTest('${s}','practice')">
                    <h3>Unit ${i + 1} — Practice</h3><p>Instant feedback · No timer</p>
                </div>
                <div class="card" onclick="app.startTest('${s}','exam')">
                    <span style="display:inline-block;background:#003087;color:#fff;font-size:.68rem;padding:.1rem .45rem;border-radius:3px;margin-bottom:.4rem;">TIMED EXAM</span>
                    <h3>Unit ${i + 1} — Exam</h3><p>⏱ ${mins} min · Submit to score</p>
                </div>`).join('')}
            </div>
        </div>`;
    },

    /* ────────────── TEST ────────────── */
    startTest(set, mode) {
        state.set = set; state.mode = mode;
        state.currentIdx = 0; state.answers = [];
        state.timeLeft = TIMING[state.subject] || 3600;
        // Reset toolbar
        state.zoom = 0; state.highlightMode = false; state.lineReaderOn = false; state.elimMode = false;
        document.body.classList.remove('highlight-mode');
        document.getElementById('main-container').classList.remove('zoom-1', 'zoom-2', 'zoom-3');
        document.removeEventListener('mouseup', toolbar._applyHighlight);
        document.removeEventListener('mousemove', toolbar._moveLineReader);
        const lr = document.getElementById('line-reader');
        if (lr) lr.style.display = 'none';
        if (mode === 'exam') {
            this.startTimer();
            const tb = document.getElementById('testnav-toolbar');
            if (tb) { tb.style.display = 'flex'; }
            const sl = document.getElementById('section-label');
            if (sl) sl.textContent = `Section: ${subjectNames[state.subject]}`;
            // Reset toolbar button states
            ['tb-zoom', 'tb-hl', 'tb-lr', 'tb-elim'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('active');
            });
            document.getElementById('tb-zoom').textContent = '🔍 Zoom';
            document.getElementById('tb-elim').textContent = '✗ Eliminator';
        }
        this.renderQ();
    },

    startTimer() {
        const el = document.getElementById('timer-display');
        el.style.display = 'block';
        if (state.timerInterval) clearInterval(state.timerInterval);
        state.timerInterval = setInterval(() => {
            state.timeLeft--;
            const m = Math.floor(state.timeLeft / 60), s = state.timeLeft % 60;
            el.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
            el.className = state.timeLeft < 120 ? 'critical' : state.timeLeft < 300 ? 'warning' : '';
            if (state.timeLeft <= 0) { clearInterval(state.timerInterval); alert('Time is up! Submitting.'); this.finishTest(); }
        }, 1000);
    },

    stopTimer() {
        if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
        const el = document.getElementById('timer-display');
        if (el) el.style.display = 'none';
        const tb = document.getElementById('testnav-toolbar');
        if (tb) tb.style.display = 'none';
        const lr = document.getElementById('line-reader');
        if (lr) lr.style.display = 'none';
    },

    renderQ() {
        const qs = DB[state.subject][state.set];
        const q = qs[state.currentIdx];
        const isExam = state.mode === 'exam';
        const isLast = state.currentIdx === qs.length - 1;
        const saved = state.answers[state.currentIdx];
        const prog = (state.currentIdx / qs.length) * 100;
        const setIdx = Object.keys(DB[state.subject]).indexOf(state.set) + 1;

        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="progress-wrap"><div class="progress-fill" style="width:${prog}%"></div></div>
            <div class="question-panel" id="q-panel">
                <div class="question-number">
                    ${isExam ? '' : '<span style="background:#003087;color:#fff;font-size:.72rem;padding:.1rem .45rem;border-radius:3px;margin-right:.5rem;">PRACTICE</span>'}
                    ${subjectNames[state.subject]} &nbsp;·&nbsp; Unit ${setIdx} &nbsp;·&nbsp; Question ${state.currentIdx + 1} of ${qs.length}
                    ${isExam ? '' : `<span style="float:right;font-size:.72rem;color:#888;">${q.tag}</span>`}
                </div>
                <div class="question-text">${q.q}</div>
                <div class="options" id="options-area">
                    ${q.a.map((a, i) => {
            let cls = '';
            if (!isExam && saved !== undefined) {
                cls = i === q.c ? 'correct' : (i === saved ? 'wrong' : '');
            } else if (isExam && saved === i) cls = 'selected';
            return `<div class="option ${cls}" id="opt-${i}" onclick="app.pick(${i})">
                            <div class="option-letter">${String.fromCharCode(65 + i)}</div>
                            <span>${a}</span>
                        </div>`;
        }).join('')}
                </div>
                ${(!isExam && saved !== undefined) ? `
                <div class="feedback-box ${saved === q.c ? 'correct' : 'wrong'}">
                    <strong>${saved === q.c ? '✓ Correct!' : '✗ Incorrect'}</strong> — ${q.exp}
                </div>` : ''}
            </div>
        </div>`;

        this._renderFooter(qs, isExam, isLast);

        // Re-apply eliminator if active
        if (state.elimMode) {
            document.querySelectorAll('.option:not(.correct):not(.wrong)').forEach(o => {
                const idx = parseInt(o.id.replace('opt-', ''));
                o.onclick = () => o.classList.toggle('eliminated');
            });
        }
    },

    _renderFooter(qs, isExam, isLast) {
        const old = document.getElementById('exam-footer');
        if (old) old.remove();
        const foot = document.createElement('div');
        foot.id = 'exam-footer';
        foot.className = 'nav-footer';
        foot.innerHTML = `
            <button class="btn btn-secondary" onclick="app.goBack()" ${state.currentIdx === 0 ? 'disabled' : ''}>← Back</button>
            <span class="nav-footer-info">Q ${state.currentIdx + 1} / ${qs.length}</span>
            <div style="display:flex;gap:.5rem;">
                ${isExam && !isLast ? `<button class="btn btn-primary" onclick="app.goForward()">Next →</button>` : ''}
                ${isExam && isLast ? `<button class="btn btn-primary" onclick="app.finishTest()">Submit →</button>` : ''}
                ${!isExam ? `<button class="btn btn-primary" onclick="app.nextQ()">Next →</button>` : ''}
            </div>`;
        document.getElementById('app').appendChild(foot);
    },

    pick(idx) {
        if (state.elimMode) return; // eliminator mode handles its own click
        const qs = DB[state.subject][state.set];
        const q = qs[state.currentIdx];
        if (state.mode === 'practice') {
            if (state.answers[state.currentIdx] !== undefined) return;
            state.answers[state.currentIdx] = idx;
            if (idx !== q.c) this.save(q);
            this.renderQ();
        } else {
            state.answers[state.currentIdx] = idx;
            document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
            const el = document.getElementById(`opt-${idx}`);
            if (el) {
                el.classList.add('selected');
                const letter = el.querySelector('.option-letter');
                if (letter) letter.style.cssText = 'border-color:#0066cc;background:#0066cc;color:#fff;';
            }
        }
    },

    goBack() { if (state.currentIdx > 0) { state.currentIdx--; this.renderQ(); } },
    goForward() {
        const qs = DB[state.subject][state.set];
        if (state.currentIdx < qs.length - 1) { state.currentIdx++; this.renderQ(); }
    },
    nextQ() {
        const qs = DB[state.subject][state.set];
        const foot = document.getElementById('exam-footer');
        if (foot) foot.remove();
        if (state.currentIdx < qs.length - 1) { state.currentIdx++; this.renderQ(); }
        else { this.stopTimer(); this.renderHome(); }
    },

    /* ────────────── FINISH ────────────── */
    finishTest() {
        this.stopTimer();
        const foot = document.getElementById('exam-footer');
        if (foot) foot.remove();
        const qs = DB[state.subject][state.set];
        let correct = 0;
        qs.forEach((q, i) => { if (state.answers[i] === q.c) correct++; else this.save(q); });
        const pct = Math.round((correct / qs.length) * 100);
        const score = 650 + Math.round((pct / 100) * 200);
        const level = pct >= 90 ? 5 : pct >= 80 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1;
        const labels = ['', 'Does Not Yet Meet Expectations', 'Partially Meets Expectations', 'Approaching Expectations', 'Meets Expectations', 'Exceeds Expectations'];
        const colors = ['', '#c62828', '#e65100', '#c67600', '#1a7f37', '#003087'];
        const pctRank = Math.min(99, Math.round(pct * 0.92));
        const setIdx = Object.keys(DB[state.subject]).indexOf(state.set) + 1;
        // Save score record
        users.addScore(state.user, { date: new Date().toLocaleDateString(), subject: subjectNames[state.subject], unit: setIdx, score, level, pct, correct, total: qs.length });
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="result-card">
                <h2 style="color:#003087;margin-bottom:.2rem;">Assessment Complete</h2>
                <p style="color:#555;font-size:.82rem;margin-bottom:1.25rem;">${subjectNames[state.subject]} · Unit ${setIdx} · ${state.user}</p>
                <span class="level-badge" style="color:${colors[level]}">Level ${level}</span>
                <p style="color:${colors[level]};font-weight:600;margin-bottom:1.25rem;font-size:.9rem;">${labels[level]}</p>
                <div class="stat-grid">
                    <div class="stat-box"><div class="label">Correct</div><div class="value">${correct}/${qs.length}</div></div>
                    <div class="stat-box"><div class="label">Scale Score</div><div class="value">${score}</div><div class="sub">out of 850</div></div>
                    <div class="stat-box"><div class="label">NJ Percentile</div><div class="value">${pctRank}%</div></div>
                </div>
                <div style="display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap;margin-top:1.25rem;">
                    <button class="btn btn-primary" onclick="app.renderHome()">← Home</button>
                    <button class="btn btn-secondary" onclick="app.reviewTest()">Review Answers</button>
                    <button class="btn btn-secondary" onclick="app.showWrongBook()">Mistake Notebook</button>
                </div>
            </div>
        </div>`;
    },

    reviewTest() {
        const foot = document.getElementById('exam-footer');
        if (foot) foot.remove();
        const qs = DB[state.subject][state.set];
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="section-header">
                <h2>Answer Review</h2>
                <button class="btn btn-secondary" onclick="app.renderHome()">← Home</button>
            </div>
            ${qs.map((q, i) => {
            const chosen = state.answers[i];
            const ok = chosen === q.c;
            return `<div class="question-panel" style="margin-bottom:1rem;border-left:4px solid ${ok ? '#1a7f37' : '#c62828'}">
                    <div class="question-number">Q${i + 1} · ${q.tag}</div>
                    <div class="question-text" style="font-size:.95rem;">${q.q}</div>
                    ${chosen !== undefined ? `<p style="color:${ok ? '#1a7f37' : '#c62828'};font-weight:600;margin:.4rem 0;">${String.fromCharCode(65 + chosen)}. ${q.a[chosen]} ${ok ? '✓' : '✗'}</p>` : '<p style="color:#888;font-style:italic;margin:.4rem 0;">Not answered</p>'}
                    ${!ok ? `<p style="color:#1a7f37;font-weight:600;margin-bottom:.4rem;">✓ ${String.fromCharCode(65 + q.c)}. ${q.a[q.c]}</p>` : ''}
                    <p style="font-size:.84rem;color:#444;border-top:1px solid #e8ecf1;padding-top:.4rem;margin-top:.4rem;">${q.exp}</p>
                </div>`;
        }).join('')}
        </div>`;
    },

    save(q) {
        if (!state.wrongBook.find(w => w.q === q.q)) {
            state.wrongBook.push(q);
            users.saveWrongBook(state.user, state.wrongBook);
        }
    },

    showWrongBook() {
        const foot = document.getElementById('exam-footer');
        if (foot) foot.remove();
        this.stopTimer();
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="section-header">
                <h2>📓 Mistake Notebook — ${state.user} (${state.wrongBook.length})</h2>
                <button class="btn btn-secondary" onclick="app.renderHome()">← Home</button>
            </div>
            ${state.wrongBook.length === 0 ? `<div class="question-panel" style="text-align:center;color:#555;padding:2rem;"><p style="font-size:1.5rem;">🌟</p><p>No mistakes yet!</p></div>`
                : state.wrongBook.map(q => `
            <div class="question-panel wrong-item" style="margin-bottom:1rem;">
                <p style="font-size:.75rem;color:#888;margin-bottom:.3rem;">${q.tag}</p>
                <div class="question-text" style="font-size:.95rem;">${q.q}</div>
                <p style="color:#1a7f37;font-weight:600;margin:.4rem 0;">✓ ${q.a[q.c]}</p>
                <p style="font-size:.84rem;color:#444;border-top:1px solid #e8ecf1;padding-top:.4rem;">${q.exp}</p>
            </div>`).join('')}
            ${state.wrongBook.length > 0 ? `<button class="btn btn-secondary" onclick="app.clearWrong()">Clear All</button>` : ''}
        </div>`;
    },

    showHistory() {
        const scores = users.getScores(state.user);
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="section-header">
                <h2>📊 Score History — ${state.user}</h2>
                <button class="btn btn-secondary" onclick="app.renderHome()">← Home</button>
            </div>
            ${scores.length === 0 ? `<div class="question-panel" style="text-align:center;color:#555;padding:2rem;"><p>No tests taken yet.</p></div>` : `
            <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.07);">
                <thead><tr style="background:#003087;color:#fff;">
                    <th style="padding:.65rem 1rem;text-align:left;font-size:.82rem;">Date</th>
                    <th style="padding:.65rem 1rem;font-size:.82rem;">Subject</th>
                    <th style="padding:.65rem 1rem;font-size:.82rem;">Unit</th>
                    <th style="padding:.65rem 1rem;font-size:.82rem;">Score</th>
                    <th style="padding:.65rem 1rem;font-size:.82rem;">Scale</th>
                    <th style="padding:.65rem 1rem;font-size:.82rem;">Level</th>
                </tr></thead>
                <tbody>
                    ${scores.slice().reverse().map((s, i) => `
                    <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'};border-bottom:1px solid #e8ecf1;">
                        <td style="padding:.55rem 1rem;font-size:.83rem;">${s.date}</td>
                        <td style="padding:.55rem 1rem;font-size:.83rem;">${s.subject}</td>
                        <td style="padding:.55rem 1rem;font-size:.83rem;text-align:center;">Unit ${s.unit}</td>
                        <td style="padding:.55rem 1rem;font-size:.83rem;text-align:center;">${s.correct}/${s.total}</td>
                        <td style="padding:.55rem 1rem;font-size:.83rem;text-align:center;">${s.score}</td>
                        <td style="padding:.55rem 1rem;font-size:.83rem;text-align:center;font-weight:700;color:${['', '#c62828', '#e65100', '#c67600', '#1a7f37', '#003087'][s.level]}">L${s.level}</td>
                    </tr>`).join('')}
                </tbody>
            </table></div>`}
        </div>`;
    },

    clearWrong() {
        if (confirm('Clear all mistakes?')) {
            state.wrongBook = [];
            users.saveWrongBook(state.user, []);
            this.showWrongBook();
        }
    }
};

window.onload = () => app.init();
