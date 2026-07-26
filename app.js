/* ============================================================
   STARK HUD — APPLICATION LOGIC
   ============================================================ */
(() => {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     PARTICLE SYSTEM — interactive connected particles
     ────────────────────────────────────────────────────────── */
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouse = { x: null, y: null };
  const PARTICLE_COUNT = 140;
  const CONNECT_DIST = 130;
  const MOUSE_RADIUS = 200;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

  const PALETTE = [[0,195,255],[123,97,255],[0,255,163],[0,140,200]];

  class Particle {
    constructor() { this.init(); }
    init() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.r = Math.random() * 1.8 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.alpha = Math.random() * 0.5 + 0.15;
      this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (mouse.x !== null) {
        const dx = this.x - mouse.x, dy = this.y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MOUSE_RADIUS) {
          const f = (MOUSE_RADIUS - d) / MOUSE_RADIUS;
          this.x += dx * f * 0.025;
          this.y += dy * f * 0.025;
        }
      }
      if (this.x < -20) this.x = canvas.width + 20;
      if (this.x > canvas.width + 20) this.x = -20;
      if (this.y < -20) this.y = canvas.height + 20;
      if (this.y > canvas.height + 20) this.y = -20;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color[0]},${this.color[1]},${this.color[2]},${this.alpha})`;
      ctx.fill();
    }
  }

  function initParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
    document.getElementById('particleCount').textContent = PARTICLE_COUNT;
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < CONNECT_DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,195,255,${(1 - d / CONNECT_DIST) * 0.12})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }
    }
  }

  /* FPS counter */
  let frames = 0, lastFps = performance.now();
  const fpsEl = document.getElementById('fpsDisplay');

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    frames++;
    const now = performance.now();
    if (now - lastFps >= 1000) { fpsEl.textContent = frames; frames = 0; lastFps = now; }
    requestAnimationFrame(loop);
  }
  initParticles();
  loop();

  /* ──────────────────────────────────────────────────────────
     CLOCK — circular arcs + digital
     ────────────────────────────────────────────────────────── */
  // Generate tick marks
  const ticksG = document.getElementById('clockTicks');
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 360 - 90;
    const rad = angle * Math.PI / 180;
    const inner = i % 5 === 0 ? 125 : 130;
    const outer = 138;
    const x1 = 150 + inner * Math.cos(rad), y1 = 150 + inner * Math.sin(rad);
    const x2 = 150 + outer * Math.cos(rad), y2 = 150 + outer * Math.sin(rad);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', i % 5 === 0 ? 'rgba(0,195,255,0.35)' : 'rgba(0,195,255,0.1)');
    line.setAttribute('stroke-width', i % 5 === 0 ? '2' : '1');
    ticksG.appendChild(line);
  }

  const arcHour = document.getElementById('arcHour');
  const arcMin = document.getElementById('arcMin');
  const arcSec = document.getElementById('arcSec');
  const cdH = document.getElementById('cdH');
  const cdM = document.getElementById('cdM');
  const cdS = document.getElementById('cdS');
  const cdAmpm = document.getElementById('cdAmpm');
  const cdTz = document.getElementById('cdTz');
  const dateEl = document.getElementById('dateDisplay');
  const uptimeEl = document.getElementById('uptime');

  const startTime = Date.now();

  function setArc(el, fraction, r) {
    const c = 2 * Math.PI * r;
    el.style.strokeDasharray = `${c * fraction} ${c}`;
  }

  function tickClock() {
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes(), s = now.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;

    cdH.textContent = String(h12).padStart(2, '0');
    cdM.textContent = String(m).padStart(2, '0');
    cdS.textContent = String(s).padStart(2, '0');
    cdAmpm.textContent = ampm;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    cdTz.textContent = tz;

    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();

    // Arcs
    setArc(arcHour, (h % 12 + m / 60) / 12, 130);
    setArc(arcMin, m / 60, 115);
    setArc(arcSec, s / 60, 100);

    // Uptime
    const el = Math.floor((Date.now() - startTime) / 1000);
    uptimeEl.textContent = `${String(Math.floor(el/3600)).padStart(2,'0')}:${String(Math.floor(el%3600/60)).padStart(2,'0')}:${String(el%60).padStart(2,'0')}`;
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ──────────────────────────────────────────────────────────
     BATTERY — ring gauge
     ────────────────────────────────────────────────────────── */
  const battArc = document.getElementById('battArc');
  const battPct = document.getElementById('battPct');
  const battStatus = document.getElementById('battStatus');
  const battHealth = document.getElementById('battHealth');
  const battEta = document.getElementById('battEta');
  const battCycles = document.getElementById('battCycles');

  // Generate battery ticks
  const battTicksG = document.getElementById('battTicks');
  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * 360 - 90;
    const rad = angle * Math.PI / 180;
    const x1 = 100 + 78 * Math.cos(rad), y1 = 100 + 78 * Math.sin(rad);
    const x2 = 100 + 82 * Math.cos(rad), y2 = 100 + 82 * Math.sin(rad);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'rgba(0,195,255,0.15)');
    line.setAttribute('stroke-width', '1');
    battTicksG.appendChild(line);
  }

  function setBattery(battery) {
    const level = Math.round(battery.level * 100);
    const circ = 2 * Math.PI * 85;
    battArc.style.strokeDasharray = `${circ * (level / 100)} ${circ}`;
    battPct.textContent = level + '%';

    battStatus.textContent = battery.charging ? '⚡ Charging' : 'Discharging';
    battHealth.textContent = level > 80 ? 'Excellent' : level > 50 ? 'Good' : level > 20 ? 'Fair' : 'Low';
    battCycles.textContent = Math.floor(200 + Math.random() * 300);

    if (battery.charging) {
      battEta.textContent = battery.chargingTime === Infinity ? 'Calculating...' : Math.round(battery.chargingTime / 60) + ' min';
    } else {
      battEta.textContent = battery.dischargingTime === Infinity ? 'Calculating...' : `${Math.floor(battery.dischargingTime/3600)}h ${Math.round(battery.dischargingTime%3600/60)}m`;
    }
  }

  function simBattery() {
    setBattery({
      level: 0.68 + Math.random() * 0.25,
      charging: Math.random() > 0.5,
      chargingTime: Infinity,
      dischargingTime: 12000 + Math.random() * 10000
    });
  }

  if ('getBattery' in navigator) {
    navigator.getBattery().then(b => {
      setBattery(b);
      b.addEventListener('chargingchange', () => setBattery(b));
      b.addEventListener('levelchange', () => setBattery(b));
    }).catch(simBattery);
  } else {
    simBattery();
  }

  /* ──────────────────────────────────────────────────────────
     SYSTEM DIAGNOSTICS — simulated live gauges
     ────────────────────────────────────────────────────────── */
  const cpuArc = document.getElementById('cpuArc');
  const ramArc = document.getElementById('ramArc');
  const gpuArc = document.getElementById('gpuArc');
  const cpuVal = document.getElementById('cpuVal');
  const ramVal = document.getElementById('ramVal');
  const gpuVal = document.getElementById('gpuVal');
  const netBar = document.getElementById('netBar');
  const diskBar = document.getElementById('diskBar');
  const tempBar = document.getElementById('tempBar');
  const netVal = document.getElementById('netVal');
  const diskVal = document.getElementById('diskVal');
  const tempVal = document.getElementById('tempVal');
  const reactorOutput = document.getElementById('reactorOutput');

  const gaugeCirc = 2 * Math.PI * 50; // r=50

  function smoothRandom(prev, min, max, step) {
    const d = (Math.random() - 0.5) * step;
    return Math.min(max, Math.max(min, prev + d));
  }

  let cpu = 35, ram = 55, gpu = 25, net = 60, disk = 30, temp = 42;

  function tickDiag() {
    cpu = smoothRandom(cpu, 8, 95, 12);
    ram = smoothRandom(ram, 30, 90, 6);
    gpu = smoothRandom(gpu, 5, 80, 10);
    net = smoothRandom(net, 10, 100, 20);
    disk = smoothRandom(disk, 5, 80, 15);
    temp = smoothRandom(temp, 35, 85, 5);

    cpuArc.style.strokeDasharray = `${gaugeCirc * cpu / 100} ${gaugeCirc}`;
    ramArc.style.strokeDasharray = `${gaugeCirc * ram / 100} ${gaugeCirc}`;
    gpuArc.style.strokeDasharray = `${gaugeCirc * gpu / 100} ${gaugeCirc}`;

    cpuVal.textContent = Math.round(cpu) + '%';
    ramVal.textContent = Math.round(ram) + '%';
    gpuVal.textContent = Math.round(gpu) + '%';

    netBar.style.width = net + '%';
    diskBar.style.width = disk + '%';
    tempBar.style.width = Math.min(temp / 100 * 100, 100) + '%';

    netVal.textContent = (net * 1.2).toFixed(0) + ' Mb/s';
    diskVal.textContent = (disk * 2.5).toFixed(0) + ' MB/s';
    tempVal.textContent = Math.round(temp) + '°C';

    // Reactor output varies slightly
    reactorOutput.textContent = (3.2 + Math.random() * 0.8).toFixed(1) + ' GW';
  }
  tickDiag();
  setInterval(tickDiag, 2000);

  /* ──────────────────────────────────────────────────────────
     3D MODEL CONTROLS — speed & pause
     ────────────────────────────────────────────────────────── */
  const SPEEDS = [0.25, 0.5, 1.0, 1.5, 2.0, 3.0];

  function modelCtrl(sceneId, fasterId, slowerId, pauseId, speedId, baseDur) {
    const scene = document.getElementById(sceneId);
    let idx = 2; // 1.0×
    let paused = false;

    function apply() {
      scene.style.animationDuration = (baseDur / SPEEDS[idx]) + 's';
      document.getElementById(speedId).textContent = SPEEDS[idx].toFixed(1) + '×';
    }

    document.getElementById(fasterId).addEventListener('click', () => { if (idx < SPEEDS.length - 1) { idx++; apply(); } });
    document.getElementById(slowerId).addEventListener('click', () => { if (idx > 0) { idx--; apply(); } });
    document.getElementById(pauseId).addEventListener('click', () => {
      paused = !paused;
      scene.classList.toggle('paused', paused);
      document.getElementById(pauseId).textContent = paused ? '▶' : '⏸';
    });
  }

  modelCtrl('cubeScene', 'cubeFaster', 'cubeSlower', 'cubePause', 'cubeSpeed', 8);
  modelCtrl('pyramidScene', 'pyrFaster', 'pyrSlower', 'pyrPause', 'pyrSpeed', 10);

  /* ──────────────────────────────────────────────────────────
     WEB AUDIO HUD SOUND SYNTHESIZER
     ────────────────────────────────────────────────────────── */
  let audioCtx = null;
  let audioEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type, duration, vol = 0.05) {
    if (!audioEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) { /* ignore */ }
  }

  function playVisorChime() {
    playTone(440, 'sine', 0.1, 0.06);
    setTimeout(() => playTone(880, 'sine', 0.2, 0.08), 80);
  }

  function playLockSound() {
    playTone(1200, 'square', 0.05, 0.03);
    setTimeout(() => playTone(1600, 'square', 0.08, 0.04), 60);
  }

  function playVisionSwitch() {
    playTone(300, 'sawtooth', 0.08, 0.04);
    setTimeout(() => playTone(600, 'sine', 0.12, 0.05), 50);
  }

  function playClick() {
    playTone(800, 'sine', 0.04, 0.02);
  }

  document.addEventListener('click', initAudio, { once: true });

  const toggleAudioBtn = document.getElementById('toggleAudioSfxBtn');
  if (toggleAudioBtn) {
    toggleAudioBtn.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      toggleAudioBtn.textContent = audioEnabled ? '🔊 AUDIO: ON' : '🔇 AUDIO: OFF';
      if (audioEnabled) playVisorChime();
    });
  }

  /* ──────────────────────────────────────────────────────────
     HELMET VISOR OVERLAY & VISION MODES
     ────────────────────────────────────────────────────────── */
  const helmetVisor = document.getElementById('helmetVisor');
  const visorToggleBtn = document.getElementById('visorToggleBtn');
  const visorVisionLabel = document.getElementById('visorVisionModeLabel');
  const vmodeBtns = document.querySelectorAll('.vmode-btn');

  if (visorToggleBtn && helmetVisor) {
    visorToggleBtn.addEventListener('click', () => {
      const active = helmetVisor.classList.toggle('active');
      visorToggleBtn.classList.toggle('active', active);
      playVisorChime();
    });
  }

  vmodeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      vmodeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mode = btn.dataset.mode;
      document.body.className = '';
      if (mode !== 'normal') {
        document.body.classList.add('mode-' + mode);
      }

      if (visorVisionLabel) visorVisionLabel.textContent = mode.toUpperCase();
      playVisionSwitch();
    });
  });

  /* ──────────────────────────────────────────────────────────
     TARGETING RETICLE & LOCKING SYSTEM
     ────────────────────────────────────────────────────────── */
  const reticle = document.getElementById('targetReticle');
  const reticleTitle = document.getElementById('reticleTitle');
  const reticleSub = document.getElementById('reticleSub');
  const visorTargetStatus = document.getElementById('visorTargetStatus');
  let currentTargetEl = null;

  window.addEventListener('mousemove', e => {
    if (!reticle) return;
    reticle.style.left = e.clientX + 'px';
    reticle.style.top = e.clientY + 'px';

    const hovered = document.elementFromPoint(e.clientX, e.clientY);
    const panel = hovered ? hovered.closest('.panel') : null;

    if (panel && panel !== currentTargetEl) {
      currentTargetEl = panel;
      reticle.classList.add('locked');
      const label = panel.querySelector('.panel__label');
      const name = label ? label.textContent.trim() : 'PANEL TARGET';
      reticleTitle.textContent = name.toUpperCase();
      const dist = (0.3 + Math.random() * 0.8).toFixed(2);
      reticleSub.textContent = `DIST: ${dist}m | THREAT: NOMINAL`;
      if (visorTargetStatus) visorTargetStatus.textContent = 'LOCKED // ' + name;
      playLockSound();
    } else if (!panel && currentTargetEl) {
      currentTargetEl = null;
      reticle.classList.remove('locked');
      reticleTitle.textContent = 'SCANNING...';
      reticleSub.textContent = 'DIST: -- | THREAT: 0%';
      if (visorTargetStatus) visorTargetStatus.textContent = 'TRACKING';
    }
  });

  const sweepBtn = document.getElementById('sweepTargetBtn');
  if (sweepBtn) {
    sweepBtn.addEventListener('click', () => {
      playVisorChime();
      const panels = Array.from(document.querySelectorAll('.panel'));
      if (!panels.length) return;
      let pIdx = 0;
      const interval = setInterval(() => {
        if (pIdx >= panels.length) {
          clearInterval(interval);
          reticle.classList.remove('locked');
          reticleTitle.textContent = 'SCAN COMPLETE';
          playVisorChime();
          return;
        }
        const p = panels[pIdx];
        const rect = p.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        reticle.style.left = cx + 'px';
        reticle.style.top = cy + 'px';
        reticle.classList.add('locked');
        const label = p.querySelector('.panel__label');
        reticleTitle.textContent = label ? label.textContent.trim() : 'TARGET';
        reticleSub.textContent = `SWEEP LOCK #${pIdx + 1}`;
        playLockSound();
        pIdx++;
      }, 700);
    });
  }

  /* ──────────────────────────────────────────────────────────
     ARMOR MASK DIAGNOSTICS & SUIT SWITCHER
     ────────────────────────────────────────────────────────── */
  const suitTabs = document.querySelectorAll('.suit-tab');
  const visorArmorModel = document.getElementById('visorArmorModel');
  const hArmorVal = document.getElementById('hArmorVal');
  const hMaskState = document.getElementById('hMaskState');
  const hTgtSystems = document.getElementById('hTgtSystems');
  const helmetSvg = document.getElementById('helmetSvg');

  const SUITS = {
    mk85: {
      name: 'MARK 85',
      armor: 'GOLD-TITANIUM (NANO)',
      mask: 'SEALED (NANO-REFORGED)',
      tgt: 'NEURAL TACTICAL ALGO',
      color: '#00c3ff'
    },
    mk50: {
      name: 'MARK 50',
      armor: 'LIQUID NANO-ALLOY',
      mask: 'SEALED (ADAPTIVE)',
      tgt: 'SATELLITE SYNC',
      color: '#7b61ff'
    },
    hulkbuster: {
      name: 'HULKBUSTER (MK 44)',
      armor: 'HEAVY COMPOSITE PLATING',
      mask: 'REINFORCED BLAST VISOR',
      tgt: 'SEISMIC IMPACT TRACKING',
      color: '#ff8c42'
    },
    warmachine: {
      name: 'WAR MACHINE (MK 4)',
      armor: 'MILITARY TITANIUM MATRIX',
      mask: 'BALLISTIC HUD VISOR',
      tgt: 'MULTI-TARGET ORDNANCE',
      color: '#00ffa3'
    }
  };

  suitTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      suitTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const key = tab.dataset.suit;
      const suit = SUITS[key];
      if (!suit) return;

      if (visorArmorModel) visorArmorModel.textContent = suit.name;
      if (hArmorVal) hArmorVal.textContent = suit.armor;
      if (hMaskState) hMaskState.textContent = suit.mask;
      if (hTgtSystems) hTgtSystems.textContent = suit.tgt;

      if (helmetSvg) {
        helmetSvg.querySelectorAll('.h-path').forEach(el => {
          el.style.stroke = suit.color;
        });
      }
      playClick();
    });
  });

  /* ──────────────────────────────────────────────────────────
     SYSTEM THEMES & PALETTES LOGIC
     ────────────────────────────────────────────────────────── */
  const themeCards = document.querySelectorAll('.theme-card');
  const cpPrimary = document.getElementById('cpPrimary');
  const cpSecondary = document.getElementById('cpSecondary');
  const cpTeal = document.getElementById('cpTeal');
  const resetThemeColorsBtn = document.getElementById('resetThemeColorsBtn');

  function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    themeCards.forEach(card => {
      card.classList.toggle('active', card.dataset.theme === themeName);
    });
    localStorage.setItem('stark_theme', themeName);
    clearCustomColors();
    updateColorPickersFromComputed();
    playVisionSwitch();
  }

  function updateColorPickersFromComputed() {
    setTimeout(() => {
      const computed = getComputedStyle(document.documentElement);
      const cyan = computed.getPropertyValue('--cyan').trim();
      const purple = computed.getPropertyValue('--purple').trim();
      const teal = computed.getPropertyValue('--teal').trim();

      if (cpPrimary && cyan.startsWith('#')) cpPrimary.value = cyan;
      if (cpSecondary && purple.startsWith('#')) cpSecondary.value = purple;
      if (cpTeal && teal.startsWith('#')) cpTeal.value = teal;
    }, 50);
  }

  function clearCustomColors() {
    document.documentElement.style.removeProperty('--cyan');
    document.documentElement.style.removeProperty('--cyan-glow');
    document.documentElement.style.removeProperty('--purple');
    document.documentElement.style.removeProperty('--purple-glow');
    document.documentElement.style.removeProperty('--teal');
    document.documentElement.style.removeProperty('--teal-glow');
    localStorage.removeItem('stark_custom_colors');
  }

  function applyCustomColor(propName, hexVal) {
    document.documentElement.style.setProperty(propName, hexVal);
    const r = parseInt(hexVal.slice(1,3), 16), g = parseInt(hexVal.slice(3,5), 16), b = parseInt(hexVal.slice(5,7), 16);
    if (!isNaN(r)) {
      document.documentElement.style.setProperty(propName + '-glow', `rgba(${r},${g},${b},0.4)`);
    }
  }

  themeCards.forEach(card => {
    card.addEventListener('click', () => applyTheme(card.dataset.theme));
  });

  if (cpPrimary) {
    cpPrimary.addEventListener('input', e => {
      applyCustomColor('--cyan', e.target.value);
    });
  }
  if (cpSecondary) {
    cpSecondary.addEventListener('input', e => {
      applyCustomColor('--purple', e.target.value);
    });
  }
  if (cpTeal) {
    cpTeal.addEventListener('input', e => {
      applyCustomColor('--teal', e.target.value);
    });
  }

  if (resetThemeColorsBtn) {
    resetThemeColorsBtn.addEventListener('click', () => {
      clearCustomColors();
      updateColorPickersFromComputed();
      playClick();
    });
  }

  const savedTheme = localStorage.getItem('stark_theme') || 'stark';
  applyTheme(savedTheme);

})();


