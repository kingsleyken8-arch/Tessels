(() => {
  /* ------------------------------------------------------------------
     DEMO FORM: paste your n8n webhook address between the quotes below.
     Use the Production URL of the Webhook node (method POST).
     While this is empty the form validates but tells the visitor it is
     not connected, and nothing is sent anywhere.
     ------------------------------------------------------------------ */
  const N8N_WEBHOOK_URL = '';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $$('[data-dup]').forEach(el => { el.innerHTML += el.innerHTML; });

  /* ---------- smooth scrolling ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: .09, smoothWheel: true, anchors: false });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const go = top => { if (lenis) { lenis.start(); lenis.scrollTo(top, { duration: 1.3, force: true }); } else scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' }); };

  /* ---------- reveal and count on view ---------- */
  const countUp = el => {
    const to = +el.dataset.count, dec = +(el.dataset.dec || 0), suf = el.dataset.suf || '', sep = el.dataset.sep;
    const fmt = v => (sep ? Math.round(v).toLocaleString('en-US') : v.toFixed(dec)) + suf;
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    (function tick(t) { const p = clamp((t - t0) / 1400); el.textContent = fmt(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(tick); })(t0);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    $$('[data-count]', e.target).forEach(countUp);
  }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* ---------- scroll driven scenes ---------- */
  const stage = $('.stage'), how = $('.how'), steps = $$('.step'), shots = $$('.shot');
  const spot = $('.spot .vis'), card = $('.spot .card'), stories = $$('.story figure'), mark = $('.foot-scene');
  const themed = $$('[data-theme]');
  const INTRO = .08;
  let cur = -1;

  function frame() {
    const vh = innerHeight, pinned = innerWidth > 960;

    // hero: the stage settles into place and the window rises a little
    const sr = stage.getBoundingClientRect();
    const hp = clamp((vh - sr.top) / (vh * .9));
    stage.style.setProperty('--hs', (.94 + .06 * ease(hp)).toFixed(4));
    stage.style.setProperty('--hy', clamp(-sr.top / sr.height + .4).toFixed(3));

    // how it works: white turns dark while pinned, and the steps advance
    if (pinned) {
      const r = how.getBoundingClientRect(), total = how.offsetHeight - vh;
      const p = clamp(-r.top / total);
      const fadeIn = ease(clamp((vh * .55 - r.top) / (vh * .55)));          // darkens as it arrives
      const fadeOut = ease(clamp((r.bottom - vh * .35) / (vh * .65)));      // lightens as it leaves
      const e = Math.min(fadeIn, fadeOut);
      how.style.setProperty('--e', e.toFixed(4));
      how.dataset.theme = e > .5 ? 'dark' : 'light';
      const s = Math.min(3, Math.floor(clamp((p - INTRO) / (1 - INTRO)) * 4));
      if (s !== cur) { cur = s; steps.forEach((b, i) => b.classList.toggle('on', i === s)); shots.forEach((b, i) => b.classList.toggle('on', i === s)); }
    } else { how.dataset.theme = 'dark'; }

    // spotlight card slides up into its panel
    const cr = spot.getBoundingClientRect();
    card.style.setProperty('--sp', ease(clamp((vh - cr.top) / (vh * .8))).toFixed(3));

    // gentle parallax on the customer photos and the footer wordmark
    stories.forEach(f => { const b = f.getBoundingClientRect(); f.firstElementChild.style.setProperty('--py', clamp((vh - b.top) / (vh + b.height)).toFixed(3)); });
    const mr = mark.getBoundingClientRect();
    mark.style.setProperty('--f', clamp((vh - mr.top) / mr.height).toFixed(3));

    document.body.toggleAttribute('data-top', scrollY < 24);

    // nav colour follows the section beneath it
    let theme = 'light';
    for (const el of themed) { const b = el.getBoundingClientRect(); if (b.top <= 40 && b.bottom > 40) theme = el.dataset.theme; }
    if (document.body.dataset.nav !== theme) document.body.dataset.nav = theme;
  }
  let queued = false;
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; frame(); }); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  frame();

  steps.forEach(b => b.addEventListener('click', () => {
    if (innerWidth <= 960) return;
    const total = how.offsetHeight - innerHeight;
    go(how.offsetTop + total * (INTRO + (1 - INTRO) * ((+b.dataset.s + .5) / 4)));
  }));

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = document.getElementById(a.getAttribute('href').slice(1));
    if (!t) return; e.preventDefault();
    go(t.getBoundingClientRect().top + scrollY - (t.id === 'top' ? 0 : 63));
  }));

  /* ---------- menus: hover or click on desktop, accordion inside the mobile menu ---------- */
  const menus = $$('.has-menu'), burger = $('.burger'), isMobile = () => innerWidth <= 960;
  const setOpen = (m, on) => { m.classList.toggle('open', on); $('.nl', m).setAttribute('aria-expanded', on); };
  const closeAll = except => menus.forEach(m => m !== except && setOpen(m, false));
  const setMenu = on => {
    document.body.classList.toggle('menu-open', on);
    burger.setAttribute('aria-expanded', on); burger.setAttribute('aria-label', on ? 'Close menu' : 'Open menu');
    if (lenis) on ? lenis.stop() : lenis.start();
    if (!on) closeAll();
  };
  menus.forEach(m => {
    let timer;
    m.addEventListener('mouseenter', () => { if (isMobile()) return; clearTimeout(timer); closeAll(m); setOpen(m, true); });
    m.addEventListener('mouseleave', () => { if (isMobile()) return; timer = setTimeout(() => setOpen(m, false), 140); });
    $('.nl', m).addEventListener('click', () => { const on = !m.classList.contains('open'); if (!isMobile()) closeAll(m); setOpen(m, on); });
    m.addEventListener('focusout', e => { if (!isMobile() && !m.contains(e.relatedTarget)) setOpen(m, false); });
  });
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeAll(); setMenu(false); } });
  document.addEventListener('click', e => { if (!isMobile() && !e.target.closest('.has-menu')) closeAll(); });
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => { closeAll(); setMenu(false); }));
  addEventListener('resize', () => { if (!isMobile() && document.body.classList.contains('menu-open')) setMenu(false); });

  /* ---------- demo form ---------- */
  const form = $('#demo-form');
  if (form) {
    const status = $('.form-status', form), btn = $('button[type=submit]', form);
    // one id per filled-in form, reused on retries, so the workflow can ignore duplicates
    let submissionId = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random().toString(16).slice(2);
    const say = (kind, text) => { status.className = 'form-status show ' + kind; status.textContent = text; };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); say('err', 'Please fill in every field, with a valid work email.'); return; }
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.website) return;                       // filled by bots only
      delete data.website;
      if (!N8N_WEBHOOK_URL) { say('err', 'This form is not connected yet. Add the n8n webhook address at the top of script.js and it will start sending.'); return; }

      btn.disabled = true; btn.textContent = 'Sending…'; status.className = 'form-status';
      try {
        const res = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, submission_id: submissionId, submitted_at: new Date().toISOString(), source: location.href })
        });
        if (!res.ok) throw new Error('Webhook answered ' + res.status);
        form.innerHTML = '<div class="done"><h3>Thank you.</h3><p>Your request is in. A person will reply within one working day.</p></div>';
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Request a demo';
        say('err', 'That did not go through. Please try again in a moment.');
      }
    });
  }
})();
