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
    var maxClicks = 5; // Safety limit
    var clicksDone = 0;

    function tryLoadMore() {
      var currentCount = document.querySelectorAll('.new_r-item').length;
      var showMore = document.querySelector('.new_r-show-more-results');

      if (currentCount >= targetCount || clicksDone >= maxClicks || !showMore || getComputedStyle(showMore).display === 'none') {
        return; // Done
      }

      clicksDone++;
      showMore.click();

      // Wait for new results to load, then try again
      setTimeout(tryLoadMore, 2000);
    }

    // Start after a small delay to let first results render
    setTimeout(tryLoadMore, 1500);
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

  // ===== 3. BEST DEAL HIGHLIGHT =====
  function highlightBestDeal() {
    var items = document.querySelectorAll('.new_r-item-wrap');
    var bestPrice = Infinity;
    var bestItem = null;

    items.forEach(function(wrap) {
      var priceEl = wrap.querySelector('.new_r-item-price');
      if (priceEl) {
        var priceText = priceEl.textContent.replace(/[^\d]/g, '');
        var price = parseInt(priceText);
        if (price > 0 && price < bestPrice) {
          bestPrice = price;
          bestItem = wrap;
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

  // ===== INITIALIZE =====
  createScrollTopButton();

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
