/* Latest release card (Home). Falls back to a static link if the GitHub API is unreachable. */
(function () {
  var REPO = 'Gooichand/blockchain-evidence';
  var PAGE = 'https://github.com/' + REPO + '/releases';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render(el, tag, title, dateText, url) {
    el.innerHTML =
      '<div class="lr-card">' +
        '<div class="lr-info">' +
          '<div class="lr-kicker">Latest Release</div>' +
          '<h3 class="lr-title">' + esc(tag) + (title && title !== tag && !/^\d{4}-\d{2}-\d{2}$/.test(title) ? ' - ' + esc(title) : '') + '</h3>' +
          (dateText ? '<p class="lr-meta">Published ' + esc(dateText) + '</p>' : '<p class="lr-meta">See what changed in each version on GitHub.</p>') +
        '</div>' +
        '<a class="lr-link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
          '<i data-lucide="external-link"></i> View on GitHub</a>' +
      '</div>';
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }

  function init() {
    var el = document.getElementById('latest-release-container');
    if (!el) return;
    fetch('https://api.github.com/repos/' + REPO + '/releases/latest', { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        var date = d.published_at ? new Date(d.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        render(el, d.tag_name || 'Latest', d.name, date, d.html_url || PAGE);
      })
      .catch(function () {
        // graceful fallback: still give visitors the releases link
        render(el, 'Releases', '', '', PAGE);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
