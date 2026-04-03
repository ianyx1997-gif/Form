/* ============================================================
   ZEBRA TOUR – PRICE WATCHER (Frontend)
   Adds "Urmareste pretul" button in wishlist & on tour results
   Sends data to backend API for price tracking & email alerts
   ============================================================ */

(function() {
  'use strict';

  // ===== CONFIG — change this to your Railway backend URL =====
  var PW_API_URL = 'https://web-production-a7362.up.railway.app';
  var PW_WISHLIST_KEY = 'zebra_wishlist';
  var PW_EMAIL_KEY = 'pw_user_email'; // remember email in localStorage

  // ===== TOAST =====
  function pwToast(msg) {
    var existing = document.getElementById('pwToast');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.id = 'pwToast';
    t.className = 'pw-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.classList.add('pw-toast-show'); }, 10);
    setTimeout(function() {
      t.classList.remove('pw-toast-show');
      setTimeout(function() { t.remove(); }, 300);
    }, 2500);
  }

  // ===== CLOSE MODAL =====
  function closePwModal() {
    var overlay = document.getElementById('pwModalOverlay');
    if (overlay) {
      overlay.classList.remove('pw-modal-open');
      setTimeout(function() { overlay.remove(); }, 300);
    }
  }

  // ===== GET SAVED EMAIL =====
  function getSavedEmail() {
    try { return localStorage.getItem(PW_EMAIL_KEY) || ''; }
    catch(e) { return ''; }
  }

  function saveEmail(email) {
    try { localStorage.setItem(PW_EMAIL_KEY, email); }
    catch(e) {}
  }

  // ===== EXTRACT TOUR DATA FROM RESULT CARD =====
  function extractTourFromCard(card) {
    var tour = {};

    // Try to find data from the card's elements
    var nameEl = card.querySelector('.hotel-name, .tour-name, [class*="hotel"], h3, h4');
    if (nameEl) tour.name = nameEl.textContent.trim();

    var priceEl = card.querySelector('.price, .tour-price, [class*="price"]');
    if (priceEl) {
      var priceText = priceEl.textContent.replace(/[^\d.,]/g, '').replace(',', '.');
      tour.price = parseFloat(priceText);
    }

    var imgEl = card.querySelector('img');
    if (imgEl) tour.img = imgEl.src;

    var linkEl = card.querySelector('a[href*="tour"], a[href*="hotel"]');
    if (linkEl) tour.link = linkEl.href;

    // Try to extract tour ID from link or data attribute
    var idAttr = card.getAttribute('data-tour-id') || card.getAttribute('data-id');
    if (idAttr) {
      tour.id = idAttr;
    } else if (tour.link) {
      var idMatch = tour.link.match(/\/(\d+)/);
      if (idMatch) tour.id = idMatch[1];
    }

    return tour;
  }

  // ===== OPEN WATCH MODAL =====
  function openWatchModal(tour) {
    closePwModal();

    if (!tour || !tour.price) {
      pwToast('Nu s-a putut determina pretul turului');
      return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'pwModalOverlay';
    overlay.className = 'pw-modal-overlay';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePwModal();
    });

    var modal = document.createElement('div');
    modal.className = 'pw-modal';

    // Header
    var header = document.createElement('div');
    header.className = 'pw-modal-header';
    header.innerHTML = '<span class="pw-modal-title">🔔 Urmareste pretul</span>';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'pw-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closePwModal);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // Body
    var body = document.createElement('div');
    body.className = 'pw-modal-body';

    // Tour info
    var tourInfo = document.createElement('div');
    tourInfo.className = 'pw-tour-info';
    var html = '<div class="pw-tour-name">' + (tour.name || 'Hotel') + '</div>';
    html += '<div class="pw-tour-price">' + (tour.price || '') + (tour.currency ? ' ' + tour.currency : '') + '</div>';
    if (tour.geo) html += '<div class="pw-tour-detail">📍 ' + tour.geo + '</div>';
    if (tour.dates) html += '<div class="pw-tour-detail">📅 ' + tour.dates + '</div>';
    tourInfo.innerHTML = html;
    body.appendChild(tourInfo);

    // Email input
    var inputGroup = document.createElement('div');
    inputGroup.className = 'pw-input-group';
    var label = document.createElement('label');
    label.className = 'pw-input-label';
    label.textContent = 'Email-ul tau:';
    label.setAttribute('for', 'pwEmailInput');
    inputGroup.appendChild(label);

    var emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'pwEmailInput';
    emailInput.className = 'pw-email-input';
    emailInput.placeholder = 'exemplu@email.com';
    emailInput.value = getSavedEmail();
    inputGroup.appendChild(emailInput);
    body.appendChild(inputGroup);

    // Submit button
    var submitBtn = document.createElement('button');
    submitBtn.className = 'pw-submit-btn';
    submitBtn.textContent = '🔔 Activeaza urmarirea pretului';
    submitBtn.addEventListener('click', function() {
      var email = emailInput.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        pwToast('Introdu un email valid');
        emailInput.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Se trimite...';
      saveEmail(email);

      // Send to API
      var payload = {
        email: email,
        tourId: tour.id || tour.name || 'unknown',
        tourName: tour.name || null,
        tourUrl: tour.link || null,
        tourImg: tour.img || null,
        price: tour.price,
        currency: tour.currency || 'USD',
        geo: tour.geo || null,
        dates: tour.dates || null,
        stars: tour.stars || null,
        food: tour.food || null
      };

      fetch(PW_API_URL + '/api/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function(resp) { return resp.json(); })
      .then(function(data) {
        if (data.success) {
          body.innerHTML = '';
          var success = document.createElement('div');
          success.className = 'pw-success-msg';
          success.innerHTML =
            '<div class="pw-success-icon">✅</div>' +
            '<div class="pw-success-text">Urmarirea pretului activata!</div>' +
            '<div class="pw-success-sub">Vei primi o notificare pe <strong>' + email + '</strong> cand pretul se schimba cu mai mult de 3%.</div>';
          body.appendChild(success);

          setTimeout(closePwModal, 3000);
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = '🔔 Activeaza urmarirea pretului';
          pwToast(data.error || 'Eroare. Incearca din nou.');
        }
      })
      .catch(function() {
        submitBtn.disabled = false;
        submitBtn.textContent = '🔔 Activeaza urmarirea pretului';
        pwToast('Eroare de conexiune. Incearca din nou.');
      });
    });
    body.appendChild(submitBtn);

    // Hint
    var hint = document.createElement('div');
    hint.className = 'pw-hint';
    hint.textContent = 'Verificam pretul la fiecare ora. Te poti dezabona oricand din email.';
    body.appendChild(hint);

    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    setTimeout(function() { overlay.classList.add('pw-modal-open'); }, 10);

    // Focus email input if empty
    if (!emailInput.value) {
      setTimeout(function() { emailInput.focus(); }, 400);
    }
  }

  // ===== BELL ICON SVG =====
  var bellSvg = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>';

  // ===== ADD WATCH BUTTON TO WISHLIST ITEMS =====
  function addWatchButtonsToWishlist() {
    var panel = document.getElementById('zebraWishlistPanel');
    if (!panel) return;

    var items = panel.querySelectorAll('.zebra-wishlist-item');
    items.forEach(function(item) {
      if (item.querySelector('.pw-watch-btn')) return; // already has button

      // Get tour data from the wishlist item
      var tour = {};
      try {
        var wishlist = JSON.parse(localStorage.getItem(PW_WISHLIST_KEY)) || [];
        // Try to match by index or name
        var idx = Array.prototype.indexOf.call(item.parentElement.children, item);
        if (wishlist[idx]) tour = wishlist[idx];
      } catch(e) {}

      if (!tour.price) return;

      var btn = document.createElement('button');
      btn.className = 'pw-watch-btn';
      btn.innerHTML = bellSvg + ' Urmareste pretul';
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        openWatchModal(tour);
      });

      // Insert button near the price or at the bottom of the item
      var priceEl = item.querySelector('.zebra-wishlist-price, [class*="price"]');
      if (priceEl) {
        priceEl.parentNode.insertBefore(btn, priceEl.nextSibling);
      } else {
        item.appendChild(btn);
      }
    });
  }

  // ===== ADD WATCH BUTTON TO TOUR RESULT CARDS =====
  function addWatchButtonsToResults() {
    // Common selectors for Otpusk widget result cards
    var cards = document.querySelectorAll('.otpusk-result, .tour-card, .result-item, [class*="result-card"], [class*="tour-item"]');

    cards.forEach(function(card) {
      if (card.querySelector('.pw-result-watch-btn')) return; // already has button

      var tour = extractTourFromCard(card);
      if (!tour.price) return;

      var btn = document.createElement('button');
      btn.className = 'pw-result-watch-btn';
      btn.innerHTML = bellSvg + ' Urmareste pretul';
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        openWatchModal(tour);
      });

      // Try to insert near the price/action area
      var actionArea = card.querySelector('.tour-actions, .result-actions, [class*="actions"], [class*="buttons"]');
      if (actionArea) {
        actionArea.appendChild(btn);
      } else {
        card.appendChild(btn);
      }
    });
  }

  // ===== WATCH FOR DOM CHANGES =====
  function watchForChanges() {
    var observer = new MutationObserver(function() {
      // Re-inject buttons when DOM changes (new results loaded, wishlist opened)
      var panel = document.getElementById('zebraWishlistPanel');
      if (panel && panel.classList.contains('open')) {
        setTimeout(addWatchButtonsToWishlist, 200);
      }
      setTimeout(addWatchButtonsToResults, 200);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  // ===== INIT =====
  function initPriceWatcher() {
    watchForChanges();
    // Try to inject immediately and after delays (for async-loaded content)
    setTimeout(addWatchButtonsToWishlist, 2000);
    setTimeout(addWatchButtonsToResults, 2000);
    setTimeout(addWatchButtonsToWishlist, 5000);
    setTimeout(addWatchButtonsToResults, 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPriceWatcher);
  } else {
    initPriceWatcher();
  }
})();
