(() => {
  const FADE_DELAY  = 10000;   // ms of inactivity before fade starts
  const FADE_DUR    = 3500;    // must match --fade-dur in CSS (3.5s)

  const noteEl      = document.getElementById('note');
  const statusEl    = document.getElementById('status');
  const timerBarEl  = document.getElementById('timer-bar');
  const timerTrack  = document.getElementById('timer-track');
  const saveBtn     = document.getElementById('save-btn');
  const savedList   = document.getElementById('saved-list');
  const mistEl      = document.getElementById('mist');
  const toastEl     = document.getElementById('toast');

  let inactivityTimer  = null;
  let timerStart       = null;
  let rafId            = null;
  let isFading         = false;
  let isGone           = false;
  let saved            = [];

  // ── Focus textarea on load ──
  noteEl.focus();

  // ── Input handler ──
  noteEl.addEventListener('input', onActivity);
  noteEl.addEventListener('keydown', onActivity);

  function onActivity() {
    if (isFading || isGone) resurrect();

    const hasText = noteEl.value.trim().length > 0;
    saveBtn.disabled = !hasText;

    if (!hasText) {
      clearCountdown();
      setStatus('waiting for words', '');
      return;
    }

    resetCountdown();
  }

  // ── Countdown ──
  function resetCountdown() {
    clearCountdown();
    isFading = false;
    isGone   = false;

    timerTrack.classList.add('visible');
    timerBarEl.style.transition = 'none';
    timerBarEl.style.transform  = 'scaleX(1)';

    setStatus('writing…', '');

    // start the visual bar drain after a brief paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        timerBarEl.style.transition = `transform ${FADE_DELAY / 1000}s linear`;
        timerBarEl.style.transform  = 'scaleX(0)';
      });
    });

    timerStart = Date.now();
    inactivityTimer = setTimeout(beginFade, FADE_DELAY);
  }

  function clearCountdown() {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
    cancelAnimationFrame(rafId);

    timerTrack.classList.remove('visible');
    timerBarEl.style.transition = 'none';
    timerBarEl.style.transform  = 'scaleX(1)';
  }

  // ── Fade sequence ──
  function beginFade() {
    if (!noteEl.value.trim()) return;
    isFading = true;

    setStatus('fading…', 'warn');
    timerTrack.classList.remove('visible');

    noteEl.classList.add('fading');
    mistEl.classList.add('active');

    setTimeout(completeDisappear, FADE_DUR);
  }

  function completeDisappear() {
    noteEl.value = '';
    noteEl.classList.remove('fading');
    mistEl.classList.remove('active');

    isFading = false;
    isGone   = true;

    saveBtn.disabled = true;
    setStatus('gone.', 'gone');

    // gentle reset of status after a moment
    setTimeout(() => {
      if (isGone) setStatus('waiting for words', '');
      isGone = false;
    }, 3000);
  }

  function resurrect() {
    clearTimeout(inactivityTimer);
    cancelAnimationFrame(rafId);

    noteEl.classList.remove('fading');
    mistEl.classList.remove('active');

    isFading = false;
    isGone   = false;

    setStatus('writing…', '');
  }

  // ── Save ──
  saveBtn.addEventListener('click', () => {
    const text = noteEl.value.trim();
    if (!text) return;

    // cancel any fade in progress
    resurrect();
    clearCountdown();

    const entry = { text, time: new Date() };
    saved.unshift(entry);
    renderSaved();

    // clear editor
    noteEl.value = '';
    saveBtn.disabled = true;
    setStatus('waiting for words', '');

    showToast();
    noteEl.focus();
  });

  // ── Render saved items ──
  function renderSaved() {
    savedList.innerHTML = '';

    saved.forEach((entry, idx) => {
      const item = document.createElement('div');
      item.className = 'saved-item';

      const textEl = document.createElement('div');
      textEl.className = 'saved-text';
      textEl.textContent = entry.text;

      const metaEl = document.createElement('div');
      metaEl.className = 'saved-meta';
      metaEl.textContent = fmtTime(entry.time);

      const del = document.createElement('button');
      del.className = 'delete-btn';
      del.title = 'delete';
      del.textContent = '×';
      del.addEventListener('click', () => {
        saved.splice(idx, 1);
        renderSaved();
      });

      item.appendChild(textEl);
      item.appendChild(metaEl);
      item.appendChild(del);
      savedList.appendChild(item);
    });
  }

  // ── Toast ──
  function showToast() {
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2000);
  }

  // ── Status helper ──
  function setStatus(msg, cls) {
    statusEl.textContent = msg;
    statusEl.className   = 'status' + (cls ? ' ' + cls : '');
  }

  // ── Time formatter ──
  function fmtTime(d) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

})();
