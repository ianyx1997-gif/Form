(function() {
  'use strict';

  // Wait for the widget to fully load
  function waitForWidget(callback) {
    const check = setInterval(function() {
      if (document.querySelector('.new_r-item')) {
        clearInterval(check);
        callback();
      }
    }, 500);
    // Stop checking after 30 seconds
    setTimeout(function() { clearInterval(check); }, 30000);
  }

  // ===== 0. AUTO-LOAD MORE RESULTS (target: ~50) =====
  function autoLoadMoreResults() {
    var targetCount = 50;
    var maxClicks = 8;
    var clicksDone = 0;
    var lastCount = 0;
    var staleChecks = 0;

    function tryLoadMore() {
      var currentCount = document.querySelectorAll('.new_r-item').length;
      var showMore = document.querySelector('.new_r-show-more-results');

      // Stop if: target reached, no button, button hidden, or no new results after 3 tries
      if (currentCount >= targetCount || clicksDone >= maxClicks || !showMore || getComputedStyle(showMore).display === 'none') {
        return;
      }

      // Check if results are still loading (count didn't change)
      if (currentCount === lastCount) {
        staleChecks++;
        if (staleChecks > 3) return; // API probably has no more results
      } else {
        staleChecks = 0;
      }
      lastCount = currentCount;

      clicksDone++;
      showMore.click();

      // Fast interval - check every 800ms for new results
      setTimeout(tryLoadMore, 800);
    }

    // Start quickly after first results appear
    setTimeout(tryLoadMore, 500);

    // Also auto-load when user triggers a new search
    var observer = new MutationObserver(function() {
      clicksDone = 0;
      lastCount = 0;
      staleChecks = 0;
      setTimeout(tryLoadMore, 1500);
    });
    var wrapper = document.querySelector('.new_r-wrapper');
    if (wrapper) {
      observer.observe(wrapper, { childList: true });
    }
  }

  // ===== 1. SCROLL TO TOP BUTTON =====
  function createScrollTopButton() {
    var btn = document.createElement('button');
    btn.id = 'zebraScrollTop';
    btn.innerHTML = '&#9650;';
    btn.title = 'Sus';
    document.body.appendChild(btn);

    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', function() {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });
  }

  // ===== 2. RESULTS COUNTER =====
  function createResultsCounter() {
    var panel = document.querySelector('.new_r-panel');
    if (!panel) return;

    var counter = document.createElement('div');
    counter.id = 'zebraResultsCounter';
    panel.parentNode.insertBefore(counter, panel.nextSibling);

    function updateCount() {
      var count = document.querySelectorAll('.new_r-item').length;
      counter.innerHTML = '<span class="count-num">' + count + '</span> hoteluri găsite';
    }

    updateCount();

    // Update counter when new results are loaded
    var observer = new MutationObserver(function() {
      updateCount();
    });
    var wrapper = document.querySelector('.new_r-wrapper');
    if (wrapper) {
      observer.observe(wrapper, { childList: true, subtree: true });
    }
  }

  // ===== 3. BEST DEAL HIGHLIGHT (best rating/price ratio) =====
  function highlightBestDeal() {
    var items = document.querySelectorAll('.new_r-item-wrap');
    var bestRatio = 0;
    var bestItem = null;

    items.forEach(function(wrap) {
      var priceEl = wrap.querySelector('.new_r-item-price');
      var ratingEl = wrap.querySelector('.new_r-item-rating-value');

      if (priceEl && ratingEl) {
        var priceText = priceEl.textContent.replace(/[^\d]/g, '');
        var price = parseInt(priceText);
        var ratingText = ratingEl.textContent.replace(',', '.').replace(/[^\d.]/g, '');
        var rating = parseFloat(ratingText);

        // Calculate rating/price ratio (higher = better deal)
        if (price > 0 && rating > 0) {
          var ratio = rating / price;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestItem = wrap;
          }
        }
      }
    });

    // Remove old highlights
    document.querySelectorAll('.best-deal').forEach(function(el) {
      el.classList.remove('best-deal');
    });

    if (bestItem) {
      bestItem.classList.add('best-deal');
      bestItem.style.position = 'relative';
    }
  }

  // ===== 4. LAZY REVEAL ON SCROLL =====
  function setupScrollReveal() {
    var items = document.querySelectorAll('.new_r-item-wrap');

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '50px' });

      items.forEach(function(item, index) {
        if (index > 5) { // Skip first 6, they already have CSS animation
          item.style.opacity = '0';
          item.style.transform = 'translateY(30px)';
          item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          observer.observe(item);
        }
      });
    }
  }

  // ===== 5. HOTEL NAME TOOLTIP =====
  function setupHotelTooltips() {
    document.querySelectorAll('.new_r-item-hotel').forEach(function(hotel) {
      var fullName = hotel.textContent.trim();
      if (fullName.length > 25) {
        hotel.title = fullName;
        hotel.style.cursor = 'help';
      }
    });
  }

  // ===== 6. KEYBOARD NAVIGATION =====
  function setupKeyboardNav() {
    document.addEventListener('keydown', function(e) {
      // Press "Home" to scroll to search form
      if (e.key === 'Home' && !e.ctrlKey) {
        var form = document.querySelector('.new_f-container');
        if (form) {
          e.preventDefault();
          form.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  // ===== 7. RE-APPLY ON DYNAMIC UPDATES =====
  function watchForUpdates() {
    var wrapper = document.querySelector('.new_r-wrapper');
    if (!wrapper) return;

    var observer = new MutationObserver(function() {
      // Re-apply enhancements when new results load
      setTimeout(function() {
        highlightBestDeal();
        setupHotelTooltips();
        setupScrollReveal();
      }, 300);
    });

    observer.observe(wrapper, { childList: true, subtree: true });
  }

  // ===== 8. TOUR PAGE SLIDESHOW =====
  function setupTourSlideshow() {
    // Only run on tour detail page
    var headerImg = document.querySelector('.new_t-header-desktop-img');
    if (!headerImg) return;

    // Get photo URLs from the photo tab
    var photoTab = document.querySelector('.new_t-tab-content.photo');
    if (!photoTab) return;

    var photoImgs = photoTab.querySelectorAll('img');
    var photoURLs = [];
    photoImgs.forEach(function(img) {
      if (img.src && !img.src.startsWith('data:') && img.src.indexOf('otpusk.com') !== -1) {
        // Use higher resolution version
        var url = img.src.replace('/1200x900/', '/1200x900/');
        photoURLs.push(url);
      }
    });

    if (photoURLs.length < 2) return;

    // Limit to first 15 photos for performance
    photoURLs = photoURLs.slice(0, 15);

    // Get the gallery container
    var galleryContainer = headerImg.parentElement;
    if (!galleryContainer) return;

    // Create slideshow container
    var slideshow = document.createElement('div');
    slideshow.className = 'zebra-slideshow-container';

    // Create images
    var currentIndex = 0;
    photoURLs.forEach(function(url, i) {
      var img = document.createElement('img');
      img.src = url;
      img.loading = i < 3 ? 'eager' : 'lazy';
      if (i === 0) img.classList.add('active');
      slideshow.appendChild(img);
    });

    // Create prev/next buttons
    var prevBtn = document.createElement('button');
    prevBtn.className = 'zebra-slideshow-btn prev';
    prevBtn.innerHTML = '&#10094;';
    prevBtn.title = 'Anterior';

    var nextBtn = document.createElement('button');
    nextBtn.className = 'zebra-slideshow-btn next';
    nextBtn.innerHTML = '&#10095;';
    nextBtn.title = 'Următor';

    slideshow.appendChild(prevBtn);
    slideshow.appendChild(nextBtn);

    // Create counter
    var counter = document.createElement('div');
    counter.className = 'zebra-slideshow-counter';
    counter.textContent = '1 / ' + photoURLs.length;
    slideshow.appendChild(counter);

    // Create dots (max 10 visible)
    var maxDots = Math.min(photoURLs.length, 10);
    var dotsContainer = document.createElement('div');
    dotsContainer.className = 'zebra-slideshow-dots';
    for (var d = 0; d < maxDots; d++) {
      var dot = document.createElement('button');
      dot.className = 'zebra-slideshow-dot' + (d === 0 ? ' active' : '');
      dot.setAttribute('data-index', d);
      dotsContainer.appendChild(dot);
    }
    slideshow.appendChild(dotsContainer);

    // Navigation functions
    function goTo(index) {
      var imgs = slideshow.querySelectorAll('img');
      var dots = slideshow.querySelectorAll('.zebra-slideshow-dot');

      // Remove active from current
      if (imgs[currentIndex]) imgs[currentIndex].classList.remove('active');
      if (dots[currentIndex] && currentIndex < maxDots) dots[currentIndex].classList.remove('active');

      currentIndex = index;
      if (currentIndex >= photoURLs.length) currentIndex = 0;
      if (currentIndex < 0) currentIndex = photoURLs.length - 1;

      // Add active to new
      if (imgs[currentIndex]) imgs[currentIndex].classList.add('active');
      if (dots[currentIndex] && currentIndex < maxDots) dots[currentIndex].classList.add('active');
      counter.textContent = (currentIndex + 1) + ' / ' + photoURLs.length;
    }

    prevBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      goTo(currentIndex - 1);
    });
    nextBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      goTo(currentIndex + 1);
    });

    // Dot click
    dotsContainer.addEventListener('click', function(e) {
      var dot = e.target.closest('.zebra-slideshow-dot');
      if (dot) {
        e.stopPropagation();
        goTo(parseInt(dot.getAttribute('data-index')));
      }
    });

    // Touch/swipe support
    var touchStartX = 0;
    var touchEndX = 0;
    slideshow.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    slideshow.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].screenX;
      var diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goTo(currentIndex + 1);
        else goTo(currentIndex - 1);
      }
    }, { passive: true });

    // Keyboard arrows when slideshow is hovered
    slideshow.setAttribute('tabindex', '0');
    slideshow.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') { goTo(currentIndex - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { goTo(currentIndex + 1); e.preventDefault(); }
    });

    // Auto-advance every 5 seconds
    var autoTimer = setInterval(function() { goTo(currentIndex + 1); }, 5000);
    slideshow.addEventListener('mouseenter', function() { clearInterval(autoTimer); });
    slideshow.addEventListener('mouseleave', function() {
      autoTimer = setInterval(function() { goTo(currentIndex + 1); }, 5000);
    });

    // Replace the original image with slideshow
    headerImg.style.display = 'none';
    galleryContainer.insertBefore(slideshow, headerImg);
  }

  // ===== 9. FULLSCREEN LIGHTBOX =====
  function setupLightbox() {
    // Collect all photo URLs from the photo tab
    var photoTab = document.querySelector('.new_t-tab-content.photo');
    if (!photoTab) return;

    var allPhotos = [];
    photoTab.querySelectorAll('img').forEach(function(img) {
      if (img.src && !img.src.startsWith('data:') && img.src.indexOf('otpusk.com') !== -1) {
        allPhotos.push(img.src);
      }
    });
    if (allPhotos.length < 1) return;

    var lightboxIndex = 0;
    var lightbox = null;
    var mainImg = null;
    var counterEl = null;
    var thumbStrip = null;

    // Build lightbox DOM once
    function buildLightbox() {
      if (lightbox) return;

      lightbox = document.createElement('div');
      lightbox.className = 'zebra-lightbox';

      // Overlay
      var overlay = document.createElement('div');
      overlay.className = 'zebra-lightbox-overlay';
      lightbox.appendChild(overlay);

      // Close button
      var closeBtn = document.createElement('button');
      closeBtn.className = 'zebra-lightbox-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.title = 'Închide (Esc)';
      lightbox.appendChild(closeBtn);

      // Counter
      counterEl = document.createElement('div');
      counterEl.className = 'zebra-lightbox-counter';
      lightbox.appendChild(counterEl);

      // Main image area
      var imgWrap = document.createElement('div');
      imgWrap.className = 'zebra-lightbox-img-wrap';

      mainImg = document.createElement('img');
      mainImg.className = 'zebra-lightbox-main-img';
      imgWrap.appendChild(mainImg);
      lightbox.appendChild(imgWrap);

      // Prev button
      var prevBtn = document.createElement('button');
      prevBtn.className = 'zebra-lightbox-arrow zebra-lightbox-prev';
      prevBtn.innerHTML = '&#10094;';
      lightbox.appendChild(prevBtn);

      // Next button
      var nextBtn = document.createElement('button');
      nextBtn.className = 'zebra-lightbox-arrow zebra-lightbox-next';
      nextBtn.innerHTML = '&#10095;';
      lightbox.appendChild(nextBtn);

      // Thumbnail strip
      thumbStrip = document.createElement('div');
      thumbStrip.className = 'zebra-lightbox-thumbs';

      allPhotos.forEach(function(url, i) {
        var thumb = document.createElement('div');
        thumb.className = 'zebra-lightbox-thumb';
        thumb.style.backgroundImage = 'url(' + url.replace('/1200x900/', '/320x240/') + ')';
        thumb.setAttribute('data-idx', i);
        thumbStrip.appendChild(thumb);
      });
      lightbox.appendChild(thumbStrip);

      document.body.appendChild(lightbox);

      // Navigation
      function goTo(idx) {
        if (idx < 0) idx = allPhotos.length - 1;
        if (idx >= allPhotos.length) idx = 0;
        lightboxIndex = idx;
        mainImg.src = allPhotos[idx];
        counterEl.textContent = (idx + 1) + ' / ' + allPhotos.length;

        // Update thumb active state
        thumbStrip.querySelectorAll('.zebra-lightbox-thumb').forEach(function(t, ti) {
          t.classList.toggle('active', ti === idx);
        });

        // Scroll active thumb into view
        var activeThumb = thumbStrip.children[idx];
        if (activeThumb) {
          activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }

      prevBtn.addEventListener('click', function(e) { e.stopPropagation(); goTo(lightboxIndex - 1); });
      nextBtn.addEventListener('click', function(e) { e.stopPropagation(); goTo(lightboxIndex + 1); });
      closeBtn.addEventListener('click', closeLightbox);
      overlay.addEventListener('click', closeLightbox);

      // Thumb clicks
      thumbStrip.addEventListener('click', function(e) {
        var thumb = e.target.closest('.zebra-lightbox-thumb');
        if (thumb) {
          e.stopPropagation();
          goTo(parseInt(thumb.getAttribute('data-idx')));
        }
      });

      // Keyboard
      document.addEventListener('keydown', function(e) {
        if (!lightbox || !lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') goTo(lightboxIndex - 1);
        if (e.key === 'ArrowRight') goTo(lightboxIndex + 1);
      });

      // Swipe on main image
      var swStartX = 0;
      imgWrap.addEventListener('touchstart', function(e) {
        swStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      imgWrap.addEventListener('touchend', function(e) {
        var diff = swStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) goTo(lightboxIndex + 1);
          else goTo(lightboxIndex - 1);
        }
      }, { passive: true });
    }

    function openLightbox(startIdx) {
      buildLightbox();
      lightboxIndex = startIdx || 0;
      mainImg.src = allPhotos[lightboxIndex];
      counterEl.textContent = (lightboxIndex + 1) + ' / ' + allPhotos.length;

      // Set active thumb
      thumbStrip.querySelectorAll('.zebra-lightbox-thumb').forEach(function(t, ti) {
        t.classList.toggle('active', ti === lightboxIndex);
      });

      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      if (lightbox) {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
      }
    }

    // Attach click handlers to photo tab images
    photoTab.querySelectorAll('img').forEach(function(img, i) {
      var photoIdx = -1;
      // Find matching index in allPhotos
      allPhotos.forEach(function(url, j) {
        if (img.src === url) photoIdx = j;
      });
      if (photoIdx >= 0) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function(e) {
          e.preventDefault();
          openLightbox(photoIdx);
        });
      }
    });

    // Also open lightbox from header slideshow click
    var slideshowContainer = document.querySelector('.zebra-slideshow-container');
    if (slideshowContainer) {
      slideshowContainer.style.cursor = 'pointer';
      slideshowContainer.addEventListener('click', function(e) {
        // Don't open if clicking on nav buttons
        if (e.target.closest('.zebra-slideshow-btn') || e.target.closest('.zebra-slideshow-dot')) return;
        openLightbox(0);
      });
    }

    // Expose openLightbox so header image can trigger it too
    window._zebraOpenLightbox = openLightbox;
  }

  // ===== 10. "ASK AN EXPERT" BUTTON =====
  function addExpertButton() {
    var bookBtn = document.querySelector('.new_t-order-btn.new_t-order-btn-true');
    if (!bookBtn) return;
    // Don't duplicate
    if (document.querySelector('.zebra-expert-btn')) return;

    // Collect full tour details for WhatsApp message
    var hotelTitle = document.querySelector('.new_t-header-title');
    var hotelName = hotelTitle ? hotelTitle.textContent.trim() : 'acest hotel';

    var geoEl = document.querySelector('.new_t-header-geo');
    var geo = geoEl ? geoEl.textContent.trim().replace(/\s*Arată pe hartă\s*/i, '').replace(/\s*Показать на карте\s*/i, '').trim() : '';

    var priceEl = document.querySelector('.new_t-order-price');
    var price = priceEl ? priceEl.textContent.trim() : '';

    var ratingEl = document.querySelector('.new_t-header-rating-value');
    var rating = ratingEl ? ratingEl.textContent.trim() : '';

    // Get dates from the info table
    var dateEl = document.querySelector('.new_t-info-date, .new_t-info-table .new_t-info-value');
    var dates = '';
    // Try to find date info from info rows
    var infoRows = document.querySelectorAll('.new_t-info-row, .new_t-info-table tr');
    infoRows.forEach(function(row) {
      var text = row.textContent.trim();
      if (text.match(/дата|date|data|выезд|вылет/i) || text.match(/\d{1,2}\.\d{1,2}\.\d{2,4}/)) {
        if (!dates) dates = text.replace(/\s+/g, ' ').substring(0, 60);
      }
    });

    // Get food/meal type
    var foodEl = document.querySelector('.new_t-info-food, .new_t-header-food');
    var food = foodEl ? foodEl.textContent.trim() : '';

    // Get nights
    var nightsEl = null;
    infoRows.forEach(function(row) {
      var text = row.textContent.trim();
      if (text.match(/ноч|nop|noct|night|ніч/i)) {
        if (!nightsEl) nightsEl = text.replace(/\s+/g, ' ').substring(0, 40);
      }
    });

    // Build detailed WhatsApp message
    var msg = 'Bună ziua! Sunt interesat de acest tur:\n\n';
    msg += '🏨 ' + hotelName + '\n';
    if (geo) msg += '📍 ' + geo + '\n';
    if (price) msg += '💰 Preț: ' + price + '\n';
    if (dates) msg += '📅 ' + dates + '\n';
    if (nightsEl) msg += '🌙 ' + nightsEl + '\n';
    if (food) msg += '🍽️ ' + food + '\n';
    if (rating) msg += '⭐ Rating: ' + rating + '\n';
    msg += '🔗 ' + window.location.href + '\n';
    msg += '\nAș dori mai multe detalii. Mă puteți ajuta?';

    // Create the expert button
    var expertBtn = document.createElement('a');
    expertBtn.className = 'zebra-expert-btn';
    expertBtn.href = 'https://wa.me/37378326222?text=' + encodeURIComponent(msg);
    expertBtn.target = '_blank';
    expertBtn.rel = 'noopener';
    expertBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align: middle; margin-right: 6px;"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12zm-3-5h-2V9h2v2zm-4 0h-2V9h2v2zm-4 0H7V9h2v2z"/></svg>Întreabă un expert despre acest hotel';

    // Insert after the booking button
    bookBtn.parentNode.insertBefore(expertBtn, bookBtn.nextSibling);
  }

  // ===== 11. WISHLIST / FAVORITES =====
  var WISHLIST_KEY = 'zebra_wishlist';

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
    } catch(e) { return []; }
  }

  function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    updateWishlistCounter();
  }

  function isInWishlist(tourId) {
    return getWishlist().some(function(t) { return t.id === tourId; });
  }

  function toggleWishlistItem(tourData) {
    var list = getWishlist();
    var idx = -1;
    list.forEach(function(t, i) { if (t.id === tourData.id) idx = i; });
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      tourData.addedAt = Date.now();
      list.push(tourData);
    }
    saveWishlist(list);
    return idx < 0; // returns true if added, false if removed
  }

  function removeFromWishlist(tourId) {
    var list = getWishlist().filter(function(t) { return t.id !== tourId; });
    saveWishlist(list);
  }

  // Generate a unique ID for a tour from its link/name
  function getTourId(link, name) {
    // Try to extract tour ID from URL hash or params
    if (link) {
      var match = link.match(/(?:#|tourId=|\/tour\/)(\d+)/);
      if (match) return 'tour_' + match[1];
    }
    // Fallback: hash from name
    var hash = 0;
    var str = (name || '') + (link || '');
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'tour_' + Math.abs(hash);
  }

  // Update the floating counter badge
  function updateWishlistCounter() {
    var badge = document.getElementById('zebraWishlistBadge');
    if (badge) {
      var count = getWishlist().length;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
    // Also update panel if open
    var panel = document.getElementById('zebraWishlistPanel');
    if (panel && panel.classList.contains('open')) {
      renderWishlistPanel();
    }
    // Update all heart button states
    document.querySelectorAll('.zebra-heart-btn').forEach(function(btn) {
      var id = btn.getAttribute('data-tour-id');
      if (id) {
        btn.classList.toggle('active', isInWishlist(id));
      }
    });
  }

  // ===== 11a. Heart buttons on search result cards =====
  function addWishlistHearts() {
    var cards = document.querySelectorAll('.new_r-item-wrap');
    cards.forEach(function(wrap) {
      // Skip if already has heart
      if (wrap.querySelector('.zebra-heart-btn')) return;

      // Extract tour data from card
      var link = '';
      var linkEl = wrap.querySelector('a[href]');
      if (linkEl) link = linkEl.href || linkEl.getAttribute('href') || '';
      // Also check if the card itself is clickable
      if (!link) {
        var itemEl = wrap.querySelector('.new_r-item');
        if (itemEl && itemEl.getAttribute('onclick')) {
          var onclickStr = itemEl.getAttribute('onclick');
          var urlMatch = onclickStr.match(/['"]([^'"]*)['"]/);
          if (urlMatch) link = urlMatch[1];
        }
      }

      var nameEl = wrap.querySelector('.new_r-item-hotel');
      var name = nameEl ? nameEl.textContent.trim() : '';
      var priceEl = wrap.querySelector('.new_r-item-price');
      var price = priceEl ? priceEl.textContent.trim() : '';
      var ratingEl = wrap.querySelector('.new_r-item-rating-value');
      var rating = ratingEl ? ratingEl.textContent.trim() : '';
      var geoEl = wrap.querySelector('.new_r-item-geo');
      var geo = geoEl ? geoEl.textContent.trim() : '';
      // Remove "Arată pe hartă" from geo text
      geo = geo.replace(/\s*Arată pe hartă\s*/i, '').replace(/\s*Показать на карте\s*/i, '').trim();
      var starsEl = wrap.querySelector('.new_r-item-stars');
      var stars = starsEl ? starsEl.className : '';
      var starsCount = 0;
      var starsMatch = stars.match(/stars-(\d)/);
      if (starsMatch) starsCount = parseInt(starsMatch[1]);
      var foodEl = wrap.querySelector('.new_r-item-food');
      var food = foodEl ? foodEl.textContent.trim() : '';
      var dateEl = wrap.querySelector('.new_r-item-date');
      var dates = dateEl ? dateEl.textContent.trim() : '';
      var fromEl = wrap.querySelector('.new_r-item-from');
      var from = fromEl ? fromEl.textContent.trim() : '';
      if (from && dates) dates = dates + ' · ' + from;

      // Get image URL from background-image or data-original (lazy load fallback)
      var imgEl = wrap.querySelector('.new_r-item-img');
      var imgUrl = '';
      if (imgEl) {
        // First try data-original (always present, even before lazy-load triggers)
        var dataOrig = imgEl.getAttribute('data-original');
        if (dataOrig && dataOrig.length > 10) {
          imgUrl = dataOrig;
        }
        // Fallback to background-image style
        if (!imgUrl) {
          var bgStyle = imgEl.style.backgroundImage || '';
          if (!bgStyle || bgStyle === 'none') bgStyle = getComputedStyle(imgEl).backgroundImage || '';
          var bgMatch = bgStyle.match(/url\(["']?([^"')]+)["']?\)/);
          if (bgMatch) imgUrl = bgMatch[1];
        }
      }

      var tourId = getTourId(link, name);

      var tourData = {
        id: tourId,
        name: name,
        price: price,
        rating: rating,
        geo: geo,
        stars: starsCount,
        food: food,
        dates: dates,
        img: imgUrl,
        link: link
      };

      // Create heart button
      var heartBtn = document.createElement('button');
      heartBtn.className = 'zebra-heart-btn' + (isInWishlist(tourId) ? ' active' : '');
      heartBtn.setAttribute('data-tour-id', tourId);
      heartBtn.title = 'Adaugă la favorite';
      heartBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

      heartBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var added = toggleWishlistItem(tourData);
        heartBtn.classList.toggle('active', added);

        // Animate
        heartBtn.classList.add('zebra-heart-pop');
        setTimeout(function() { heartBtn.classList.remove('zebra-heart-pop'); }, 400);

        // Show toast
        showWishlistToast(added ? '❤️ Adăugat la favorite' : 'Eliminat din favorite');
      });

      // Append to the card
      var itemEl = wrap.querySelector('.new_r-item');
      if (itemEl) {
        itemEl.style.position = 'relative';
        itemEl.appendChild(heartBtn);
      }
    });
  }

  // ===== 11b. Floating wishlist button =====
  function createWishlistButton() {
    // Don't duplicate
    if (document.getElementById('zebraWishlistFloat')) return;

    var btn = document.createElement('button');
    btn.id = 'zebraWishlistFloat';
    btn.title = 'Favorite';
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

    var badge = document.createElement('span');
    badge.id = 'zebraWishlistBadge';
    var count = getWishlist().length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
    btn.appendChild(badge);

    document.body.appendChild(btn);

    btn.addEventListener('click', function() {
      toggleWishlistPanel();
    });
  }

  // ===== 11c. Wishlist slide-out panel =====
  function createWishlistPanel() {
    if (document.getElementById('zebraWishlistPanel')) return;

    var panel = document.createElement('div');
    panel.id = 'zebraWishlistPanel';

    // Header
    var header = document.createElement('div');
    header.className = 'zebra-wishlist-header';
    header.innerHTML = '<span class="zebra-wishlist-title"><svg viewBox="0 0 24 24" width="20" height="20" fill="#ef4444"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> Favorite</span>';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'zebra-wishlist-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', function() { toggleWishlistPanel(false); });
    header.appendChild(closeBtn);

    panel.appendChild(header);

    // Body (scrollable list)
    var body = document.createElement('div');
    body.className = 'zebra-wishlist-body';
    body.id = 'zebraWishlistBody';
    panel.appendChild(body);

    // Footer with action buttons
    var footer = document.createElement('div');
    footer.className = 'zebra-wishlist-footer';
    footer.id = 'zebraWishlistFooter';
    panel.appendChild(footer);

    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'zebraWishlistOverlay';
    overlay.addEventListener('click', function() { toggleWishlistPanel(false); });

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
  }

  function toggleWishlistPanel(forceState) {
    var panel = document.getElementById('zebraWishlistPanel');
    var overlay = document.getElementById('zebraWishlistOverlay');
    if (!panel || !overlay) return;

    var isOpen = typeof forceState === 'boolean' ? forceState : !panel.classList.contains('open');

    if (isOpen) {
      renderWishlistPanel();
      panel.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else {
      panel.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function renderWishlistPanel() {
    var body = document.getElementById('zebraWishlistBody');
    if (!body) return;

    var list = getWishlist();

    if (list.length === 0) {
      body.innerHTML = '<div class="zebra-wishlist-empty">' +
        '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#cbd5e1" stroke-width="1.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
        '<p>Nu aveți tururi la favorite</p>' +
        '<span>Apăsați pe ❤️ pentru a salva</span>' +
        '</div>';
      return;
    }

    // Sort by most recently added
    list.sort(function(a, b) { return (b.addedAt || 0) - (a.addedAt || 0); });

    var html = '';
    list.forEach(function(tour) {
      var starsHtml = '';
      for (var s = 0; s < (tour.stars || 0); s++) starsHtml += '★';

      html += '<div class="zebra-wishlist-card" data-tour-id="' + tour.id + '">' +
        '<div class="zebra-wishlist-card-img" style="background-image:url(' + (tour.img || '') + ')"></div>' +
        '<div class="zebra-wishlist-card-info">' +
          '<div class="zebra-wishlist-card-name">' + (tour.name || 'Hotel') + '</div>' +
          (tour.geo ? '<div class="zebra-wishlist-card-geo">' + tour.geo + '</div>' : '') +
          '<div class="zebra-wishlist-card-details">' +
            (starsHtml ? '<span class="zebra-wishlist-stars">' + starsHtml + '</span>' : '') +
            (tour.food ? '<span class="zebra-wishlist-food">' + tour.food + '</span>' : '') +
            (tour.rating ? '<span class="zebra-wishlist-rating">' + tour.rating + '</span>' : '') +
          '</div>' +
          (tour.dates ? '<div class="zebra-wishlist-card-dates">' + tour.dates + '</div>' : '') +
          (tour.price ? '<div class="zebra-wishlist-card-price">' + tour.price + '</div>' : '') +
        '</div>' +
        '<button class="zebra-wishlist-remove" title="Elimină" data-remove-id="' + tour.id + '">&times;</button>' +
      '</div>';
    });

    body.innerHTML = html;

    // Card clicks → open tour
    body.querySelectorAll('.zebra-wishlist-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.zebra-wishlist-remove')) return;
        var tourId = card.getAttribute('data-tour-id');
        var tour = list.find(function(t) { return t.id === tourId; });
        if (tour && tour.link) {
          window.location.href = tour.link;
        }
      });
    });

    // Remove buttons
    body.querySelectorAll('.zebra-wishlist-remove').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-remove-id');
        removeFromWishlist(id);
        // Animate card out
        var card = btn.closest('.zebra-wishlist-card');
        if (card) {
          card.style.transform = 'translateX(100%)';
          card.style.opacity = '0';
          setTimeout(function() {
            renderWishlistPanel();
            updateWishlistCounter();
          }, 300);
        }
      });
    });

    // Render footer action buttons
    renderWishlistFooter(list);
  }

  // ===== 11f. Generate share text from wishlist =====
  function buildShareText(list) {
    var text = '🌴 Tururile mele favorite de pe ZebraTur:\n\n';
    list.forEach(function(tour, i) {
      text += (i + 1) + '. ' + (tour.name || 'Hotel');
      if (tour.stars) {
        var s = '';
        for (var x = 0; x < tour.stars; x++) s += '⭐';
        text += ' ' + s;
      }
      text += '\n';
      if (tour.geo) text += '   📍 ' + tour.geo + '\n';
      if (tour.food) text += '   🍽️ ' + tour.food + '\n';
      if (tour.dates) text += '   📅 ' + tour.dates + '\n';
      if (tour.price) text += '   💰 ' + tour.price + '\n';
      if (tour.rating) text += '   ⭐ Rating: ' + tour.rating + '\n';
      if (tour.link) text += '   🔗 ' + tour.link + '\n';
      text += '\n';
    });
    text += '✈️ Descoperă și tu pe zebratur.md';
    return text;
  }

  // ===== 11g. Wishlist footer with expert + share =====
  function renderWishlistFooter(list) {
    var footer = document.getElementById('zebraWishlistFooter');
    if (!footer) return;

    if (!list || list.length === 0) {
      footer.innerHTML = '';
      return;
    }

    footer.innerHTML = '';

    // "Ask expert" button - sends all tours to WhatsApp
    var expertBtn = document.createElement('a');
    expertBtn.className = 'zebra-wishlist-expert-btn';
    var expertText = 'Bună ziua! Am selectat câteva hoteluri și aș dori ajutorul dvs. pentru a alege cea mai bună variantă:\n\n';
    list.forEach(function(tour, i) {
      expertText += (i + 1) + '. ' + (tour.name || 'Hotel');
      if (tour.price) expertText += ' - ' + tour.price;
      if (tour.dates) expertText += ' (' + tour.dates + ')';
      expertText += '\n';
    });
    expertText += '\nCare variantă recomandați?';
    expertBtn.href = 'https://wa.me/37378326222?text=' + encodeURIComponent(expertText);
    expertBtn.target = '_blank';
    expertBtn.rel = 'noopener';
    expertBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12zm-3-5h-2V9h2v2zm-4 0h-2V9h2v2zm-4 0H7V9h2v2z"/></svg> Cere un expert să te ajute';
    footer.appendChild(expertBtn);

    // "Rezervă o ofertă" button - opens email form
    var reserveBtn = document.createElement('button');
    reserveBtn.className = 'zebra-wishlist-reserve-btn';
    reserveBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg> Rezervă o ofertă pe email';
    reserveBtn.addEventListener('click', function() {
      openEmailFormModal(list);
    });
    footer.appendChild(reserveBtn);

    // Share label
    var shareLabel = document.createElement('div');
    shareLabel.className = 'zebra-wishlist-share-label';
    shareLabel.textContent = 'Distribuie favoritele:';
    footer.appendChild(shareLabel);

    // Share row 2 (copy, wa, viber)
    var shareRow2 = document.createElement('div');
    shareRow2.className = 'zebra-wishlist-share-row';

    var copyBtn2 = document.createElement('button');
    copyBtn2.className = 'zebra-wishlist-share-btn zebra-share-copy';
    copyBtn2.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copiază';
    copyBtn2.addEventListener('click', function() {
      var text = buildShareText(list);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
          showWishlistToast('Copiat în clipboard!');
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showWishlistToast('Copiat în clipboard!');
      }
    });

    var waBtn2 = document.createElement('a');
    waBtn2.className = 'zebra-wishlist-share-btn zebra-share-whatsapp';
    waBtn2.target = '_blank';
    waBtn2.rel = 'noopener';
    waBtn2.href = 'https://wa.me/?text=' + encodeURIComponent(buildShareText(list));
    waBtn2.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp';

    var viberBtn2 = document.createElement('a');
    viberBtn2.className = 'zebra-wishlist-share-btn zebra-share-viber';
    viberBtn2.target = '_blank';
    viberBtn2.rel = 'noopener';
    viberBtn2.href = 'viber://forward?text=' + encodeURIComponent(buildShareText(list));
    viberBtn2.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11.398.002C9.47.028 5.276.395 3.297 2.22 1.67 3.845 1.108 6.27 1.046 9.233c-.062 2.963-.14 8.524 5.21 10.09h.004l-.004 2.318s-.038.937.582 1.128c.75.23 1.19-.483 1.907-1.258.393-.425.936-1.049 1.346-1.528 3.705.312 6.555-.4 6.88-.5.748-.236 4.98-.785 5.67-6.404.71-5.792-.336-9.45-2.164-11.097l-.002-.003c-.53-.56-2.63-2.12-7.058-2.425-.01 0-.22-.018-.52-.003l.001.001zm.098 1.67c.26-.012.44.003.44.003 3.745.258 5.534 1.544 5.96 1.99l.002.001C19.34 5.03 20.19 8.21 19.59 13.16c-.577 4.69-4.08 5.024-4.726 5.228-.268.082-2.724.692-5.83.476 0 0-2.309 2.787-3.032 3.518-.113.114-.245.16-.333.138-.124-.03-.158-.177-.156-.39.002-.141.01-4.016.01-4.016-4.42-1.29-4.16-5.97-4.106-8.352.052-2.382.49-4.433 1.834-5.768C4.847 2.46 8.428 2.035 10.39 1.93c.367-.02.753-.036 1.105-.259z"/><path d="M11.873 4.775c-.203 0-.203.315 0 .319 1.334.021 2.568.49 3.49 1.407.923.918 1.393 2.09 1.478 3.392.01.207.325.2.316-.005-.09-1.405-.6-2.672-1.594-3.654-1-1.002-2.314-1.502-3.69-1.46zm.52 1.633c-.19.01-.186.314.004.32.744.047 1.345.373 1.84.888.497.514.727 1.122.75 1.836.005.205.32.193.316-.012-.028-.81-.295-1.51-.854-2.088-.555-.576-1.26-.905-2.055-.944zm.24 1.77c-.127-.003-.2.18-.065.254.23.125.399.29.503.534.105.244.127.5.074.77-.04.197.26.28.302.08.068-.333.045-.66-.1-.98-.144-.316-.4-.537-.713-.658zM8.67 7.225c-.17-.018-.35.05-.477.2L7.77 7.91c-.33.39-.39.896-.098 1.345.55.94 1.273 1.79 2.151 2.603.04.037.08.074.122.11.038.04.075.08.112.12.81.88 1.66 1.603 2.603 2.152.448.29.954.23 1.345-.1l.485-.422c.22-.19.318-.5.24-.764-.09-.293-.457-.63-.457-.63l-1.063-.828c-.218-.155-.5-.141-.687.02l-.38.372c-.178.175-.468.19-.468.19s-1.424.19-2.847-1.233c-1.422-1.423-1.233-2.847-1.233-2.847s.016-.29.192-.468l.37-.38c.16-.188.178-.47.022-.688l-.83-1.063s-.337-.369-.63-.458c-.06-.02-.12-.033-.177-.038z"/></svg> Viber';

    shareRow2.appendChild(copyBtn2);
    shareRow2.appendChild(waBtn2);
    shareRow2.appendChild(viberBtn2);
    footer.appendChild(shareRow2);

    // Clear all button
    var clearBtn = document.createElement('button');
    clearBtn.className = 'zebra-wishlist-clear-btn';
    clearBtn.textContent = 'Șterge toate';
    clearBtn.addEventListener('click', function() {
      saveWishlist([]);
      renderWishlistPanel();
      document.querySelectorAll('.zebra-heart-btn.active').forEach(function(h) { h.classList.remove('active'); });
    });
    footer.appendChild(clearBtn);
  }

  // ===== 11h. Email form modal =====
  function buildEmailTourList(list) {
    var html = '<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">';
    list.forEach(function(tour, i) {
      var starsStr = '';
      for (var s = 0; s < (tour.stars || 0); s++) starsStr += '★';
      html += '<tr style="border-bottom:1px solid #eee;">';
      html += '<td style="padding:8px;width:30px;color:#3b82f6;font-weight:bold;">' + (i+1) + '.</td>';
      html += '<td style="padding:8px;">';
      html += '<strong>' + (tour.name || 'Hotel') + '</strong>';
      if (starsStr) html += ' <span style="color:#f59e0b;">' + starsStr + '</span>';
      html += '<br>';
      if (tour.geo) html += '<span style="color:#64748b;font-size:13px;">📍 ' + tour.geo + '</span><br>';
      var details = [];
      if (tour.food) details.push('🍽️ ' + tour.food);
      if (tour.dates) details.push('📅 ' + tour.dates);
      if (tour.rating) details.push('⭐ ' + tour.rating);
      if (details.length) html += '<span style="color:#64748b;font-size:13px;">' + details.join(' &middot; ') + '</span><br>';
      if (tour.price) html += '<span style="color:#2563eb;font-weight:bold;font-size:15px;">' + tour.price + '</span>';
      if (tour.link) html += ' <a href="' + tour.link + '" style="color:#3b82f6;font-size:12px;">Vezi detalii</a>';
      html += '</td></tr>';
    });
    html += '</table>';
    return html;
  }

  function buildEmailPlainText(list) {
    var text = '';
    list.forEach(function(tour, i) {
      text += (i+1) + '. ' + (tour.name || 'Hotel');
      if (tour.price) text += ' - ' + tour.price;
      if (tour.geo) text += ' (' + tour.geo + ')';
      if (tour.dates) text += ' | ' + tour.dates;
      if (tour.food) text += ' | ' + tour.food;
      if (tour.link) text += '\n   ' + tour.link;
      text += '\n';
    });
    return text;
  }

  function openEmailFormModal(list) {
    // Remove existing modal
    var existing = document.getElementById('zebraEmailModal');
    if (existing) existing.remove();
    var existingOverlay = document.getElementById('zebraEmailOverlay');
    if (existingOverlay) existingOverlay.remove();

    // Build modal
    var overlay = document.createElement('div');
    overlay.id = 'zebraEmailOverlay';

    var modal = document.createElement('div');
    modal.id = 'zebraEmailModal';

    // Header
    var header = document.createElement('div');
    header.className = 'zebra-email-header';
    header.innerHTML = '<div class="zebra-email-header-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="#3b82f6"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg></div>' +
      '<h3 class="zebra-email-title">Rezervă o ofertă</h3>' +
      '<p class="zebra-email-subtitle">Completează datele și vei primi pe email detaliile ofertelor selectate</p>';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'zebra-email-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closeEmailModal);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // Tours preview (collapsed)
    var preview = document.createElement('div');
    preview.className = 'zebra-email-tours-preview';
    preview.innerHTML = '<span class="zebra-email-tours-count">' + list.length + ' ' + (list.length === 1 ? 'tur selectat' : 'tururi selectate') + '</span>';
    var tourNames = list.map(function(t) { return t.name || 'Hotel'; }).join(', ');
    if (tourNames.length > 80) tourNames = tourNames.substring(0, 77) + '...';
    preview.innerHTML += '<span class="zebra-email-tours-names">' + tourNames + '</span>';
    modal.appendChild(preview);

    // Form
    var form = document.createElement('form');
    form.className = 'zebra-email-form';
    form.setAttribute('action', 'https://formsubmit.co/ianyx1997@gmail.com');
    form.setAttribute('method', 'POST');

    // Hidden fields
    var hiddenSubject = document.createElement('input');
    hiddenSubject.type = 'hidden';
    hiddenSubject.name = '_subject';
    hiddenSubject.value = 'Cerere ofertă - ' + list.length + ' tururi favorite de pe zebratur.md';
    form.appendChild(hiddenSubject);

    var hiddenNext = document.createElement('input');
    hiddenNext.type = 'hidden';
    hiddenNext.name = '_next';
    hiddenNext.value = window.location.href;
    form.appendChild(hiddenNext);

    var hiddenCaptcha = document.createElement('input');
    hiddenCaptcha.type = 'hidden';
    hiddenCaptcha.name = '_captcha';
    hiddenCaptcha.value = 'false';
    form.appendChild(hiddenCaptcha);

    var hiddenTemplate = document.createElement('input');
    hiddenTemplate.type = 'hidden';
    hiddenTemplate.name = '_template';
    hiddenTemplate.value = 'table';
    form.appendChild(hiddenTemplate);

    // Tours data (hidden)
    var hiddenTours = document.createElement('textarea');
    hiddenTours.name = 'Tururi Selectate';
    hiddenTours.style.display = 'none';
    hiddenTours.value = buildEmailPlainText(list);
    form.appendChild(hiddenTours);

    // Name field
    var nameGroup = createFormField('Nume și prenume', 'text', 'Nume', 'Ion Popescu', true);
    form.appendChild(nameGroup);

    // Phone field
    var phoneGroup = createFormField('Telefon', 'tel', 'Telefon', '+373 XX XXX XXX', true);
    form.appendChild(phoneGroup);

    // Email field
    var emailGroup = createFormField('Email', 'email', 'Email', 'exemplu@mail.com', true);
    form.appendChild(emailGroup);

    // Message field
    var msgGroup = document.createElement('div');
    msgGroup.className = 'zebra-email-field';
    var msgLabel = document.createElement('label');
    msgLabel.textContent = 'Mesaj (opțional)';
    msgLabel.className = 'zebra-email-label';
    var msgInput = document.createElement('textarea');
    msgInput.name = 'Mesaj';
    msgInput.className = 'zebra-email-input zebra-email-textarea';
    msgInput.placeholder = 'Precizări suplimentare, preferințe...';
    msgInput.rows = 3;
    msgGroup.appendChild(msgLabel);
    msgGroup.appendChild(msgInput);
    form.appendChild(msgGroup);

    // Buttons row
    var btnsRow = document.createElement('div');
    btnsRow.className = 'zebra-email-btns-row';

    // Submit button
    var submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'zebra-email-submit';
    submitBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> Trimite cererea';
    btnsRow.appendChild(submitBtn);

    // Copy offer button
    var copyOfferBtn = document.createElement('button');
    copyOfferBtn.type = 'button';
    copyOfferBtn.className = 'zebra-email-copy-btn';
    copyOfferBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copiază oferta';
    copyOfferBtn.addEventListener('click', function() {
      var text = buildShareText(list);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
          showWishlistToast('Oferta a fost copiată!');
          copyOfferBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Copiat!';
          setTimeout(function() {
            copyOfferBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copiază oferta';
          }, 2500);
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showWishlistToast('Oferta a fost copiată!');
      }
    });
    btnsRow.appendChild(copyOfferBtn);

    form.appendChild(btnsRow);

    // Form submit handler
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      // Validate
      var nameVal = form.querySelector('[name="Nume"]').value.trim();
      var phoneVal = form.querySelector('[name="Telefon"]').value.trim();
      var emailVal = form.querySelector('[name="Email"]').value.trim();

      if (!nameVal || !phoneVal || !emailVal) {
        showWishlistToast('Completați toate câmpurile obligatorii');
        return;
      }

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="zebra-email-spinner"></span> Se trimite...';

      // Submit via fetch to FormSubmit.co
      var formData = new FormData(form);
      fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      }).then(function(response) {
        if (response.ok) {
          // Success
          modal.innerHTML = '<div class="zebra-email-success">' +
            '<div class="zebra-email-success-icon">✓</div>' +
            '<h3>Cererea a fost trimisă!</h3>' +
            '<p>Veți fi contactat în cel mai scurt timp de un expert ZebraTur.</p>' +
            '<button class="zebra-email-success-close" onclick="document.getElementById(\'zebraEmailModal\').remove();document.getElementById(\'zebraEmailOverlay\').remove();">Închide</button>' +
            '</div>';
          showWishlistToast('Cererea a fost trimisă cu succes!');
        } else {
          throw new Error('Eroare server');
        }
      }).catch(function(err) {
        // Fallback: open mailto
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> Trimite cererea';

        var subject = encodeURIComponent('Cerere ofertă - tururi favorite');
        var body = encodeURIComponent(
          'Nume: ' + nameVal + '\n' +
          'Telefon: ' + phoneVal + '\n' +
          'Email: ' + emailVal + '\n\n' +
          'Tururi selectate:\n' + buildEmailPlainText(list) + '\n' +
          (form.querySelector('[name="Mesaj"]').value ? 'Mesaj: ' + form.querySelector('[name="Mesaj"]').value : '')
        );
        window.open('mailto:ianyx1997@gmail.com?subject=' + subject + '&body=' + body, '_blank');
        showWishlistToast('Se deschide aplicația de email...');
        closeEmailModal();
      });
    });

    modal.appendChild(form);
    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // Animate in
    requestAnimationFrame(function() {
      overlay.classList.add('open');
      modal.classList.add('open');
    });

    overlay.addEventListener('click', closeEmailModal);
  }

  function createFormField(labelText, type, name, placeholder, required) {
    var group = document.createElement('div');
    group.className = 'zebra-email-field';
    var label = document.createElement('label');
    label.className = 'zebra-email-label';
    label.textContent = labelText;
    if (required) {
      var asterisk = document.createElement('span');
      asterisk.className = 'zebra-email-required';
      asterisk.textContent = ' *';
      label.appendChild(asterisk);
    }
    var input = document.createElement('input');
    input.type = type;
    input.name = name;
    input.className = 'zebra-email-input';
    input.placeholder = placeholder;
    if (required) input.required = true;
    group.appendChild(label);
    group.appendChild(input);
    return group;
  }

  function closeEmailModal() {
    var modal = document.getElementById('zebraEmailModal');
    var overlay = document.getElementById('zebraEmailOverlay');
    if (modal) {
      modal.classList.remove('open');
      setTimeout(function() { modal.remove(); }, 300);
    }
    if (overlay) {
      overlay.classList.remove('open');
      setTimeout(function() { overlay.remove(); }, 300);
    }
  }

  // ===== 11d. Toast notification =====
  function showWishlistToast(message) {
    // Remove existing toast
    var existing = document.getElementById('zebraWishlistToast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'zebraWishlistToast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(function() {
      toast.classList.add('show');
    });

    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.remove(); }, 300);
    }, 2000);
  }

  // ===== 11e. Wishlist on tour detail page =====
  function addTourPageWishlist() {
    var header = document.querySelector('.new_t-header');
    if (!header) return;

    // Extract tour data from detail page
    var titleEl = document.querySelector('.new_t-header-title');
    var name = titleEl ? titleEl.textContent.trim() : '';
    var link = window.location.href;

    // Get image
    var slideshow = document.querySelector('.zebra-slideshow-container img.active');
    var headerImgEl = document.querySelector('.new_t-header-desktop-img');
    var imgUrl = '';
    if (slideshow) {
      imgUrl = slideshow.src || '';
    } else if (headerImgEl) {
      var bgStyle = headerImgEl.style.backgroundImage || getComputedStyle(headerImgEl).backgroundImage;
      var bgMatch = bgStyle.match(/url\(["']?([^"')]+)["']?\)/);
      if (bgMatch) imgUrl = bgMatch[1];
    }

    // Get price
    var priceEl = document.querySelector('.new_t-order-price');
    var price = priceEl ? priceEl.textContent.trim() : '';

    // Get rating
    var ratingEl = document.querySelector('.new_t-header-rating-value');
    var rating = ratingEl ? ratingEl.textContent.trim() : '';

    // Get geo
    var geoEl = document.querySelector('.new_t-header-geo');
    var geo = geoEl ? geoEl.textContent.trim() : '';

    var tourId = getTourId(link, name);

    var tourData = {
      id: tourId,
      name: name,
      price: price,
      rating: rating,
      geo: geo,
      stars: 0,
      food: '',
      dates: '',
      img: imgUrl,
      link: link
    };

    // Create the heart button for the tour page
    var heartBtn = document.createElement('button');
    heartBtn.className = 'zebra-heart-btn zebra-heart-tour-page' + (isInWishlist(tourId) ? ' active' : '');
    heartBtn.setAttribute('data-tour-id', tourId);
    heartBtn.title = 'Adaugă la favorite';
    heartBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> <span>Favorite</span>';

    heartBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var added = toggleWishlistItem(tourData);
      heartBtn.classList.toggle('active', added);
      heartBtn.classList.add('zebra-heart-pop');
      setTimeout(function() { heartBtn.classList.remove('zebra-heart-pop'); }, 400);
      showWishlistToast(added ? '❤️ Adăugat la favorite' : 'Eliminat din favorite');
    });

    // Insert near the header title
    var titleWrap = document.querySelector('.new_t-header-title');
    if (titleWrap && titleWrap.parentNode) {
      titleWrap.parentNode.insertBefore(heartBtn, titleWrap.nextSibling);
    }
  }

  // ===== INITIALIZE =====
  createScrollTopButton();
  createWishlistButton();
  createWishlistPanel();

  // Tour page features (slideshow + lightbox + expert button + wishlist)
  // Use polling to wait for tour page content to load (can be slow)
  function initTourPage() {
    var headerImg = document.querySelector('.new_t-header-desktop-img');
    var bookBtn = document.querySelector('.new_t-order-btn');
    if (headerImg || bookBtn) {
      setupTourSlideshow();
      setupLightbox();
      addExpertButton();
      addTourPageWishlist();
      return true;
    }
    return false;
  }

  // Check if we're on a tour page (hash contains page=tour)
  if (window.location.hash.indexOf('page=tour') > -1 || document.querySelector('.new_t-container')) {
    // Try immediately, then retry every 2s for up to 30s
    if (!initTourPage()) {
      var tourRetry = setInterval(function() {
        if (initTourPage()) clearInterval(tourRetry);
      }, 2000);
      setTimeout(function() { clearInterval(tourRetry); }, 30000);
    }
  }

  waitForWidget(function() {
    autoLoadMoreResults();
    createResultsCounter();
    highlightBestDeal();
    setupScrollReveal();
    setupHotelTooltips();
    setupKeyboardNav();
    watchForUpdates();
    addWishlistHearts();
  });

  // Re-apply hearts when results update
  var wishlistObserver = new MutationObserver(function() {
    setTimeout(addWishlistHearts, 500);
  });
  var rWrapper = document.querySelector('.new_r-wrapper');
  if (rWrapper) {
    wishlistObserver.observe(rWrapper, { childList: true, subtree: true });
  } else {
    // Retry after widget loads
    var retryObs = setInterval(function() {
      var w = document.querySelector('.new_r-wrapper');
      if (w) {
        clearInterval(retryObs);
        wishlistObserver.observe(w, { childList: true, subtree: true });
      }
    }, 1000);
    setTimeout(function() { clearInterval(retryObs); }, 30000);
  }

})();
