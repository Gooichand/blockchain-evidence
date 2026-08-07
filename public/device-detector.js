(function() {
  'use strict';

  /**
   * EVID-DGC Device Policy
   * ----------------------
   * ALLOWED:  Desktops, laptops (Windows / macOS / Linux / Chromebook),
   *           iPads, Android tablets, Surface tablets, large foldables in tablet mode.
   * BLOCKED:  Android phones, iPhones, small foldables in phone mode.
   *
   * No single heuristic decides:
   *   - User-Agent + platform signals
   *   - Positive tablet signatures (iPad / Android tablet tokens)
   *   - Interaction capability (maxTouchPoints / pointer media queries)
   *   - Layout geometry (compact = phone; tablets never lose on resize)
   */

  var MIN_WIDTH = 768;
  var RECOMMENDED_WIDTH = 1024;
  var FORCE_DESKTOP_PARAM = 'forceDesktop';

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
    var width = window.innerWidth || document.documentElement.clientWidth;
    var height = window.innerHeight || document.documentElement.clientHeight;
    var outerWidth = window.outerWidth || width;
    var userAgent = navigator.userAgent || '';
    var ua = userAgent.toLowerCase();
    var platform = navigator.platform || '';
    var caps = detectCapabilities();
    var uaData = navigator.userAgentData || null;

    // ---- Agent-level hints ---------------------------------------------------
    var isMobileUA =
      /mobi|android|iphone|ipod|blackberry|iemobile|opera mini|windows phone/i.test(userAgent);

    // Positive tablet signatures (never produced by phones on their own).
    var tabletTokens =
      /ipad|tablet|kindle|silk|playbook|nexus ?7|nexus ?9|sm-t|gt-p|konawith|hp-tablet/i;
    var isTabletToken = tabletTokens.test(userAgent);
    var isAndroidTabletToken =
      /android/i.test(userAgent) && !/mobile|phablet/i.test(userAgent);

    // iPadOS 13+ ships a desktop-looking UA ("Macintosh; Mac OS X"), but actual
    // iPads still expose touch capability and are identified by platform.
    var uaDataPlatform = (uaData && uaData.platform) || '';

    // iPhones / iPods are never tablets — block unconditionally.
    var isIPhoneOrPod =
      /iphone|ipod/i.test(userAgent) || /iphone|ipod/i.test(uaDataPlatform);

    // iPadOS 13+ ships a desktop-looking UA ("Macintosh; Mac OS X"), but actual
    // iPads still expose touch capability and are identified by platform + UA.
    var looksLikeIpad =
      !isIPhoneOrPod &&
      (/ipad/i.test(userAgent) ||
       /ipad/i.test(uaDataPlatform) ||
       (/macintosh|mac os x/i.test(userAgent) && caps.touch && caps.coarse));

    var isSurfaceWindowsTablet =
      /windows nt/i.test(userAgent) && /surface|tablet pc|windows nt.*(arm|touch)/i.test(userAgent);

    // Desktop OS token: laptops/desktops are never blocked by width alone.
    var isDesktopAgent =
      /windows nt|mac os x|crxos|crostini|x11|linux/.test(userAgent) &&
      !isTabletToken &&
      !looksLikeIpad &&
      !isSurfaceWindowsTablet;

    // ---- Geometry ------------------------------------------------------------
    // A compact layout only *confirms* a phone once the agent already says so.
    // "Tablet mode" requires BOTH dimensions to be large: an unfolded foldable
    // is wide AND tall, while a phone in landscape only grows its width.
    var isCompactViewport = Math.min(width, height) < 600;

    // ---- Classification (order matters) --------------------------------------
    var classification;
    var reasons = [];

    if (isIPhoneOrPod) {
      classification = 'phone';
      reasons.push('iPhone / iPod detected');
    } else if (isTabletToken || isAndroidTabletToken || looksLikeIpad || isSurfaceWindowsTablet) {
      classification = 'tablet';
      reasons.push('Tablet-form-factor device identified');
    } else if (isDesktopAgent) {
      classification = 'desktop';
      reasons.push('Desktop / laptop operating system identified');
    } else if (isMobileUA) {
      // Optimistic reassignmen: a large coarsely-touched screen with a mobile
      // agent is treated as a tablet (big Android tablets, expanded foldables).
      if ((caps.coarse || caps.touch) && !isCompactViewport) {
        classification = 'tablet';
        reasons.push('Large touchscreen in tablet mode');
      } else {
        classification = 'phone';
        reasons.push('Compact phone-sized device detected');
      }
    } else if (caps.touch && caps.coarse) {
      classification = isCompactViewport ? 'phone' : 'tablet';
    } else {
      classification = 'desktop';
    }

    var isPhone = classification === 'phone';
    var isTablet = classification === 'tablet';
    var isDesktop = classification === 'desktop';

    return {
      classification: classification,
      isPhone: isPhone,
      isTablet: isTablet,
      isDesktop: isDesktop,

      isMobileClass: isPhone || isTablet,
      isTabletLike: isTablet,

      width: width,
      height: height,
      outerWidth: outerWidth,
      userAgent: userAgent,
      platform: platform,
      maxTouchPoints: navigator.maxTouchPoints || (navigator.msMaxTouchPoints || 0),
      uaDataAvailable: !!uaData,
      isTouchDevice: caps.touch,
      isCoarsePointer: caps.coarse,
      isFinePointer: caps.fine,
      isHover: caps.hover,

      minWidth: MIN_WIDTH,
      recommendedWidth: RECOMMENDED_WIDTH,
      reasons: reasons,
      timestamp: Date.now()
    };
  }

  function isAllowed() {
    if (window.location.search.indexOf(FORCE_DESKTOP_PARAM + '=true') !== -1) {
      return true;
    }
    return getDeviceInfo().isPhone !== true;
  }

  function DeviceGuard(options) {
    this.minWidth = null; // desktops are never blocked by width
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
    var allowed = info.isPhone !== true;
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
    getDeviceInfo: getDeviceInfo,
    isDesktopAllowed: isAllowed,
    DeviceGuard: DeviceGuard
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.DeviceDetector;
  }
})();