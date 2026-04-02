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

    // Get hotel name for the WhatsApp message
    var hotelTitle = document.querySelector('.new_t-header-title');
    var hotelName = hotelTitle ? hotelTitle.textContent.trim() : 'acest hotel';

    // Create the expert button
    var expertBtn = document.createElement('a');
    expertBtn.className = 'zebra-expert-btn';
    expertBtn.href = 'https://wa.me/37378326222?text=' + encodeURIComponent('Bună ziua! Aș dori să aflu mai multe detalii despre ' + hotelName + '. Mă puteți ajuta?');
    expertBtn.target = '_blank';
    expertBtn.rel = 'noopener';
    expertBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align: middle; margin-right: 6px;"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12zm-3-5h-2V9h2v2zm-4 0h-2V9h2v2zm-4 0H7V9h2v2z"/></svg>Întreabă un expert';

    // Insert after the booking button
    bookBtn.parentNode.insertBefore(expertBtn, bookBtn.nextSibling);
  }

  // ===== INITIALIZE =====
  createScrollTopButton();

  // Tour page features (slideshow + lightbox + expert button)
  if (document.querySelector('.new_t-header-desktop-img')) {
    setTimeout(function() {
      setupTourSlideshow();
      setupLightbox();
      addExpertButton();
    }, 1500);
  }

  waitForWidget(function() {
    autoLoadMoreResults();
    createResultsCounter();
    highlightBestDeal();
    setupScrollReveal();
    setupHotelTooltips();
    setupKeyboardNav();
    watchForUpdates();
  });

})();
