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

  // ===== LOAD html2canvas LIBRARY =====
  var html2canvasLoaded = false;
  function loadHtml2Canvas(cb) {
    if (html2canvasLoaded && window.html2canvas) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = function() { html2canvasLoaded = true; cb(); };
    s.onerror = function() { cb(true); };
    document.head.appendChild(s);
  }

  // ===== IMAGE POST: BUILD HTML OVERLAY + html2canvas =====
  function generatePostImage(tour, callback) {
    var imgSrc = tour.img || '';
    if (imgSrc.indexOf('/320x240/') > -1) {
      imgSrc = imgSrc.replace('/320x240/', '/1200x900/');
    }

    // Build off-screen HTML element
    var container = document.createElement('div');
    container.id = 'pmRenderContainer';
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1080px;height:1080px;overflow:hidden;z-index:-1;font-family:Arial,Helvetica,sans-serif;';

    // Background image
    var bgDiv = document.createElement('div');
    bgDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background-image:url(' + imgSrc + ');background-size:cover;background-position:center;';
    container.appendChild(bgDiv);

    // Dark gradient overlay
    var ov = document.createElement('div');
    ov.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.05) 35%,rgba(0,0,0,0.1) 55%,rgba(0,0,0,0.65) 100%);';
    container.appendChild(ov);

    // Location top-left
    if (tour.geo) {
      var geoEl = document.createElement('div');
      geoEl.style.cssText = 'position:absolute;top:30px;left:35px;color:#fff;font-size:26px;font-weight:700;text-shadow:0 2px 10px rgba(0,0,0,0.8);';
      geoEl.textContent = '\uD83D\uDCCD ' + tour.geo;
      container.appendChild(geoEl);
    }

    // Rating top-right
    if (tour.rating) {
      var ratEl = document.createElement('div');
      ratEl.style.cssText = 'position:absolute;top:30px;right:35px;color:#fbbf24;font-size:26px;font-weight:800;text-shadow:0 2px 10px rgba(0,0,0,0.8);';
      ratEl.textContent = '\u2B50 ' + tour.rating;
      container.appendChild(ratEl);
    }

    // Center: hotel name + stars + food
    var centerWrap = document.createElement('div');
    centerWrap.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;width:90%;';
    var hotelName = tour.name || 'Hotel';
    var fs = 52;
    if (hotelName.length > 30) fs = 42;
    if (hotelName.length > 45) fs = 36;
    var nameEl = document.createElement('div');
    nameEl.style.cssText = 'color:#fff;font-size:' + fs + 'px;font-weight:800;text-shadow:0 3px 15px rgba(0,0,0,0.8),0 1px 3px rgba(0,0,0,0.9);line-height:1.25;letter-spacing:0.5px;';
    nameEl.textContent = hotelName;
    centerWrap.appendChild(nameEl);
    if (tour.stars && tour.stars > 0) {
      var stEl = document.createElement('div');
      stEl.style.cssText = 'color:#fbbf24;font-size:32px;margin-top:12px;text-shadow:0 2px 8px rgba(0,0,0,0.7);';
      var st = ''; for (var si = 0; si < tour.stars; si++) st += '\u2605';
      stEl.textContent = st;
      centerWrap.appendChild(stEl);
    }
    if (tour.food) {
      var foodEl = document.createElement('div');
      foodEl.style.cssText = 'color:rgba(255,255,255,0.9);font-size:22px;margin-top:10px;text-shadow:0 2px 8px rgba(0,0,0,0.7);';
      foodEl.textContent = '\uD83C\uDF7D\uFE0F ' + tour.food;
      centerWrap.appendChild(foodEl);
    }
    container.appendChild(centerWrap);

    // Bottom right: date + price
    var br = document.createElement('div');
    br.style.cssText = 'position:absolute;bottom:30px;right:35px;text-align:right;';
    if (tour.dates) {
      var dtEl = document.createElement('div');
      dtEl.style.cssText = 'color:#fff;font-size:26px;font-weight:700;text-shadow:0 2px 10px rgba(0,0,0,0.8);margin-bottom:8px;';
      dtEl.textContent = '\uD83D\uDCC5 ' + tour.dates;
      br.appendChild(dtEl);
    }
    if (tour.price) {
      var prEl = document.createElement('div');
      prEl.style.cssText = 'color:#fff;font-size:48px;font-weight:900;text-shadow:0 3px 15px rgba(0,0,0,0.8),0 1px 3px rgba(0,0,0,0.9);';
      prEl.textContent = tour.price;
      br.appendChild(prEl);
    }
    container.appendChild(br);

    document.body.appendChild(container);

    loadHtml2Canvas(function(err) {
      if (err || !window.html2canvas) {
        document.body.removeChild(container);
        fallbackCanvasRender(tour, callback);
        return;
      }
      // Preload background image
      var preImg = new Image();
      preImg.src = imgSrc;
      function doRender() {
        window.html2canvas(container, {
          width: 1080, height: 1080, scale: 1,
          useCORS: true, allowTaint: true, logging: false
        }).then(function(canvas) {
          if (document.getElementById('pmRenderContainer'))
            document.body.removeChild(container);
          callback(canvas);
        }).catch(function() {
          if (document.getElementById('pmRenderContainer'))
            document.body.removeChild(container);
          fallbackCanvasRender(tour, callback);
        });
      }
      preImg.onload = function() { setTimeout(doRender, 150); };
      preImg.onerror = function() { setTimeout(doRender, 150); };
      setTimeout(function() {
        if (document.getElementById('pmRenderContainer')) doRender();
      }, 5000);
    });
  }

  // ===== FALLBACK: pure canvas without external image =====
  function fallbackCanvasRender(tour, callback) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var W = 1080, H = 1080;
    canvas.width = W; canvas.height = H;
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0f2027'); bg.addColorStop(0.5, '#203a43'); bg.addColorStop(1, '#2c5364');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10;
    var nm = tour.name || 'Hotel';
    var fz = nm.length > 30 ? 40 : 50;
    ctx.font = 'bold ' + fz + 'px Arial';
    var words = nm.split(' '), lines = [], cur = '';
    for (var wi = 0; wi < words.length; wi++) {
      var t = cur ? cur + ' ' + words[wi] : words[wi];
      if (ctx.measureText(t).width > W - 120 && cur) { lines.push(cur); cur = words[wi]; }
      else cur = t;
    }
    if (cur) lines.push(cur);
    var lh = fz * 1.3, sy = (H/2) - (lines.length*lh/2) + fz/2;
    for (var li = 0; li < lines.length; li++) ctx.fillText(lines[li], W/2, sy + li*lh);
    if (tour.price) { ctx.font = 'bold 48px Arial'; ctx.textAlign = 'right'; ctx.fillText(tour.price, W-40, H-40); }
    if (tour.dates) { ctx.font = 'bold 28px Arial'; ctx.textAlign = 'right'; ctx.fillText(tour.dates, W-40, H-100); }
    if (tour.geo) { ctx.textAlign = 'left'; ctx.font = 'bold 26px Arial'; ctx.fillText(tour.geo, 40, 55); }
    ctx.shadowColor = 'transparent';
    callback(canvas);
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

    previewWrap.innerHTML = '<div class="pm-loading">⏳ Se generează imaginea...</div>';
    actionsWrap.innerHTML = '';

    generatePostImage(tour, function(canvas) {
      previewWrap.innerHTML = '';
      canvas.className = 'pm-canvas-preview';
      previewWrap.appendChild(canvas);

      actionsWrap.innerHTML = '';

      // Download / Save
      var downloadBtn = document.createElement('button');
      downloadBtn.className = 'pm-action-btn pm-btn-download';
      downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Descarcă imagine';
      downloadBtn.addEventListener('click', function() {
        var link = document.createElement('a');
        link.download = (tour.name || 'post') .replace(/[^a-zA-Z0-9]/g, '_') + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        pmToast('✅ Imagine descărcată!');
      });

      // Copy image to clipboard
      var copyImgBtn = document.createElement('button');
      copyImgBtn.className = 'pm-action-btn pm-btn-copy';
      copyImgBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copiază imagine';
      copyImgBtn.addEventListener('click', function() {
        canvas.toBlob(function(blob) {
          if (navigator.clipboard && window.ClipboardItem) {
            navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]).then(function() {
              pmToast('✅ Imagine copiată în clipboard!');
            }).catch(function() {
              pmToast('⚠️ Nu s-a putut copia. Descarcă imaginea.');
            });
          } else {
            pmToast('⚠️ Browser-ul nu suportă copierea imaginilor. Descarcă.');
          }
        }, 'image/png');
      });

      // Share via Web Share API (mobile)
      var shareBtn = document.createElement('button');
      shareBtn.className = 'pm-action-btn pm-btn-share';
      shareBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg> Share imagine';
      shareBtn.addEventListener('click', function() {
        canvas.toBlob(function(blob) {
          if (navigator.share && navigator.canShare) {
            var file = new File([blob], (tour.name || 'post') + '.png', { type: 'image/png' });
            var shareData = {
              title: tour.name || 'Ofertă turistică',
              text: buildTourPostText(tour),
              files: [file]
            };
            if (navigator.canShare(shareData)) {
              navigator.share(shareData).catch(function() {});
              return;
            }
          }
          // Fallback: download
          var link = document.createElement('a');
          link.download = (tour.name || 'post').replace(/[^a-zA-Z0-9]/g, '_') + '.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          pmToast('Imagine descărcată (share indisponibil)');
        }, 'image/png');
      });

      // WhatsApp with text (image needs manual attach)
      var waBtn = document.createElement('a');
      waBtn.className = 'pm-action-btn pm-btn-whatsapp';
      waBtn.href = 'https://wa.me/?text=' + encodeURIComponent(buildTourPostText(tour));
      waBtn.target = '_blank';
      waBtn.rel = 'noopener';
      waBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp';

      // Telegram
      var tgBtn = document.createElement('a');
      tgBtn.className = 'pm-action-btn pm-btn-telegram';
      tgBtn.href = 'https://t.me/share/url?url=' + encodeURIComponent(tour.link || 'https://zebratur.md') + '&text=' + encodeURIComponent(buildTourPostText(tour));
      tgBtn.target = '_blank';
      tgBtn.rel = 'noopener';
      tgBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> Telegram';

      actionsWrap.appendChild(downloadBtn);
      actionsWrap.appendChild(copyImgBtn);
      actionsWrap.appendChild(shareBtn);
      actionsWrap.appendChild(waBtn);
      actionsWrap.appendChild(tgBtn);
    });
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
