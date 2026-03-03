/** NJ Mastery Suite – Engine only.
 *  DB is provided by math_questions.js + questions.js (loaded before this file in index.html).
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

const app = {
    init() { this.renderHome(); },

    renderHome() {
        this.stopTimer();
        document.getElementById('timer-display').style.display = 'none';
        const sets = { math: '6 Sets · 14 Questions · 60 Min', ela: '6 Sets · 23 Questions · 75 Min', chinese: '3 Sets · Practice Mode' };
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <header style="text-align:center;padding:3rem 0;">
                <h1 style="font-size:2.8rem;margin-bottom:.5rem;">NJSLA Mastery Suite</h1>
                <p style="color:var(--text-muted);">2025 Official Format · Real Timing · True NJSLA Difficulty</p>
            </header>
            <div class="grid">
                <div class="card" onclick="app.selectSubject('math')">
                    <span class="card-icon">📐</span><h3>Grade 3 Math</h3><p>${sets.math}</p>
                </div>
                <div class="card" onclick="app.selectSubject('ela')">
                    <span class="card-icon">📖</span><h3>Grade 3 ELA</h3><p>${sets.ela}</p>
                </div>
                <div class="card" onclick="app.selectSubject('chinese')">
                    <span class="card-icon">🏮</span><h3>Grade 2 Chinese</h3><p>${sets.chinese}</p>
                </div>
                <div class="card" onclick="app.showWrongBook()">
                    <span class="card-icon">📓</span><h3>Mistake Notebook</h3>
                    <p>${state.wrongBook.length} items to review</p>
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
            <div class="test-header">
                <h2>Choose a Set — ${state.subject.toUpperCase()}</h2>
                <button class="btn btn-secondary" onclick="app.renderHome()">← Home</button>
            </div>
            <div class="grid">
                ${sets.map((s, i) => `
                <div class="card" onclick="app.startTest('${s}','practice')">
                    <h3>Set ${i + 1}</h3><p>Practice Mode (instant feedback)</p>
                </div>
                <div class="card" style="border-color:var(--primary);" onclick="app.startTest('${s}','exam')">
                    <h3>Set ${i + 1} EXAM</h3><p>⏱ ${mins} Minute Timer</p>
                </div>`).join('')}
            </div>
        </div>`;
    },

    startTest(set, mode) {
        state.set = set; state.mode = mode;
        state.currentIdx = 0; state.answers = [];
        state.timeLeft = TIMING[state.subject] || 3600;
        if (mode === 'exam') this.startTimer();
        this.renderQ();
    },

    startTimer() {
        const el = document.getElementById('timer-display');
        el.style.display = 'block';
        if (state.timerInterval) clearInterval(state.timerInterval);
        state.timerInterval = setInterval(() => {
            state.timeLeft--;
            const m = Math.floor(state.timeLeft / 60), s = state.timeLeft % 60;
            el.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
            el.style.color = state.timeLeft < 300 ? '#ef4444' : '#f97316';
            if (state.timeLeft <= 0) { clearInterval(state.timerInterval); alert('Time is up!'); this.finishTest(); }
        }, 1000);
    },

    stopTimer() {
        if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
        document.getElementById('timer-display').style.display = 'none';
    },

    renderQ() {
        const qs = DB[state.subject][state.set];
        const q = qs[state.currentIdx];
        const prog = (state.currentIdx / qs.length) * 100;
        const isLast = state.currentIdx === qs.length - 1;
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;">
                <span style="color:var(--text-muted);font-size:.9rem;">Q ${state.currentIdx + 1} / ${qs.length}</span>
                <span style="color:var(--primary);font-size:.8rem;">${q.tag}</span>
            </div>
            <div class="progress-container"><div class="progress-bar" style="width:${prog}%"></div></div>
            <div class="question-box">
                <div class="question-text">${q.q}</div>
                <div class="options">
                    ${q.a.map((a, i) => `
                    <div class="option" id="opt-${i}" onclick="app.pick(${i})">
                        <div class="badge">${String.fromCharCode(65 + i)}</div><span>${a}</span>
                    </div>`).join('')}
                </div>
            </div>
            <div style="text-align:right;margin-top:1rem;">
                ${state.mode === 'practice' ? `<button class="btn btn-secondary" onclick="app.nextQ()">Next →</button>` : ''}
                ${isLast && state.mode === 'exam' ? `<button class="btn btn-primary" onclick="app.finishTest()">✔ SUBMIT TEST</button>` : ''}
            </div>
        </div>`;
    },

    pick(idx) {
        const qs = DB[state.subject][state.set];
        const q = qs[state.currentIdx];
        if (state.mode === 'practice') {
            document.querySelectorAll('.option').forEach(o => o.onclick = null);
            document.getElementById(`opt-${q.c}`).classList.add('correct');
            if (idx !== q.c) { document.getElementById(`opt-${idx}`).classList.add('wrong'); this.save(q); }
            const fb = document.createElement('div');
            fb.style.cssText = `margin-top:1rem;padding:.75rem 1rem;border-radius:.5rem;background:rgba(${idx === q.c ? '16,185,129' : '239,68,68'},.1);color:${idx === q.c ? 'var(--accent-success)' : 'var(--accent-error)'}`;
            fb.innerHTML = `<strong>${idx === q.c ? '✓ Correct!' : '✗ Incorrect'}</strong> — ${q.exp}`;
            document.querySelector('.question-box').appendChild(fb);
        } else {
            state.answers[state.currentIdx] = idx;
            document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
            document.getElementById(`opt-${idx}`).classList.add('selected');
            if (state.currentIdx < qs.length - 1) setTimeout(() => { state.currentIdx++; this.renderQ(); }, 350);
        }
    },

    nextQ() {
        const qs = DB[state.subject][state.set];
        if (state.currentIdx < qs.length - 1) { state.currentIdx++; this.renderQ(); }
        else this.renderHome();
    },

    finishTest() {
        this.stopTimer();
        const qs = DB[state.subject][state.set];
        let correct = 0;
        qs.forEach((q, i) => { if (state.answers[i] === q.c) correct++; else this.save(q); });
        const pct = Math.round((correct / qs.length) * 100);
        const score = 650 + Math.round((pct / 100) * 200);
        const level = pct >= 90 ? 5 : pct >= 80 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1;
        const labels = ['', 'Does Not Yet Meet Expectations', 'Partially Meets Expectations', 'Approaching Expectations', 'Meets Expectations', 'Exceeds Expectations'];
        const pctRank = Math.min(99, Math.round(pct * 0.92));
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in" style="text-align:center;max-width:640px;margin:0 auto;">
            <h2 style="margin-bottom:.5rem;">Assessment Report</h2>
            <p style="color:var(--text-muted);margin-bottom:1.5rem;">Based on Uniform NJSLA 2025 Standards</p>
            <div class="result-level">Level ${level}</div>
            <p style="color:var(--text-muted);margin-bottom:1.5rem;">${labels[level]}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin:1rem 0;">
                <div class="card"><p style="color:var(--text-muted);font-size:.8rem;">RAW SCORE</p><p style="font-size:2rem;font-weight:800;">${correct}/${qs.length}</p></div>
                <div class="card"><p style="color:var(--text-muted);font-size:.8rem;">SCALE SCORE</p><p style="font-size:2rem;font-weight:800;">${score}</p><p style="font-size:.7rem;color:var(--text-muted);">/850</p></div>
                <div class="card"><p style="color:var(--text-muted);font-size:.8rem;">NJ PERCENTILE</p><p style="font-size:2rem;font-weight:800;">${pctRank}%</p></div>
            </div>
            <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-top:1.5rem;">
                <button class="btn btn-primary" onclick="app.renderHome()">Home</button>
                <button class="btn btn-secondary" onclick="app.reviewTest()">Review Answers</button>
                <button class="btn btn-secondary" onclick="app.showWrongBook()">Mistake Notebook</button>
            </div>
        </div>`;
    },

    reviewTest() {
        const qs = DB[state.subject][state.set];
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="test-header">
                <h2>Answer Review</h2>
                <button class="btn btn-secondary" onclick="app.renderHome()">Home</button>
            </div>
            ${qs.map((q, i) => {
            const chosen = state.answers[i];
            const ok = chosen === q.c;
            return `<div class="question-box" style="border-left:4px solid ${ok ? 'var(--accent-success)' : 'var(--accent-error)'}">
                    <p style="font-size:.75rem;color:var(--text-muted);">Q${i + 1} · ${q.tag}</p>
                    <p style="margin:.5rem 0;font-weight:500;">${q.q}</p>
                    ${chosen !== undefined ? `<p style="color:${ok ? 'var(--accent-success)' : 'var(--accent-error)'};">Your answer: ${q.a[chosen]} ${ok ? '✓' : '✗'}</p>` : '<p style="color:var(--text-muted);">Not answered</p>'}
                    ${!ok ? `<p style="color:var(--accent-success);">✓ Correct: ${q.a[q.c]}</p>` : ''}
                    <p style="font-size:.85rem;color:var(--text-muted);margin-top:.4rem;">${q.exp}</p>
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
        document.getElementById('main-container').innerHTML = `
        <div class="animate-in">
            <div class="test-header">
                <h2>📓 Mistake Notebook (${state.wrongBook.length})</h2>
                <button class="btn btn-secondary" onclick="app.renderHome()">Home</button>
            </div>
            ${state.wrongBook.length === 0 ? '<p style="text-align:center;color:var(--text-muted);margin:3rem 0;">No mistakes yet — great work! 🌟</p>' : ''}
            ${state.wrongBook.map(q => `
            <div class="question-box wrong-item">
                <p style="font-size:.75rem;color:var(--text-muted);">${q.tag}</p>
                <p style="margin:.5rem 0;">${q.q}</p>
                <p style="color:var(--accent-success);">✓ ${q.a[q.c]}</p>
                <p style="font-size:.85rem;color:var(--text-muted);margin-top:.4rem;">${q.exp}</p>
            </div>`).join('')}
            ${state.wrongBook.length > 0 ? `<button class="btn btn-secondary" onclick="app.clearWrong()">Clear All</button>` : ''}
        </div>`;
    },

    clearWrong() {
        if (confirm('Clear all mistakes?')) {
            state.wrongBook = [];
            localStorage.removeItem('nj_wrong_book');
            this.showWrongBook();
        }
    }
};

window.onload = () => app.init();
