/* ============================================================
   ZEBRA TOUR – PRICE WATCHER (Frontend)
   Adds "Urmareste pretul" button on tour results
   Sends data + search params to backend for price tracking
   ============================================================ */
(function() {
  'use strict';

  // ===== CONFIG — change this to your Railway backend URL =====
  var PW_API_URL = 'https://web-production-a7362.up.railway.app';
  var PW_WISHLIST_KEY = 'zebra_wishlist';
  var PW_EMAIL_KEY = 'pw_user_email';
  var PW_TELEGRAM_BOT = 'zebrapricebot'; // Telegram bot username (without @)

  // ===== INJECT CSS =====
  (function injectStyles() {
    var style = document.createElement('style');
    style.textContent = '' +
      /* Toast */
      '.pw-toast{position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(20px);background:#1e293b;color:#fff;padding:12px 24px;border-radius:10px;font-size:14px;font-family:Arial,sans-serif;z-index:999999;opacity:0;transition:opacity .3s,transform .3s;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,.15)}' +
      '.pw-toast-show{opacity:1;transform:translateX(-50%) translateY(0)}' +
      /* Modal overlay */
      '.pw-modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .3s}' +
      '.pw-modal-overlay.pw-modal-open{opacity:1}' +
      /* Modal box */
      '.pw-modal{background:#fff;border-radius:16px;width:90%;max-width:420px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2);font-family:Arial,sans-serif;transform:scale(.95);transition:transform .3s}' +
      '.pw-modal-open .pw-modal{transform:scale(1)}' +
      /* Header */
      '.pw-modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e2e8f0}' +
      '.pw-modal-title{font-size:16px;font-weight:700;color:#1e293b}' +
      '.pw-modal-close{background:none;border:none;font-size:24px;color:#94a3b8;cursor:pointer;padding:0 4px;line-height:1}' +
      '.pw-modal-close:hover{color:#475569}' +
      /* Body */
      '.pw-modal-body{padding:20px}' +
      /* Tour info */
      '.pw-tour-info{margin-bottom:16px}' +
      '.pw-tour-name{font-size:15px;font-weight:700;color:#1e293b;margin-bottom:4px}' +
      '.pw-tour-price{font-size:20px;font-weight:800;color:#3b82f6;margin-bottom:6px}' +
      '.pw-tour-detail{font-size:13px;color:#64748b;margin-bottom:2px}' +
      /* Telegram button */
      '.pw-telegram-btn{display:flex;align-items:center;justify-content:center;width:100%;padding:12px 16px;background:#0088cc;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;font-family:Arial,sans-serif;text-decoration:none;cursor:pointer;transition:background .2s;box-sizing:border-box}' +
      '.pw-telegram-btn:hover{background:#006da3;color:#fff;text-decoration:none}' +
      /* Separator */
      '.pw-separator{display:flex;align-items:center;margin:14px 0;color:#94a3b8;font-size:13px}' +
      '.pw-separator::before,.pw-separator::after{content:"";flex:1;border-bottom:1px solid #e2e8f0}' +
      '.pw-separator span{padding:0 10px}' +
      /* Input */
      '.pw-input-group{margin-bottom:12px}' +
      '.pw-input-label{display:block;font-size:13px;font-weight:600;color:#475569;margin-bottom:4px}' +
      '.pw-email-input{width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;transition:border-color .2s}' +
      '.pw-email-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1)}' +
      /* Submit */
      '.pw-submit-btn{width:100%;padding:12px;background:#3b82f6;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;transition:background .2s;font-family:Arial,sans-serif}' +
      '.pw-submit-btn:hover{background:#2563eb}' +
      '.pw-submit-btn:disabled{background:#94a3b8;cursor:not-allowed}' +
      /* Hint */
      '.pw-hint{text-align:center;font-size:11px;color:#94a3b8;margin-top:12px}' +
      /* Success */
      '.pw-success-msg{text-align:center;padding:20px 0}' +
      '.pw-success-icon{font-size:40px;margin-bottom:10px}' +
      '.pw-success-text{font-size:16px;font-weight:700;color:#1e293b;margin-bottom:6px}' +
      '.pw-success-sub{font-size:13px;color:#64748b;line-height:1.5}' +
      /* Watch buttons on result cards */
      '.pw-watch-btn,.pw-result-watch-btn{display:flex;align-items:center;justify-content:center;gap:4px;padding:6px 12px;background:#f0f9ff;color:#3b82f6;border:1px solid #bfdbfe;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:Arial,sans-serif;margin-bottom:6px;width:100%;box-sizing:border-box}' +
      '.pw-watch-btn:hover,.pw-result-watch-btn:hover{background:#3b82f6;color:#fff;border-color:#3b82f6}';
    document.head.appendChild(style);
  })();

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

  // ===== GET/SAVE EMAIL =====
  function getSavedEmail() {
    try { return localStorage.getItem(PW_EMAIL_KEY) || ''; } catch(e) { return ''; }
  }
  function saveEmail(email) {
    try { localStorage.setItem(PW_EMAIL_KEY, email); } catch(e) {}
  }

  // ===== BUILD TELEGRAM DEEP LINK PAYLOAD =====
  // Encodes tour data into a compact string for Telegram /start deep link
  // Format: countryId_deptCity_checkIn_nights_adults_childAges_stars_food_maxPrice
  // Convert DD.MM.YYYY to YYYYMMDD for the Telegram payload
  function dmyToYmd(dmy) {
    if (!dmy) return null;
    var m = dmy.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
    if (!m) return null;
    return m[3] + m[2].padStart(2, '0') + m[1].padStart(2, '0');
  }

  function encodeTelegramPayload(tour, searchParams) {
    var parts = [];
    if (searchParams && searchParams.countryId) {
      parts.push(searchParams.countryId);                           // 0: country
      parts.push(searchParams.deptCity || '1831');                  // 1: departure

      // USE tour-specific date (od=) if available, otherwise fall back to search engine date
      var checkInYmd = null;
      if (tour.offerDate) {
        checkInYmd = dmyToYmd(tour.offerDate);
      }
      if (!checkInYmd) {
        checkInYmd = (searchParams.checkIn || '').replace(/-/g, '');
      }
      parts.push(checkInYmd || '0');                                // 2: checkIn YYYYMMDD

      // USE tour-specific nights (ol=) if available, otherwise fall back to search engine nights
      var nights = tour.offerNights || searchParams.length || '7';
      parts.push(String(nights));                                   // 3: nights

      parts.push(searchParams.people || '2');                       // 4: people (Otpusk format)
      parts.push(searchParams.stars || '0');                        // 5: stars
      parts.push(searchParams.food || 'any');                       // 6: food
      parts.push(tour.price ? Math.round(tour.price) : '0');       // 7: price
      parts.push(searchParams.transport || 'air');                  // 8: transport
    } else {
      // Fallback: minimal info
      parts.push(tour.id || '0');
      parts.push('1831');
      parts.push('0');
      parts.push(tour.offerNights ? String(tour.offerNights) : '7');
      parts.push('2');
      parts.push('0');
      parts.push('any');
      parts.push(tour.price ? Math.round(tour.price) : '0');
      parts.push('air');
    }
    return parts.join('_');
  }

  // ===== EXTRACT SEARCH PARAMS FROM WIDGET =====
  // Strategy 1: Performance API (Otpusk search URLs)
  // Strategy 2: Otpusk widget global state (window.OtpuskWidget or similar)
  // Strategy 3: Page URL parameters as last resort
  function extractSearchParams() {
    var result = null;

    // Strategy 1: Performance API
    try {
      var entries = performance.getEntriesByType('resource');
      var searchEntries = entries.filter(function(e) {
        return e.name.indexOf('otpusk.com') > -1 &&
               (e.name.indexOf('tours/search') > -1 || e.name.indexOf('search?') > -1);
      });

      if (searchEntries.length > 0) {
        var lastSearch = searchEntries[searchEntries.length - 1];
        var url = new URL(lastSearch.name);
        var params = {};
        var keys = ['to', 'checkIn', 'checkTo', 'length', 'lengthTo', 'people', 'food', 'transport', 'stars', 'deptCity', 'currencyLocal', 'rating', 'price', 'priceTo', 'services'];
        keys.forEach(function(k) {
          var v = url.searchParams.get(k);
          if (v !== null && v !== '') params[k] = v;
        });

        if (params.to) {
          result = {
            countryId: params.to,
            checkIn: params.checkIn || null,
            checkTo: params.checkTo || params.checkIn || null,
            length: params.length || '7',
            lengthTo: params.lengthTo || '',
            people: params.people || '2',
            food: params.food || '',
            transport: params.transport || 'air',
            stars: params.stars || '',
            deptCity: params.deptCity || '1831',
            currencyLocal: params.currencyLocal || 'eur',
            price: params.price || '',
            priceTo: params.priceTo || ''
          };
          console.log('[PriceWatcher] Search params from Performance API:', JSON.stringify(result));
          return result;
        }
      }
    } catch(e) {
      console.log('[PriceWatcher] Performance API failed:', e.message);
    }

    // Strategy 2: Look for Otpusk widget state in the DOM
    try {
      // The widget often stores params in data attributes or global vars
      var widgetEl = document.querySelector('[data-otpusk-to], [data-country], .otpusk-widget[data-to]');
      if (widgetEl) {
        var to = widgetEl.getAttribute('data-otpusk-to') || widgetEl.getAttribute('data-to') || widgetEl.getAttribute('data-country');
        if (to) {
          result = {
            countryId: to,
            checkIn: widgetEl.getAttribute('data-checkin') || null,
            checkTo: widgetEl.getAttribute('data-checkto') || null,
            length: widgetEl.getAttribute('data-length') || '7',
            people: widgetEl.getAttribute('data-people') || '2',
            food: widgetEl.getAttribute('data-food') || '',
            transport: widgetEl.getAttribute('data-transport') || 'air',
            stars: widgetEl.getAttribute('data-stars') || '',
            deptCity: widgetEl.getAttribute('data-deptcity') || '1831',
            currencyLocal: 'eur'
          };
          console.log('[PriceWatcher] Search params from widget DOM:', JSON.stringify(result));
          return result;
        }
      }
    } catch(e) {}

    // Strategy 3: XHR intercept — check if we captured it earlier
    if (window.__pw_last_search_params) {
      console.log('[PriceWatcher] Search params from XHR intercept');
      return window.__pw_last_search_params;
    }

    console.log('[PriceWatcher] WARNING: Could not extract search params from any source');
    return null;
  }

  // ===== INTERCEPT OTPUSK API CALLS =====
  // Capture search params from XHR/fetch calls as they happen (more reliable than Performance API)
  (function interceptOtpuskCalls() {
    try {
      var origOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url) {
        if (typeof url === 'string' && url.indexOf('otpusk.com') > -1 &&
            (url.indexOf('tours/search') > -1 || url.indexOf('search?') > -1)) {
          try {
            var u = new URL(url, window.location.href);
            var to = u.searchParams.get('to');
            if (to) {
              window.__pw_last_search_params = {
                countryId: to,
                checkIn: u.searchParams.get('checkIn') || null,
                checkTo: u.searchParams.get('checkTo') || null,
                length: u.searchParams.get('length') || '7',
                lengthTo: u.searchParams.get('lengthTo') || '',
                people: u.searchParams.get('people') || '2',
                food: u.searchParams.get('food') || '',
                transport: u.searchParams.get('transport') || 'air',
                stars: u.searchParams.get('stars') || '',
                deptCity: u.searchParams.get('deptCity') || '1831',
                currencyLocal: u.searchParams.get('currencyLocal') || 'eur'
              };
              console.log('[PriceWatcher] Captured search params from XHR:', to);
            }
          } catch(e) {}
        }
        return origOpen.apply(this, arguments);
      };
    } catch(e) {}
  })();

  // ===== EXTRACT TOUR DATA FROM RESULT CARD (Otpusk widget) =====
  function extractTourFromCard(card) {
    var tour = {};

    // Hotel name
    var nameEl = card.querySelector('.new_r-item-hotel');
    if (nameEl) tour.name = nameEl.textContent.trim();

    // Price
    var priceEl = card.querySelector('.new_price-value');
    if (priceEl) {
      var priceText = priceEl.textContent.replace(/[^\d.,]/g, '').replace(',', '.');
      tour.price = parseFloat(priceText);
    }

    // Currency
    var priceDesc = card.querySelector('.new_price-desc');
    if (priceDesc) {
      var descText = priceDesc.textContent.trim();
      if (descText.indexOf('€') > -1 || descText.indexOf('eur') > -1) tour.currency = 'EUR';
      else if (descText.indexOf('$') > -1 || descText.indexOf('usd') > -1) tour.currency = 'USD';
    }
    if (!tour.currency && priceEl) {
      var pvt = priceEl.textContent;
      if (pvt.indexOf('€') > -1) tour.currency = 'EUR';
      else if (pvt.indexOf('$') > -1) tour.currency = 'USD';
    }

    // Geo
    var geoEl = card.querySelector('.new_r-item-geo');
    if (geoEl) {
      tour.geo = geoEl.textContent.trim().replace('Arată pe hartă', '').trim();
    }

    // Food
    var foodEl = card.querySelector('.new_r-item-food');
    if (foodEl) tour.food = foodEl.textContent.trim();

    // Image
    var imgEl = card.querySelector('.new_r-item-img img, img');
    if (imgEl) tour.img = imgEl.src || imgEl.getAttribute('data-src') || '';

    // Tour link
    var linkEl = card.querySelector('a[href]');
    if (linkEl) tour.link = linkEl.href;

    // Tour/Hotel ID — from the parent wrapper data-id attribute
    var wrapper = card.closest('.new_r-item-wrap[data-id]') || card.closest('[data-id]');
    if (wrapper) {
      tour.id = wrapper.getAttribute('data-id');
    }

    // Fallback: extract from link
    if (!tour.id && tour.link) {
      var hidMatch = tour.link.match(/hid=(\d+)/);
      if (hidMatch) tour.id = hidMatch[1];
      else {
        var pathMatch = tour.link.match(/\/(\d+)/);
        if (pathMatch) tour.id = pathMatch[1];
      }
    }

    // Fallback ID from name
    if (!tour.id && tour.name) {
      tour.id = tour.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    // Stars — from wrapper or card
    var starsEl = card.querySelector('.new_r-item-stars, [class*="stars"]');
    if (starsEl) {
      var starsText = starsEl.textContent.trim();
      var starsNum = parseInt(starsText);
      if (starsNum >= 1 && starsNum <= 5) tour.stars = starsNum;
    }

    // Dates
    var cols = card.querySelectorAll('.new_r-item-col');
    cols.forEach(function(col) {
      var text = col.textContent.trim();
      if (/\d+\s*(iun|iul|aug|mai|sept|oct|nov|dec|ian|feb|mar|apr)/i.test(text) && !tour.dates) {
        tour.dates = text.replace(/\s+/g, ' ').substring(0, 50);
      }
    });

    // Extract tour-specific date (od=) and nights (ol=) from the tour link
    // These are the ACTUAL departure date and duration, not the search engine dates
    if (tour.link) {
      var odMatch = tour.link.match(/od=([^&]+)/);
      if (odMatch) tour.offerDate = decodeURIComponent(odMatch[1]); // e.g. "02.06.2026"

      var olMatch = tour.link.match(/ol=(\d+)/);
      if (olMatch) tour.offerNights = parseInt(olMatch[1]); // e.g. 6
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
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closePwModal(); });

    var modal = document.createElement('div');
    modal.className = 'pw-modal';

    // Header
    var header = document.createElement('div');
    header.className = 'pw-modal-header';
    header.innerHTML = '<span class="pw-modal-title">\uD83D\uDD14 Urmareste pretul</span>';
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
    if (tour.geo) html += '<div class="pw-tour-detail">\uD83D\uDCCD ' + tour.geo + '</div>';
    if (tour.dates) html += '<div class="pw-tour-detail">\uD83D\uDCC5 ' + tour.dates + '</div>';
    tourInfo.innerHTML = html;
    body.appendChild(tourInfo);

    // Telegram button (first option)
    var searchParams = extractSearchParams();
    var tgPayload = encodeTelegramPayload(tour, searchParams);
    var tgLink = 'https://t.me/' + PW_TELEGRAM_BOT + '?start=' + tgPayload;
    console.log('[PriceWatcher] Tour data:', JSON.stringify({name: tour.name, price: tour.price, offerDate: tour.offerDate, offerNights: tour.offerNights, link: tour.link ? tour.link.substring(0, 100) : null}));
    console.log('[PriceWatcher] TG payload:', tgPayload);
    console.log('[PriceWatcher] TG link:', tgLink);

    var tgBtn = document.createElement('a');
    tgBtn.href = tgLink;
    tgBtn.target = '_blank';
    tgBtn.className = 'pw-telegram-btn';
    tgBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align:middle;margin-right:6px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg> Urmareste pe Telegram';
    tgBtn.addEventListener('click', function() {
      setTimeout(closePwModal, 500);
    });
    body.appendChild(tgBtn);

    // Separator
    var separator = document.createElement('div');
    separator.className = 'pw-separator';
    separator.innerHTML = '<span>sau prin email</span>';
    body.appendChild(separator);

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
    submitBtn.textContent = '\uD83D\uDD14 Activeaza urmarirea pretului';
    submitBtn.addEventListener('click', function() {
      var email = emailInput.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        pwToast('Introdu un email valid');
        emailInput.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = '\u23F3 Se trimite...';
      saveEmail(email);

      // Capture search params from the widget's last search
      var searchParams = extractSearchParams();

      var payload = {
        email: email,
        tourId: tour.id || tour.name || 'unknown',
        tourName: tour.name || null,
        tourUrl: tour.link || null,
        tourImg: tour.img || null,
        price: tour.price,
        currency: tour.currency || 'EUR',
        geo: tour.geo || null,
        dates: tour.dates || null,
        stars: tour.stars || null,
        food: tour.food || null,
        searchParams: searchParams
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
          success.innerHTML = '<div class="pw-success-icon">\u2705</div>' +
            '<div class="pw-success-text">Urmarirea pretului activata!</div>' +
            '<div class="pw-success-sub">Vei primi o notificare pe <strong>' + email + '</strong> cand pretul se schimba cu mai mult de 3%.</div>';
          body.appendChild(success);
          setTimeout(closePwModal, 3000);
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = '\uD83D\uDD14 Activeaza urmarirea pretului';
          pwToast(data.error || 'Eroare. Incearca din nou.');
        }
      })
      .catch(function() {
        submitBtn.disabled = false;
        submitBtn.textContent = '\uD83D\uDD14 Activeaza urmarirea pretului';
        pwToast('Eroare de conexiune. Incearca din nou.');
      });
    });
    body.appendChild(submitBtn);

    // Hint
    var hint = document.createElement('div');
    hint.className = 'pw-hint';
    hint.textContent = 'Verificam pretul periodic. Te poti dezabona oricand din email.';
    body.appendChild(hint);

    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    setTimeout(function() { overlay.classList.add('pw-modal-open'); }, 10);
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
      if (item.querySelector('.pw-watch-btn')) return;
      var tour = {};
      try {
        var wishlist = JSON.parse(localStorage.getItem(PW_WISHLIST_KEY)) || [];
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
      var priceEl = item.querySelector('.zebra-wishlist-price, [class*="price"]');
      if (priceEl) priceEl.parentNode.insertBefore(btn, priceEl.nextSibling);
      else item.appendChild(btn);
    });
  }

  // ===== ADD WATCH BUTTON TO TOUR RESULT CARDS =====
  function addWatchButtonsToResults() {
    var cards = document.querySelectorAll('.new_r-item');
    cards.forEach(function(card) {
      if (card.querySelector('.pw-result-watch-btn')) return;
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
      var priceBlock = card.querySelector('.new_r-item-price');
      if (priceBlock) priceBlock.parentNode.insertBefore(btn, priceBlock);
      else {
        var heartBtn = card.querySelector('.zebra-heart-btn');
        if (heartBtn) heartBtn.parentNode.insertBefore(btn, heartBtn);
        else card.appendChild(btn);
      }
    });
  }

  // ===== WATCH FOR DOM CHANGES =====
  function watchForChanges() {
    var observer = new MutationObserver(function() {
      var panel = document.getElementById('zebraWishlistPanel');
      if (panel && panel.classList.contains('open')) {
        setTimeout(addWatchButtonsToWishlist, 200);
      }
      setTimeout(addWatchButtonsToResults, 200);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  // ===== INIT =====
  function initPriceWatcher() {
    watchForChanges();
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
