(function() {
  'use strict';

  /**
   * EVID-DGC Screen-Size Policy
   * ----------------------------
   * Protected application workspaces (admin, evidence management, case
   * management, audit center, forensic review, blockchain monitoring, ...)
   * are restricted on phone-sized viewports.
   *
   * Decision is based on the EFFECTIVE VIEWPORT WIDTH — a responsive
   * capability check — not on the browser user-agent string:
   *   - Blocked:  effective viewport width below 768px (phones).
   *   - Allowed:  laptops, desktops, and tablets at or above 768px,
   *               including tablet portrait and landscape.
   *
   * The restriction is a UX guard only. Server-side authorization,
   * authentication and session handling are never bypassed by this file.
   *
   * When a protected page is blocked, the original application URL is
   * stored in sessionStorage (key below) so the restriction screen can
   * return the user to the same place once the viewport is supported.
   */

  var MIN_WIDTH = 768;
  var RECOMMENDED_WIDTH = 1024;
  var FORCE_DESKTOP_PARAM = 'forceDesktop';
  var RETURN_KEY = 'evidDgcReturn';
  var NOTICE_PATH = '/desktop-only.html';

  /**
   * Effective viewport width. clientWidth excludes the scrollbar and
   * matches CSS media query evaluation; innerWidth is the fallback.
   */
  function getViewportWidth() {
    var doc = document.documentElement;
    var w = doc && doc.clientWidth;
    if (w === undefined || w === null || w === 0) w = window.innerWidth;
    return w || 0;
  }

  function isForcedDesktop() {
    // forceDesktop only works in development (window.config?.DEV_FORCE_DESKTOP === true)
    var devOverride = window.config && window.config.DEV_FORCE_DESKTOP === true;
    return devOverride && window.location.search.indexOf(FORCE_DESKTOP_PARAM + '=true') !== -1;
  }

  function mqMatches(query) {
    if (typeof window.matchMedia !== 'function') return false;
    var mq = window.matchMedia(query);
    return !!(mq && mq.matches);
  }

  function detectCapabilities() {
    var touch = (navigator.maxTouchPoints || (navigator.msMaxTouchPoints || 0)) > 0 ||
                'ontouchstart' in window;
    var coarse = mqMatches('(any-pointer: coarse)');
    var fine = mqMatches('(any-pointer: fine)');
    var hover = mqMatches('(hover: hover)');
    return { touch: touch, coarse: coarse, fine: fine, hover: hover };
  }

  function getDeviceInfo() {
    var width = getViewportWidth();
    var height = window.innerHeight || document.documentElement.clientHeight || 0;
    var outerWidth = window.outerWidth || width;
    var userAgent = navigator.userAgent || '';
    var caps = detectCapabilities();
    var uaData = navigator.userAgentData || null;

    // ---- Capability hints (informational; the width check decides) ----
    var ua = userAgent.toLowerCase();
    var isMobileUA = /mobi|android|iphone|ipod|blackberry|iemobile|opera mini|windows phone/i.test(userAgent);
    var isTouchDevice = caps.touch || caps.coarse;
    var isCoarsePointer = caps.coarse;

    // ---- Classification (viewport width is authoritative) --------------
    var blocked = width < MIN_WIDTH;
    var classification;
    var reasons = [];

    if (isForcedDesktop()) {
      classification = 'desktop';
      reasons.push('Access forced via ' + FORCE_DESKTOP_PARAM + ' parameter');
    } else if (blocked) {
      classification = 'phone';
      reasons.push('Effective viewport width ' + width + 'px is below the ' + MIN_WIDTH + 'px minimum');
    } else if (isCoarsePointer) {
      classification = 'tablet';
      reasons.push('Viewport width ' + width + 'px is supported (touchscreen)');
    } else {
      classification = 'desktop';
      reasons.push('Viewport width ' + width + 'px is supported');
    }

    return {
      classification: classification,
      isPhone: blocked,
      isTablet: !blocked && isCoarsePointer,
      isDesktop: !blocked && !isCoarsePointer,

      isMobileClass: blocked,
      isTabletLike: !blocked && isCoarsePointer,

      width: width,
      height: height,
      outerWidth: outerWidth,
      userAgent: userAgent,
      platform: navigator.platform || '',
      maxTouchPoints: navigator.maxTouchPoints || (navigator.msMaxTouchPoints || 0),
      uaDataAvailable: !!uaData,
      isMobileUA: isMobileUA,
      isTouchDevice: isTouchDevice,
      isCoarsePointer: isCoarsePointer,
      isFinePointer: caps.fine,
      isHover: caps.hover,

      minWidth: MIN_WIDTH,
      recommendedWidth: RECOMMENDED_WIDTH,
      reasons: reasons,
      timestamp: Date.now()
    };
  }

  function rememberReturnUrl() {
    try {
      var returnUrl = window.location.pathname + window.location.search;
      // Sanitize: same-origin only, not the notice page itself
      if (returnUrl.indexOf(NOTICE_PATH) === -1 && returnUrl.indexOf('://') === -1) {
        sessionStorage.setItem(RETURN_KEY, returnUrl);
      }
    } catch (e) { /* sessionStorage unavailable — restriction screen falls back to home */ }
  }

  function forgetReturnUrl() {
    try {
      sessionStorage.removeItem(RETURN_KEY);
    } catch (e) { /* noop */ }
  }

  /**
   * Live guard: once a protected page passes the initial check, watch
   * resize/orientation changes so the restriction updates in real time —
   * if the viewport drops below the minimum, redirect to the restriction
   * screen immediately (the return URL is remembered for the way back).
   */
  var liveGuardInstalled = false;

  function installLiveGuard() {
    if (liveGuardInstalled) return;
    liveGuardInstalled = true;
    var timer = null;
    function recheck() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (getViewportWidth() < MIN_WIDTH) {
          rememberReturnUrl();
          window.location.replace(NOTICE_PATH);
        }
      }, 150);
    }
    window.addEventListener('resize', recheck);
    window.addEventListener('orientationchange', recheck);
  }

  function isAllowed() {
    if (isForcedDesktop()) return true;
    var allowed = getViewportWidth() >= MIN_WIDTH;
    if (allowed) {
      forgetReturnUrl();
      installLiveGuard();
    } else {
      rememberReturnUrl();
    }
    return allowed;
  }

  function DeviceGuard(options) {
    this.minWidth = MIN_WIDTH;
    this.onBlockedCallback = (options && options.onBlocked) || null;
    this.onAllowedCallback = (options && options.onAllowed) || null;
    this.resizeDebounceMs = (options && options.resizeDebounceMs) || 300;
    this.resizeTimer = null;
    this.portraitMQ = null;
    var self = this;
    this.boundHandleResize = function () { self.handleResize(); };
  }

  DeviceGuard.prototype.check = function () {
    var info = getDeviceInfo();
    var allowed = !info.isPhone;
    if (!allowed && this.onBlockedCallback) {
      this.onBlockedCallback(info);
    } else if (allowed && this.onAllowedCallback) {
      this.onAllowedCallback(info);
    }
    return allowed;
  };

  DeviceGuard.prototype.handleResize = function () {
    clearTimeout(this.resizeTimer);
    var self = this;
    this.resizeTimer = setTimeout(function () { self.check(); }, this.resizeDebounceMs);
  };

  DeviceGuard.prototype.start = function () {
    var self = this;
    window.addEventListener('resize', this.boundHandleResize);
    if (typeof window.matchMedia === 'function') {
      this.portraitMQ = window.matchMedia('(orientation: portrait)');
      if (this.portraitMQ && typeof this.portraitMQ.addEventListener === 'function') {
        this.portraitMQ.addEventListener('change', this.boundHandleResize);
      }
    }
    this.check();
  };

  DeviceGuard.prototype.stop = function () {
    window.removeEventListener('resize', this.boundHandleResize);
    if (this.portraitMQ && typeof this.portraitMQ.removeEventListener === 'function') {
      this.portraitMQ.removeEventListener('change', this.boundHandleResize);
    }
    clearTimeout(this.resizeTimer);
  };

  window.DeviceDetector = {
    MIN_WIDTH: MIN_WIDTH,
    RECOMMENDED_WIDTH: RECOMMENDED_WIDTH,
    FORCE_DESKTOP_PARAM: FORCE_DESKTOP_PARAM,
    RETURN_KEY: RETURN_KEY,
    NOTICE_PATH: NOTICE_PATH,
    getViewportWidth: getViewportWidth,
    getDeviceInfo: getDeviceInfo,
    isDesktopAllowed: isAllowed,
    rememberReturnUrl: rememberReturnUrl,
    forgetReturnUrl: forgetReturnUrl,
    DeviceGuard: DeviceGuard
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.DeviceDetector;
  }
})();