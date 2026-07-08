(function() {
  'use strict';

  const MIN_WIDTH = 1024;
  const FORCE_DESKTOP_PARAM = 'forceDesktop';

  function getDeviceInfo() {
    const width = window.innerWidth || document.documentElement.clientWidth;
    const height = window.innerHeight || document.documentElement.clientHeight;
    const outerWidth = window.outerWidth || width;
    const userAgent = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    const isMobileUA = /Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTabletUA = /iPad|Tablet|Kindle|Silk/i.test(userAgent);
    const isMacIntel = /Macintosh.*Intel/i.test(userAgent);
    const isMacAppleSilicon = /Macintosh.*Apple/i.test(userAgent);

    const isTouchDevice = maxTouchPoints > 0 || 'ontouchstart' in window;
    const isTouchFirst = isTouchDevice && (isMobileUA || isTabletUA);

    const widthOk = outerWidth >= MIN_WIDTH;
    const uaOk = !isMobileUA && !isTabletUA;

    const reasons = [];
    if (!widthOk) reasons.push(`Viewport width ${outerWidth}px < ${MIN_WIDTH}px minimum`);
    if (isMobileUA) reasons.push('Mobile User Agent detected');
    if (isTabletUA) reasons.push('Tablet User Agent detected');

    const isDesktop = widthOk && uaOk;

    return {
      isDesktop,
      width,
      height,
      outerWidth,
      userAgent,
      platform,
      maxTouchPoints,
      isTouchDevice,
      isTouchFirst,
      isMobileUA,
      isTabletUA,
      isMacIntel,
      isMacAppleSilicon,
      minWidth: MIN_WIDTH,
      reasons,
      timestamp: Date.now()
    };
  }

  function isDesktopAllowed() {
    if (window.location.search.includes(FORCE_DESKTOP_PARAM + '=true')) {
      return true;
    }
    return getDeviceInfo().isDesktop;
  }

  class DesktopGuard {
    constructor(options = {}) {
      this.minWidth = options.minWidth || MIN_WIDTH;
      this.onBlockedCallback = options.onBlocked || null;
      this.onAllowedCallback = options.onAllowed || null;
      this.resizeDebounceMs = options.resizeDebounceMs || 300;
      this.resizeTimer = null;
      this.boundHandleResize = this.handleResize.bind(this);
    }

    check() {
      const info = getDeviceInfo();
      const allowed = info.isDesktop;

      if (!allowed && this.onBlockedCallback) {
        this.onBlockedCallback(info);
      } else if (allowed && this.onAllowedCallback) {
        this.onAllowedCallback(info);
      }

      return allowed;
    }

    handleResize() {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.check();
      }, this.resizeDebounceMs);
    }

    start() {
      window.addEventListener('resize', this.boundHandleResize);
      this.check();
    }

    stop() {
      window.removeEventListener('resize', this.boundHandleResize);
      clearTimeout(this.resizeTimer);
    }

    onBlocked(callback) {
      this.onBlockedCallback = callback;
    }

    onAllowed(callback) {
      this.onAllowedCallback = callback;
    }
  }

  window.DeviceDetector = {
    MIN_WIDTH,
    FORCE_DESKTOP_PARAM,
    getDeviceInfo,
    isDesktopAllowed,
    DesktopGuard
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.DeviceDetector;
  }
})();