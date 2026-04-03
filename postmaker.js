/* ============================================================
   ZEBRA TOUR – POST MAKER (Text + Image)
   Separate addon – works with wishlist data, does NOT modify wishlist code
   Reads from localStorage key 'zebra_wishlist'
   ============================================================ */

(function() {
  'use strict';

  var PM_WISHLIST_KEY = 'zebra_wishlist';

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(PM_WISHLIST_KEY)) || [];
    } catch(e) { return []; }
  }

  // ===== TOAST =====
  function pmToast(msg) {
    var existing = document.getElementById('pmToast');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.id = 'pmToast';
    t.className = 'pm-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.classList.add('pm-toast-show'); }, 10);
    setTimeout(function() {
      t.classList.remove('pm-toast-show');
      setTimeout(function() { t.remove(); }, 300);
    }, 2500);
  }

  // ===== STARS EMOJI =====
  function starsEmoji(count) {
    if (!count) return '';
    var s = '';
    for (var i = 0; i < count; i++) s += '⭐';
    return s;
  }

  // ===== BUILD POST TEXT FOR ONE TOUR =====
  function buildTourPostText(tour) {
    var lines = [];
    lines.push('🏨 ' + (tour.name || 'Hotel') + (tour.stars ? ' ' + starsEmoji(tour.stars) : ''));
    if (tour.geo) lines.push('📍 ' + tour.geo);
    if (tour.price) lines.push('💰 ' + tour.price);
    if (tour.dates) lines.push('📅 ' + tour.dates);
    if (tour.food) lines.push('🍽️ ' + tour.food);
    if (tour.rating) lines.push('⭐ Rating: ' + tour.rating);
    if (tour.link) lines.push('🔗 ' + tour.link);
    return lines.join('\n');
  }

  // ===== BUILD POST TEXT FOR ALL TOURS =====
  function buildAllPostsText(list) {
    if (!list || !list.length) return '';
    var parts = [];
    parts.push('✈️ Ofertele mele favorite pe ZebraTur:\n');
    for (var i = 0; i < list.length; i++) {
      parts.push('━━━━━━━━━━━━━━━');
      parts.push(buildTourPostText(list[i]));
    }
    parts.push('━━━━━━━━━━━━━━━');
    parts.push('\n🌐 zebratur.md');
    return parts.join('\n');
  }

  // ===== CLIPBOARD COPY TEXT =====
  function copyTextToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        pmToast(successMsg || 'Copiat!');
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      pmToast(successMsg || 'Copiat!');
    }
  }

  // ===== MODAL CLOSE =====
  function closePostModal() {
    var overlay = document.getElementById('pmModalOverlay');
    if (overlay) {
      overlay.classList.remove('pm-modal-open');
      setTimeout(function() { overlay.remove(); }, 300);
    }
  }

  // ===== TEXT POST MODAL =====
  function openTextPostModal() {
    closePostModal();
    var list = getWishlist();
    if (!list.length) {
      pmToast('Lista de favorite e goală!');
      return;
    }

    var postText = buildAllPostsText(list);

    var overlay = document.createElement('div');
    overlay.id = 'pmModalOverlay';
    overlay.className = 'pm-modal-overlay';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePostModal();
    });

    var modal = document.createElement('div');
    modal.className = 'pm-modal';

    // Header
    var header = document.createElement('div');
    header.className = 'pm-modal-header';
    header.innerHTML = '<span class="pm-modal-title">📝 Text pentru postare</span>';
    var closeX = document.createElement('button');
    closeX.className = 'pm-modal-close-x';
    closeX.innerHTML = '&times;';
    closeX.addEventListener('click', closePostModal);
    header.appendChild(closeX);
    modal.appendChild(header);

    // Preview area
    var preview = document.createElement('div');
    preview.className = 'pm-text-preview';
    preview.textContent = postText;
    modal.appendChild(preview);

    // Actions
    var actions = document.createElement('div');
    actions.className = 'pm-modal-actions';

    // Copy
    var copyBtn = document.createElement('button');
    copyBtn.className = 'pm-action-btn pm-btn-copy';
    copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copiază text';
    copyBtn.addEventListener('click', function() {
      copyTextToClipboard(postText, '✅ Text copiat în clipboard!');
    });

    // WhatsApp
    var waBtn = document.createElement('a');
    waBtn.className = 'pm-action-btn pm-btn-whatsapp';
    waBtn.href = 'https://wa.me/?text=' + encodeURIComponent(postText);
    waBtn.target = '_blank';
    waBtn.rel = 'noopener';
    waBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp';

    // Viber
    var viberBtn = document.createElement('a');
    viberBtn.className = 'pm-action-btn pm-btn-viber';
    viberBtn.href = 'viber://forward?text=' + encodeURIComponent(postText);
    viberBtn.target = '_blank';
    viberBtn.rel = 'noopener';
    viberBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.398.002C9.47.028 5.276.395 3.297 2.22 1.67 3.845 1.108 6.27 1.046 9.233c-.062 2.963-.14 8.524 5.21 10.09h.004l-.004 2.318s-.038.937.582 1.128c.75.23 1.19-.483 1.907-1.258.393-.425.936-1.049 1.346-1.528 3.705.312 6.555-.4 6.88-.5.748-.236 4.98-.785 5.67-6.404.71-5.792-.336-9.45-2.164-11.097l-.002-.003c-.53-.56-2.63-2.12-7.058-2.425-.01 0-.22-.018-.52-.003z"/></svg> Viber';

    // Telegram
    var tgBtn = document.createElement('a');
    tgBtn.className = 'pm-action-btn pm-btn-telegram';
    tgBtn.href = 'https://t.me/share/url?url=' + encodeURIComponent('https://zebratur.md') + '&text=' + encodeURIComponent(postText);
    tgBtn.target = '_blank';
    tgBtn.rel = 'noopener';
    tgBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> Telegram';

    actions.appendChild(copyBtn);
    actions.appendChild(waBtn);
    actions.appendChild(viberBtn);
    actions.appendChild(tgBtn);
    modal.appendChild(actions);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    setTimeout(function() { overlay.classList.add('pm-modal-open'); }, 10);
  }

  // ===== IMAGE POST: CANVAS WITH REAL PHOTO =====
  // NOTE: No crossOrigin attribute = image loads fine from any server
  // Canvas becomes "tainted" (can't toBlob/toDataURL) but displays perfectly
  // We show HTML preview for visual + offer text sharing as primary action
  function generatePostImage(tour, previewContainer) {
    var imgSrc = tour.img || '';
    if (imgSrc.indexOf('/320x240/') > -1) {
      imgSrc = imgSrc.replace('/320x240/', '/1200x900/');
    }

    // Build a visual HTML card (not canvas — avoids CORS entirely)
    var card = document.createElement('div');
    card.className = 'pm-image-card';

    // Background: real hotel photo as <img>
    var bgImg = document.createElement('img');
    bgImg.className = 'pm-image-card-bg';
    bgImg.src = imgSrc;
    bgImg.alt = tour.name || 'Hotel';
    bgImg.onerror = function() {
      // Fallback gradient if image fails
      bgImg.style.display = 'none';
      card.style.background = 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)';
    };
    card.appendChild(bgImg);

    // Dark gradient overlay
    var overlay = document.createElement('div');
    overlay.className = 'pm-image-card-overlay';
    card.appendChild(overlay);

    // Location top-left
    if (tour.geo) {
      var geoEl = document.createElement('div');
      geoEl.className = 'pm-image-card-geo';
      geoEl.textContent = '\uD83D\uDCCD ' + tour.geo;
      card.appendChild(geoEl);
    }

    // Rating top-right
    if (tour.rating) {
      var ratEl = document.createElement('div');
      ratEl.className = 'pm-image-card-rating';
      ratEl.textContent = '\u2B50 ' + tour.rating;
      card.appendChild(ratEl);
    }

    // Center block: hotel name + stars + food
    var center = document.createElement('div');
    center.className = 'pm-image-card-center';

    var nameEl = document.createElement('div');
    nameEl.className = 'pm-image-card-name';
    var hotelName = tour.name || 'Hotel';
    if (hotelName.length > 45) nameEl.classList.add('pm-name-small');
    else if (hotelName.length > 30) nameEl.classList.add('pm-name-medium');
    nameEl.textContent = hotelName;
    center.appendChild(nameEl);

    if (tour.stars && tour.stars > 0) {
      var starsEl = document.createElement('div');
      starsEl.className = 'pm-image-card-stars';
      var st = '';
      for (var si = 0; si < tour.stars; si++) st += '\u2605';
      starsEl.textContent = st;
      center.appendChild(starsEl);
    }

    if (tour.food) {
      var foodEl = document.createElement('div');
      foodEl.className = 'pm-image-card-food';
      foodEl.textContent = '\uD83C\uDF7D\uFE0F ' + tour.food;
      center.appendChild(foodEl);
    }
    card.appendChild(center);

    // Bottom right: date + price
    var bottomRight = document.createElement('div');
    bottomRight.className = 'pm-image-card-bottom';

    if (tour.dates) {
      var dateEl = document.createElement('div');
      dateEl.className = 'pm-image-card-dates';
      dateEl.textContent = '\uD83D\uDCC5 ' + tour.dates;
      bottomRight.appendChild(dateEl);
    }

    if (tour.price) {
      var priceEl = document.createElement('div');
      priceEl.className = 'pm-image-card-price';
      priceEl.textContent = tour.price;
      bottomRight.appendChild(priceEl);
    }
    card.appendChild(bottomRight);

    // Insert into preview container
    previewContainer.innerHTML = '';
    previewContainer.appendChild(card);

    // Add hint
    var hint = document.createElement('div');
    hint.className = 'pm-save-hint';
    hint.textContent = '\uD83D\uDCA1 Apasă lung pe imagine (mobil) sau click dreapta → Salvează (PC) pentru a descărca';
    previewContainer.appendChild(hint);
  }

  // ===== IMAGE POST MODAL =====
  function openImagePostModal() {
    closePostModal();
    var list = getWishlist();
    if (!list.length) {
      pmToast('Lista de favorite e goală!');
      return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'pmModalOverlay';
    overlay.className = 'pm-modal-overlay';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePostModal();
    });

    var modal = document.createElement('div');
    modal.className = 'pm-modal pm-modal-wide';

    // Header
    var header = document.createElement('div');
    header.className = 'pm-modal-header';
    header.innerHTML = '<span class="pm-modal-title">🖼️ Imagine pentru postare</span>';
    var closeX = document.createElement('button');
    closeX.className = 'pm-modal-close-x';
    closeX.innerHTML = '&times;';
    closeX.addEventListener('click', closePostModal);
    header.appendChild(closeX);
    modal.appendChild(header);

    // Tour selector (if multiple)
    if (list.length > 1) {
      var selector = document.createElement('div');
      selector.className = 'pm-tour-selector';
      var selectLabel = document.createElement('span');
      selectLabel.className = 'pm-select-label';
      selectLabel.textContent = 'Alege oferta:';
      selector.appendChild(selectLabel);

      var selectEl = document.createElement('select');
      selectEl.className = 'pm-tour-select';
      for (var si = 0; si < list.length; si++) {
        var opt = document.createElement('option');
        opt.value = si;
        opt.textContent = (si + 1) + '. ' + (list[si].name || 'Hotel');
        if (list[si].price) opt.textContent += ' — ' + list[si].price;
        selectEl.appendChild(opt);
      }
      selector.appendChild(selectEl);
      modal.appendChild(selector);

      selectEl.addEventListener('change', function() {
        renderImagePreview(list[parseInt(selectEl.value)]);
      });
    }

    // Image preview area
    var previewWrap = document.createElement('div');
    previewWrap.id = 'pmImagePreview';
    previewWrap.className = 'pm-image-preview';
    previewWrap.innerHTML = '<div class="pm-loading">⏳ Se generează imaginea...</div>';
    modal.appendChild(previewWrap);

    // Actions placeholder (filled after image generates)
    var actions = document.createElement('div');
    actions.id = 'pmImageActions';
    actions.className = 'pm-modal-actions';
    modal.appendChild(actions);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    setTimeout(function() { overlay.classList.add('pm-modal-open'); }, 10);

    // Render first tour
    renderImagePreview(list[0]);
  }

  function renderImagePreview(tour) {
    var previewWrap = document.getElementById('pmImagePreview');
    var actionsWrap = document.getElementById('pmImageActions');
    if (!previewWrap || !actionsWrap) return;

    // Generate the HTML image card directly into preview
    generatePostImage(tour, previewWrap);

    // Build action buttons
    actionsWrap.innerHTML = '';

    // Copy text for this tour
    var copyBtn = document.createElement('button');
    copyBtn.className = 'pm-action-btn pm-btn-copy';
    copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copiaz\u0103 text';
    copyBtn.addEventListener('click', function() {
      copyTextToClipboard(buildTourPostText(tour), '\u2705 Text copiat \u00een clipboard!');
    });

    // WhatsApp
    var waBtn = document.createElement('a');
    waBtn.className = 'pm-action-btn pm-btn-whatsapp';
    waBtn.href = 'https://wa.me/?text=' + encodeURIComponent(buildTourPostText(tour));
    waBtn.target = '_blank';
    waBtn.rel = 'noopener';
    waBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp';

    // Viber
    var viberBtn = document.createElement('a');
    viberBtn.className = 'pm-action-btn pm-btn-viber';
    viberBtn.href = 'viber://forward?text=' + encodeURIComponent(buildTourPostText(tour));
    viberBtn.target = '_blank';
    viberBtn.rel = 'noopener';
    viberBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.398.002C9.47.028 5.276.395 3.297 2.22 1.67 3.845 1.108 6.27 1.046 9.233c-.062 2.963-.14 8.524 5.21 10.09h.004l-.004 2.318s-.038.937.582 1.128c.75.23 1.19-.483 1.907-1.258.393-.425.936-1.049 1.346-1.528 3.705.312 6.555-.4 6.88-.5.748-.236 4.98-.785 5.67-6.404.71-5.792-.336-9.45-2.164-11.097l-.002-.003c-.53-.56-2.63-2.12-7.058-2.425-.01 0-.22-.018-.52-.003z"/></svg> Viber';

    // Telegram
    var tgBtn = document.createElement('a');
    tgBtn.className = 'pm-action-btn pm-btn-telegram';
    tgBtn.href = 'https://t.me/share/url?url=' + encodeURIComponent(tour.link || 'https://zebratur.md') + '&text=' + encodeURIComponent(buildTourPostText(tour));
    tgBtn.target = '_blank';
    tgBtn.rel = 'noopener';
    tgBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> Telegram';

    actionsWrap.appendChild(copyBtn);
    actionsWrap.appendChild(waBtn);
    actionsWrap.appendChild(viberBtn);
    actionsWrap.appendChild(tgBtn);
  }

  // ===== INJECT BUTTONS INTO WISHLIST PANEL =====
  function injectPostButtons() {
    // Check if buttons already exist
    if (document.getElementById('pmTextPostBtn')) return;

    // Find the wishlist panel footer
    var footer = document.querySelector('.zebra-wishlist-footer');
    if (!footer) return;

    // Create button row
    var pmRow = document.createElement('div');
    pmRow.className = 'pm-buttons-row';

    var textBtn = document.createElement('button');
    textBtn.id = 'pmTextPostBtn';
    textBtn.className = 'pm-wishlist-btn pm-btn-text-post';
    textBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg> Creează text postare';
    textBtn.addEventListener('click', openTextPostModal);

    var imgBtn = document.createElement('button');
    imgBtn.id = 'pmImgPostBtn';
    imgBtn.className = 'pm-wishlist-btn pm-btn-img-post';
    imgBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg> Creează imagine postare';
    imgBtn.addEventListener('click', openImagePostModal);

    pmRow.appendChild(textBtn);
    pmRow.appendChild(imgBtn);

    // Insert before the share label or at the beginning of footer
    var shareLabel = footer.querySelector('.zebra-wishlist-share-label');
    if (shareLabel) {
      footer.insertBefore(pmRow, shareLabel);
    } else {
      footer.insertBefore(pmRow, footer.firstChild);
    }
  }

  // ===== WATCH FOR WISHLIST PANEL OPENING =====
  function watchWishlistPanel() {
    var observer = new MutationObserver(function() {
      var panel = document.getElementById('zebraWishlistPanel');
      if (panel && panel.classList.contains('open')) {
        setTimeout(injectPostButtons, 100);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  // ===== INIT =====
  function initPostMaker() {
    watchWishlistPanel();
    // Also try to inject immediately in case panel is already open
    setTimeout(injectPostButtons, 2000);
    setTimeout(injectPostButtons, 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPostMaker);
  } else {
    initPostMaker();
  }
})();
