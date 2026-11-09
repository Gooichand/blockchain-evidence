/**
 * Notification bell (roadmap S8).
 *
 * Injects a bell into the unified navbar on every dashboard page. Works for
 * both wallet-login and email-login users: the notification owner key is the
 * stable user id (wallet address or `user_<id>`), matching the server-side
 * keying. Polls the unread count every 60 seconds and lists the latest
 * notifications in a dropdown with mark-read support.
 */
(function () {
  const POLL_MS = 60000;
  let bellReady = false;
  let dropdownOpen = false;

  function stableUserKey() {
    try {
      const current = localStorage.getItem('currentUser');
      if (!current) return null;
      const userData = JSON.parse(localStorage.getItem('evidUser_' + current) || '{}');
      const wallet = userData.wallet_address || userData.walletAddress;
      // Only a real wallet address is a wallet key - email sessions often store
      // the email in the wallet field. Those users key on `user_<id>`.
      if (/^0x[a-fA-F0-9]{40}$/.test(wallet || '')) return wallet;
      if (userData.id) return 'user_' + userData.id;
      // Some sessions store the key itself (already wallet or user_<id>)
      if (/^(0x[a-fA-F0-9]{40}|user_\d+)$/.test(current)) return current;
      return null;
    } catch (e) {
      return null;
    }
  }

  function authHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  function injectStyles() {
    if (document.getElementById('notifBellStyles')) return;
    const style = document.createElement('style');
    style.id = 'notifBellStyles';
    style.textContent = `
      .notif-bell-wrap { position: relative; display: inline-flex; }
      .notif-bell-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; color: inherit; position: relative; display: inline-flex; align-items: center; }
      .notif-bell-btn:hover { background: rgba(185, 28, 28, 0.08); }
      .notif-bell-badge { position: absolute; top: 0; right: 0; background: #b91c1c; color: #fff; font-size: 10px; font-weight: 700; min-width: 16px; height: 16px; border-radius: 8px; display: none; align-items: center; justify-content: center; padding: 0 4px; }
      .notif-dropdown { position: absolute; right: 0; top: calc(100% + 8px); width: 340px; max-height: 420px; overflow-y: auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.14); z-index: 3000; display: none; }
      .notif-dropdown.open { display: block; }
      .notif-dropdown-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #f3f4f6; font-weight: 600; font-size: 14px; }
      .notif-dropdown-header button { background: none; border: none; color: #b91c1c; font-size: 12px; cursor: pointer; font-weight: 600; }
      .notif-item { padding: 10px 14px; border-bottom: 1px solid #f9fafb; cursor: pointer; }
      .notif-item:hover { background: #fafafa; }
      .notif-item.unread { background: #fef2f2; }
      .notif-item.unread:hover { background: #fee2e2; }
      .notif-item .t { font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 2px; }
      .notif-item .m { font-size: 12px; color: #4b5563; line-height: 1.4; }
      .notif-item .d { font-size: 11px; color: #9ca3af; margin-top: 3px; }
      .notif-empty { padding: 24px 14px; text-align: center; color: #9ca3af; font-size: 13px; }
    `;
    document.head.appendChild(style);
  }

  function buildBell() {
    const right = document.querySelector('.navbar-right');
    if (!right || document.getElementById('notifBellWrap')) return !!document.getElementById('notifBellWrap');
    const wrap = document.createElement('div');
    wrap.className = 'notif-bell-wrap';
    wrap.id = 'notifBellWrap';
    wrap.innerHTML = `
      <button class="notif-bell-btn" id="notifBellBtn" aria-label="Notifications" title="Notifications">
        <i data-lucide="bell"></i>
        <span class="notif-bell-badge" id="notifBadge"></span>
      </button>
      <div class="notif-dropdown" id="notifDropdown">
        <div class="notif-dropdown-header">
          <span>Notifications</span>
          <button id="notifMarkAll">Mark all read</button>
        </div>
        <div id="notifList"><div class="notif-empty">Loading...</div></div>
      </div>`;
    right.insertBefore(wrap, right.firstChild);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    document.getElementById('notifBellBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownOpen = !dropdownOpen;
      document.getElementById('notifDropdown').classList.toggle('open', dropdownOpen);
      if (dropdownOpen) loadNotifications();
    });
    document.addEventListener('click', (e) => {
      if (dropdownOpen && !wrap.contains(e.target)) {
        dropdownOpen = false;
        document.getElementById('notifDropdown').classList.remove('open');
      }
    });
    document.getElementById('notifMarkAll').addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await fetch('/api/notifications/read-all', { method: 'PUT', headers: authHeaders() });
        loadNotifications();
      } catch (err) { /* ignore */ }
    });
    return true;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  async function loadNotifications() {
    const key = stableUserKey();
    if (!key) return;
    try {
      const r = await fetch('/api/notifications/' + encodeURIComponent(key) + '?limit=15', { headers: authHeaders() });
      if (!r.ok) return;
      const d = await r.json();
      renderList(d.notifications || []);
      updateBadge(d.unreadCount || 0);
    } catch (e) { /* network hiccup - keep last state */ }
  }

  async function pollBadge() {
    const key = stableUserKey();
    if (!key) return;
    try {
      const r = await fetch('/api/notifications/' + encodeURIComponent(key) + '?limit=1', { headers: authHeaders() });
      if (!r.ok) return;
      const d = await r.json();
      updateBadge(d.unreadCount || 0);
    } catch (e) { /* ignore */ }
  }

  function updateBadge(count) {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
    badge.textContent = count > 99 ? '99+' : String(count);
  }

  function renderList(items) {
    const list = document.getElementById('notifList');
    if (!list) return;
    if (!items.length) {
      list.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
      return;
    }
    list.innerHTML = items.map((n) => `
      <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
        <div class="t">${esc(n.title)}</div>
        <div class="m">${esc(n.message)}</div>
        <div class="d">${n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
      </div>`).join('');
    list.querySelectorAll('.notif-item.unread').forEach((el) => {
      el.addEventListener('click', async () => {
        try {
          await fetch('/api/notifications/' + el.dataset.id + '/read', { method: 'PUT', headers: authHeaders() });
          loadNotifications();
        } catch (e) { /* ignore */ }
      });
    });
  }

  function init() {
    injectStyles();
    // The fixed navbar renders asynchronously; wait for it, then mount once.
    const tryBuild = () => {
      if (bellReady) return;
      bellReady = buildBell();
      if (bellReady) {
        pollBadge();
        setInterval(pollBadge, POLL_MS);
      }
    };
    tryBuild();
    const observer = new MutationObserver(() => tryBuild());
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
