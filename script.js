function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const btn  = document.getElementById('hamburger');
  const isOpen = menu.classList.contains('open');
  menu.classList.toggle('open', !isOpen);
  btn.classList.toggle('open', !isOpen);
  btn.setAttribute('aria-expanded', !isOpen);
  // Zamknout scroll stránky při otevřeném menu
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('hamburger').setAttribute('aria-expanded', false);
  document.body.style.overflow = '';
}

// Zavřít menu kliknutím mimo
document.addEventListener('click', function(e) {
  const menu = document.getElementById('mobileMenu');
  const btn  = document.getElementById('hamburger');
  if (menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) {
    closeMobileMenu();
  }
});

// Otevře konkrétní kartu služby a sbalí ostatní (jen jedna karta otevřená zároveň)
function openSvcCard(card) {
  document.querySelectorAll('.svc-card').forEach(c => {
    const isTarget = c === card;
    c.classList.toggle('open', isTarget);
    const btn = c.querySelector('.svc-card-more');
    const detail = c.querySelector('.svc-detail');
    if (btn) btn.innerHTML = isTarget
      ? 'Skrýt podrobnosti <i class="ti ti-chevron-up" aria-hidden="true"></i>'
      : 'Podrobnosti <i class="ti ti-chevron-down" aria-hidden="true"></i>';
    if (detail) detail.style.maxHeight = isTarget ? detail.scrollHeight + 'px' : '0px';
  });
}

function toggleSvc(card) {
  if (card.classList.contains('open')) {
    card.classList.remove('open');
    const btn = card.querySelector('.svc-card-more');
    if (btn) btn.innerHTML = 'Podrobnosti <i class="ti ti-chevron-down" aria-hidden="true"></i>';
    const detail = card.querySelector('.svc-detail');
    if (detail) detail.style.maxHeight = '0px';
  } else {
    openSvcCard(card);
  }
}

// Na stránce Služby: pokud adresa obsahuje #svc-..., rovnou otevřít a odscrollovat na danou službu
(function openServiceFromHash() {
  if (!location.hash) return;
  const target = document.getElementById(location.hash.slice(1));
  if (!target || !target.classList.contains('svc-card')) return;
  openSvcCard(target);
  requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
})();

// Na stránce Konzultace: pokud adresa obsahuje #klíč-služby, předvyplnit "O co jde?"
(function preselectConsultService() {
  const btns = document.querySelectorAll('#consultForm .svc-btn');
  if (!btns.length) return;
  const key = location.hash ? location.hash.slice(1) : 'poradit';
  let matched = false;
  btns.forEach(b => {
    const isMatch = b.dataset.svc === key;
    b.classList.toggle('sel', isMatch);
    if (isMatch) matched = true;
  });
  if (!matched) {
    btns.forEach(b => b.classList.toggle('sel', b.dataset.svc === 'poradit'));
  }
})();

// Tlačítko zpět nahoru — zobrazí se po odscrollování dolů
window.addEventListener('scroll', () => {
  document.getElementById('backToTop').classList.toggle('visible', window.scrollY > 400);
});

// Jemné zjevení karet a sekcí při scrollování
const revealSelectors = [
  '.home-svc-card', '.svc-card', '.cert-card', '.review-card', '.step-card',
  '.value-card', '.portfolio-card', '.testimonial-mini', '.ref-review-card',
  '.about-story-left p', '.legal-content h2'
];
document.querySelectorAll(revealSelectors.join(',')).forEach(el => el.classList.add('reveal'));

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -10px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
}

// Odeslání formulářů přes Web3Forms — bez opuštění stránky
function submitWeb3Form(event, formId, msgId) {
  event.preventDefault();
  const form = document.getElementById(formId);
  const msg = document.getElementById(msgId);
  const btn = form.querySelector('.submit-btn');

  // U poptávkového formuláře doplnit vybranou službu do skrytého pole
  const svcHidden = form.querySelector('#svcHidden');
  if (svcHidden) {
    const selected = Array.from(form.querySelectorAll('.svc-btn.sel .svc-btn-title')).map(el => el.textContent.trim());
    svcHidden.value = selected.join(', ') || '—';
  }

  const originalBtnText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Odesílám…';
  msg.classList.remove('show', 'success', 'error');

  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: new FormData(form)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showFormAlert(msg, 'success', 'ti-circle-check', 'Díky, zpráva byla úspěšně odeslána. Ozvu se vám co nejdřív.');
        form.reset();
      } else {
        throw new Error(data.message || 'Odeslání se nezdařilo');
      }
    })
    .catch(() => {
      showFormAlert(msg, 'error', 'ti-alert-circle', 'Odeslání se nepovedlo. Zkuste to prosím znovu nebo mi zavolejte / napište přímo na e-mail.');
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = originalBtnText;
    });

  return false;
}

function showFormAlert(el, type, iconClass, text) {
  el.querySelector('i').className = 'ti ' + iconClass;
  el.querySelector('span').textContent = text;
  el.classList.add('show', type);
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Google Analytics — načte se až po souhlasu s cookies
const GA_MEASUREMENT_ID = 'G-XN3QYCCZM2';

function loadGoogleAnalytics() {
  if (window.gaLoaded) return;
  window.gaLoaded = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
}

function setCookieConsent(accepted) {
  try { localStorage.setItem('cookie_consent', accepted ? 'accepted' : 'rejected'); } catch (e) {}
  document.getElementById('cookieBanner').classList.remove('show');
  if (accepted) loadGoogleAnalytics();
}

function reopenCookieBanner() {
  document.getElementById('cookieBanner').classList.add('show');
}

(function initCookieConsent() {
  let consent = null;
  try { consent = localStorage.getItem('cookie_consent'); } catch (e) {}
  if (consent === 'accepted') {
    loadGoogleAnalytics();
  } else if (consent === null) {
    document.getElementById('cookieBanner').classList.add('show');
  }
})();
