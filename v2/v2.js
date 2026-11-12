(() => {
  // DEMO FORM: paste your n8n webhook Production URL between the quotes (method POST).
  const N8N_WEBHOOK_URL = '';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- smooth scrolling ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: .09, smoothWheel: true, anchors: false });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const go = top => { if (lenis) { lenis.start(); lenis.scrollTo(top, { duration: 1.3, force: true }); } else scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' }); };

  /* ---------- reveal on view ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* ---------- tabs: click to choose, or let them advance on their own while in view ---------- */
  const tabs = $$('.tab'), panes = $$('.pane'), tabSec = $('.walk');
  const DWELL = 6500; let cur = 0, timer = null, seen = false, held = false;
  const show = i => {
    cur = i;
    tabs.forEach((t, k) => { t.classList.remove('on'); t.setAttribute('aria-selected', k === i); });
    panes.forEach((p, k) => p.classList.toggle('on', k === i));
    void tabs[i].offsetWidth; tabs[i].classList.add('on');            // restarts the progress line
  };
  const cycle = () => { clearInterval(timer); if (!reduce && seen && !held) timer = setInterval(() => show((cur + 1) % tabs.length), DWELL); };
  tabs.forEach((t, i) => t.addEventListener('click', () => { show(i); cycle(); }));
  tabSec.addEventListener('mouseenter', () => { held = true; tabSec.classList.add('held'); cycle(); });
  tabSec.addEventListener('mouseleave', () => { held = false; tabSec.classList.remove('held'); cycle(); });
  new IntersectionObserver(es => { seen = es[0].isIntersecting; tabSec.classList.toggle('seen', seen); if (seen) show(cur); cycle(); }, { threshold: .3 }).observe(tabSec);

  /* ---------- small scroll touches ---------- */
  const vis = $('.h2-vis'), scene = $('.foot-scene');
  function frame() {
    const vh = innerHeight;
    document.body.toggleAttribute('data-top', scrollY < 24);
    if (vis && innerWidth > 960) vis.style.setProperty('--sy', (clamp(scrollY / vh) * -36).toFixed(1) + 'px');
    if (scene) { const r = scene.getBoundingClientRect(); scene.style.setProperty('--f', clamp((vh - r.top) / r.height).toFixed(3)); }
  }
  let queued = false;
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; frame(); }); } };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); frame();

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = document.getElementById(a.getAttribute('href').slice(1));
    if (!t) return; e.preventDefault();
    go(t.getBoundingClientRect().top + scrollY - (t.id === 'top' ? 0 : 84));
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
