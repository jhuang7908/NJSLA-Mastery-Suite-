/** NJ Mastery Suite – NJSLA TestNav-Style Engine
 *  DB loaded from math_questions.js + questions.js before this file.
 */

const TIMING = { math: 3600, ela: 4500, chinese: 1200 };

let state = {
    subject: 'math',
    set: 'set1',
    mode: 'practice',
    currentIdx: 0,
    answers: [],
    wrongBook: JSON.parse(localStorage.getItem('nj_wrong_book') || '[]'),
    timeLeft: 3600,
    timerInterval: null
};

const subjectNames = { math: 'Mathematics', ela: 'English Language Arts', chinese: 'Chinese (Grade 2)' };

const app = {
    init() { this.renderHome(); },

    renderHome() {
        this.stopTimer();
        document.getElementById('timer-display').style.display = 'none';
        document.getElementById('testnav-toolbar')?.style && (document.getElementById('testnav-toolbar').style.display = 'none');
        const wbCount = state.wrongBook.length;
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="home-header">
                <h1>NJSLA Mastery Suite</h1>
                <p>New Jersey Student Learning Assessments — 2025 Official Format Simulation</p>
            </div>
            <div class="grid">
                <div class="card" onclick="app.selectSubject('math')">
                    <span class="card-icon">📐</span>
                    <h3>Mathematics</h3>
                    <p>Grade 3 · 6 Sets · 14 Questions · 60 Min</p>
                </div>
                <div class="card" onclick="app.selectSubject('ela')">
                    <span class="card-icon">📖</span>
                    <h3>ELA</h3>
                    <p>Grade 3 · 6 Sets · 23 Questions · 75 Min</p>
                </div>
                <div class="card" onclick="app.selectSubject('chinese')">
                    <span class="card-icon">🏮</span>
                    <h3>Chinese</h3>
                    <p>Grade 2 · 3 Sets · Practice Mode</p>
                </div>
                <div class="card" onclick="app.showWrongBook()">
                    <span class="card-icon">📓</span>
                    <h3>Mistake Notebook</h3>
                    <p>${wbCount} ${wbCount === 1 ? 'item' : 'items'} to review</p>
                </div>
            </div>
        </div>`;
    },

    selectSubject(sub) { state.subject = sub; this.renderSetList(); },

    renderSetList() {
        const sets = Object.keys(DB[state.subject]);
        const mins = { math: 60, ela: 75, chinese: 20 }[state.subject];
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="section-header">
                <h2>${subjectNames[state.subject]} — Select a Unit</h2>
                <button class="btn btn-secondary" onclick="app.renderHome()">← Home</button>
            </div>
            <div class="grid">
                ${sets.map((s, i) => `
                <div class="card" onclick="app.startTest('${s}','practice')">
                    <h3>Unit ${i + 1} — Practice</h3>
                    <p>Instant feedback · No timer</p>
                </div>
                <div class="card" onclick="app.startTest('${s}','exam')">
                    <span style="display:inline-block;background:#003087;color:#fff;font-size:.7rem;padding:.15rem .5rem;border-radius:3px;margin-bottom:.5rem;">TIMED EXAM</span>
                    <h3>Unit ${i + 1} — Exam Mode</h3>
                    <p>⏱ ${mins} minutes · Submit to score</p>
                </div>`).join('')}
            </div>
        </div>`;
    },

    startTest(set, mode) {
        state.set = set; state.mode = mode;
        state.currentIdx = 0; state.answers = [];
        state.timeLeft = TIMING[state.subject] || 3600;
        if (mode === 'exam') {
            this.startTimer();
            const tb = document.getElementById('testnav-toolbar');
            if (tb) { tb.style.display = 'flex'; tb.querySelector('.section-label').textContent = `Section: ${subjectNames[state.subject]}`; }
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
            if (state.timeLeft <= 0) { clearInterval(state.timerInterval); this.finishTest(); }
        }, 1000);
    },

    stopTimer() {
        if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
        const el = document.getElementById('timer-display');
        if (el) el.style.display = 'none';
        const tb = document.getElementById('testnav-toolbar');
        if (tb) tb.style.display = 'none';
    },

    renderQ() {
        const qs = DB[state.subject][state.set];
        const q = qs[state.currentIdx];
        const isExam = state.mode === 'exam';
        const isLast = state.currentIdx === qs.length - 1;
        const savedAnswer = state.answers[state.currentIdx];
        const prog = ((state.currentIdx) / qs.length) * 100;
        const setIdx = Object.keys(DB[state.subject]).indexOf(state.set) + 1;

        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="progress-wrap"><div class="progress-fill" style="width:${prog}%"></div></div>
            <div class="question-panel">
                <div class="question-number">
                    ${isExam ? '' : `<span style="background:#003087;color:#fff;padding:.1rem .5rem;border-radius:3px;font-size:.75rem;margin-right:.5rem;">PRACTICE</span>`}
                    ${subjectNames[state.subject]} &nbsp;·&nbsp; Unit ${setIdx} &nbsp;·&nbsp; Question ${state.currentIdx + 1} of ${qs.length}
                </div>
                <div class="question-text">${q.q}</div>
                <div class="options">
                    ${q.a.map((a, i) => {
            let cls = '';
            if (!isExam && savedAnswer !== undefined) {
                if (i === q.c) cls = 'correct';
                else if (i === savedAnswer && savedAnswer !== q.c) cls = 'wrong';
            } else if (isExam && savedAnswer === i) cls = 'selected';
            return `<div class="option ${cls}" id="opt-${i}" onclick="app.pick(${i})">
                            <div class="option-letter">${String.fromCharCode(65 + i)}</div>
                            <span>${a}</span>
                        </div>`;
        }).join('')}
                </div>
                ${(!isExam && savedAnswer !== undefined) ? `
                <div class="feedback-box ${savedAnswer === q.c ? 'correct' : 'wrong'}">
                    <strong>${savedAnswer === q.c ? '✓ Correct!' : '✗ Incorrect'}</strong> — ${q.exp}
                </div>` : ''}
            </div>
        </div>`;

        // Render footer nav bar
        this.renderNavFooter(qs, isExam, isLast);
    },

    renderNavFooter(qs, isExam, isLast) {
        // Remove old footer if present
        const oldFoot = document.getElementById('exam-footer');
        if (oldFoot) oldFoot.remove();
        const foot = document.createElement('div');
        foot.id = 'exam-footer';
        foot.className = 'nav-footer';
        foot.innerHTML = `
            <button class="btn btn-secondary" onclick="app.goBack()" ${state.currentIdx === 0 ? 'disabled style="opacity:.4;cursor:default;"' : ''}>← Back</button>
            <span class="nav-footer-info">Question ${state.currentIdx + 1} of ${qs.length}</span>
            <div style="display:flex;gap:.5rem;">
                ${isExam && isLast ? `<button class="btn btn-primary" onclick="app.finishTest()">Review &amp; Submit →</button>` : ''}
                ${isExam && !isLast ? `<button class="btn btn-primary" onclick="app.goForward()">Next →</button>` : ''}
                ${!isExam ? `<button class="btn btn-primary" onclick="app.nextQ()">Next →</button>` : ''}
            </div>`;
        document.getElementById('app').appendChild(foot);
    },

    pick(idx) {
        const qs = DB[state.subject][state.set];
        const q = qs[state.currentIdx];
        if (!state.mode) return;

        if (state.mode === 'practice') {
            if (state.answers[state.currentIdx] !== undefined) return; // already answered
            state.answers[state.currentIdx] = idx;
            if (idx !== q.c) this.save(q);
            this.renderQ(); // re-render to show feedback
        } else {
            // exam: just mark selection
            state.answers[state.currentIdx] = idx;
            document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
            const el = document.getElementById(`opt-${idx}`);
            if (el) { el.classList.add('selected'); el.querySelector('.option-letter').style.cssText = 'border-color:#0066cc;background:#0066cc;color:#fff;'; }
        }
    },

    goBack() {
        if (state.currentIdx > 0) { state.currentIdx--; this.renderQ(); }
    },

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
        const levelColors = ['', '#c62828', '#e65100', '#f9a825', '#1a7f37', '#003087'];
        const pctRank = Math.min(99, Math.round(pct * 0.92));
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="result-card">
                <h2 style="color:#003087;margin-bottom:.25rem;">Assessment Complete</h2>
                <p style="color:#555;font-size:.85rem;margin-bottom:1.5rem;">${subjectNames[state.subject]} · ${Object.keys(DB[state.subject]).indexOf(state.set) + 1 ? `Unit ${Object.keys(DB[state.subject]).indexOf(state.set) + 1}` : ''}</p>
                <span class="level-badge" style="color:${levelColors[level]}">Performance Level ${level}</span>
                <p style="color:${levelColors[level]};font-weight:600;margin-bottom:1.5rem;">${labels[level]}</p>
                <div class="stat-grid">
                    <div class="stat-box"><div class="label">Correct</div><div class="value">${correct}/${qs.length}</div></div>
                    <div class="stat-box"><div class="label">Scale Score</div><div class="value">${score}</div><div class="sub">out of 850</div></div>
                    <div class="stat-box"><div class="label">NJ Percentile</div><div class="value">${pctRank}%</div></div>
                </div>
                <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;margin-top:1.5rem;">
                    <button class="btn btn-primary" onclick="app.renderHome()">← Return Home</button>
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
            return `
                <div class="question-panel" style="margin-bottom:1rem;border-left:4px solid ${ok ? '#1a7f37' : '#c62828'}">
                    <div class="question-number">Q${i + 1} · ${q.tag}</div>
                    <div class="question-text" style="font-size:.95rem;">${q.q}</div>
                    ${chosen !== undefined
                    ? `<p style="margin:.5rem 0;color:${ok ? '#1a7f37' : '#c62828'};font-weight:600;">${String.fromCharCode(65 + chosen)}. ${q.a[chosen]} ${ok ? '✓' : '✗'}</p>`
                    : `<p style="color:#888;font-style:italic;">Not answered</p>`}
                    ${!ok ? `<p style="color:#1a7f37;font-weight:600;margin-bottom:.4rem;">✓ Correct: ${String.fromCharCode(65 + q.c)}. ${q.a[q.c]}</p>` : ''}
                    <p style="font-size:.85rem;color:#444;border-top:1px solid #e8ecf1;padding-top:.5rem;margin-top:.5rem;">${q.exp}</p>
                </div>`;
        }).join('')}
        </div>`;
    },

    save(q) {
        if (!state.wrongBook.find(w => w.q === q.q)) {
            state.wrongBook.push(q);
            localStorage.setItem('nj_wrong_book', JSON.stringify(state.wrongBook));
        }
    },

    showWrongBook() {
        const foot = document.getElementById('exam-footer');
        if (foot) foot.remove();
        this.stopTimer();
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="section-header">
                <h2>📓 Mistake Notebook (${state.wrongBook.length} items)</h2>
                <button class="btn btn-secondary" onclick="app.renderHome()">← Home</button>
            </div>
            ${state.wrongBook.length === 0
                ? `<div class="question-panel" style="text-align:center;color:#555;padding:2rem;">
                    <p style="font-size:1.5rem;">🌟</p>
                    <p>No mistakes yet — keep it up!</p>
                   </div>`
                : state.wrongBook.map(q => `
                <div class="question-panel wrong-item" style="margin-bottom:1rem;">
                    <p style="font-size:.75rem;color:#888;margin-bottom:.4rem;">${q.tag}</p>
                    <div class="question-text" style="font-size:.95rem;">${q.q}</div>
                    <p style="color:#1a7f37;font-weight:600;margin:.5rem 0;">✓ ${q.a[q.c]}</p>
                    <p style="font-size:.85rem;color:#444;border-top:1px solid #e8ecf1;padding-top:.5rem;">${q.exp}</p>
                </div>`).join('')}
            ${state.wrongBook.length > 0
                ? `<button class="btn btn-secondary" style="margin-top:.5rem;" onclick="app.clearWrong()">Clear All Mistakes</button>`
                : ''}
        </div>`;
    },

    clearWrong() {
        if (confirm('Clear all mistakes?')) {
            state.wrongBook = []; localStorage.removeItem('nj_wrong_book'); this.showWrongBook();
        }
    }
};

window.onload = () => app.init();
