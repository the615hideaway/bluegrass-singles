(function () {
  const loginGate = document.getElementById('login-gate');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');
  const keywordInput = document.getElementById('filter-keyword');
  const artistInput = document.getElementById('filter-artist');
  const songInput = document.getElementById('filter-song');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  const tableBody = document.getElementById('singles-tbody');
  const statTotal = document.getElementById('stat-total');
  const statMonth = document.getElementById('stat-month');
  const statSelected = document.getElementById('stat-selected');
  const detailModal = document.getElementById('detail-modal');
  const playlistModal = document.getElementById('playlist-modal');
  const modalClose = document.getElementById('modal-close');
  const playlistModalClose = document.getElementById('playlist-modal-close');
  const createPlaylistBtn = document.getElementById('create-playlist-btn');
  const selectAllCheckbox = document.getElementById('select-all');
  const connectionBanner = document.getElementById('connection-banner');

  let allSingles = [];
  let filteredSingles = [];
  const selectedIds = new Set();

  function isAuthenticated() {
    return sessionStorage.getItem(CONFIG.dashboardAuthKey) === 'true';
  }

  function showDashboard() {
    loginGate.classList.add('hidden');
    dashboard.classList.remove('hidden');
    checkConnection();
    loadSingles();
  }

  function showLogin() {
    loginGate.classList.remove('hidden');
    dashboard.classList.add('hidden');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function renderCover(coverArt) {
    if (coverArt) {
      return `<img src="${escapeHtml(coverArt)}" alt="Cover" onerror="this.parentElement.innerHTML='<div class=\\'cover-placeholder\\'><i class=\\'fa-solid fa-music\\'></i></div>'">`;
    }
    return `<div class="cover-placeholder"><i class="fa-solid fa-music"></i></div>`;
  }

  function renderLink(url, label, icon) {
    if (!url) return '';
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="link-btn"><i class="fa-solid fa-${icon}"></i> ${label}</a>`;
  }

  function renderPreviewPlayer(url) {
    if (!url) return '<span class="no-link">No preview</span>';
    return `<audio class="audio-preview" controls preload="none" src="${escapeHtml(url)}"></audio>`;
  }

  function renderDownloadBtn(url, label) {
    if (!url) return `<span class="no-link">${label} unavailable</span>`;
    return `<a href="${escapeHtml(url)}" download target="_blank" rel="noopener" class="btn-download"><i class="fa-solid fa-download"></i> ${label}</a>`;
  }

  function renderDownloads(single) {
    return `<div class="downloads-cell">
      ${renderDownloadBtn(single.mp3DownloadLink, 'MP3')}
      ${renderDownloadBtn(single.wavDownloadLink, 'WAV')}
    </div>`;
  }

  function updateSelectionUI() {
    const count = selectedIds.size;
    statSelected.textContent = count;
    createPlaylistBtn.disabled = count === 0;
    createPlaylistBtn.innerHTML = count
      ? `<i class="fa-solid fa-list-ul"></i> Create Playlist (${count})`
      : `<i class="fa-solid fa-list-ul"></i> Create Playlist`;

    const visibleIds = filteredSingles.map((s) => String(s.id));
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));
    selectAllCheckbox.checked = allVisibleSelected;
    selectAllCheckbox.indeterminate = someVisibleSelected && !allVisibleSelected;
  }

  function renderTable(singles) {
    filteredSingles = singles;

    if (!singles.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10">
            <div class="empty-state">
              <i class="fa-solid fa-compact-disc"></i>
              <p>No singles match your filters.</p>
            </div>
          </td>
        </tr>`;
      updateSelectionUI();
      return;
    }

    tableBody.innerHTML = singles
      .map(
        (s) => `
      <tr data-id="${escapeHtml(String(s.id))}">
        <td class="checkbox-cell">
          <input type="checkbox" class="row-checkbox" data-id="${escapeHtml(String(s.id))}" ${selectedIds.has(String(s.id)) ? 'checked' : ''} aria-label="Select ${escapeHtml(s.songTitle)}">
        </td>
        <td class="cover-cell">${renderCover(s.coverArt)}</td>
        <td class="artist-cell">
          <strong>${escapeHtml(s.artistName)}</strong>
          <span>${escapeHtml(s.label || 'Independent')}</span>
        </td>
        <td>${escapeHtml(s.songTitle)}</td>
        <td>${escapeHtml(s.duration || '—')}</td>
        <td>${formatDate(s.releaseDate)}</td>
        <td>${formatDate(s.submittedDate)}</td>
        <td class="preview-cell">${renderPreviewPlayer(s.previewLink)}</td>
        <td>${renderDownloads(s)}</td>
        <td>
          <button class="btn btn-secondary btn-sm view-btn" data-id="${escapeHtml(String(s.id))}">
            <i class="fa-solid fa-eye"></i> View
          </button>
          <button class="btn btn-danger btn-sm delete-btn btn-spaced" data-id="${escapeHtml(String(s.id))}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>`
      )
      .join('');

    document.querySelectorAll('.row-checkbox').forEach((cb) => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.id;
        if (cb.checked) selectedIds.add(id);
        else selectedIds.delete(id);
        updateSelectionUI();
      });
    });

    document.querySelectorAll('.view-btn').forEach((btn) => {
      btn.addEventListener('click', () => openDetail(btn.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => deleteRecord(btn.dataset.id));
    });

    updateSelectionUI();
  }

  function updateStats(singles) {
    statTotal.textContent = singles.length;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = singles.filter((s) => {
      const d = new Date(s.submittedDate + 'T00:00:00');
      return d >= monthStart;
    });
    statMonth.textContent = thisMonth.length;
  }

  function filterSingles() {
    const keyword = keywordInput.value.trim().toLowerCase();
    const artist = artistInput.value.trim().toLowerCase();
    const song = songInput.value.trim().toLowerCase();

    const filtered = allSingles.filter((s) => {
      const matchesArtist = !artist || s.artistName.toLowerCase().includes(artist);
      const matchesSong = !song || s.songTitle.toLowerCase().includes(song);
      const matchesKeyword = !keyword || [
        s.artistName,
        s.songTitle,
        s.label,
        s.writers,
        s.musicians,
        s.description,
        s.label,
      ].some((field) => field && field.toLowerCase().includes(keyword));

      return matchesArtist && matchesSong && matchesKeyword;
    });

    renderTable(filtered);
  }

  function clearFilters() {
    keywordInput.value = '';
    artistInput.value = '';
    songInput.value = '';
    filterSingles();
  }

  async function checkConnection() {
    if (!BluegrassDB.isConfigured()) {
      connectionBanner.className = 'connection-banner error';
      connectionBanner.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>
          <strong>Google Sheets not connected.</strong>
          Paste your Apps Script URL into <code>js/config.js</code>. See <code>SETUP-INSTRUCTIONS.txt</code> in the project folder.
        </div>`;
      connectionBanner.classList.remove('hidden');
      return;
    }

    try {
      await BluegrassDB.testConnection();
      connectionBanner.className = 'connection-banner success';
      connectionBanner.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <div><strong>Connected to Google Sheets</strong> — Bluegrass Singles database</div>`;
      connectionBanner.classList.remove('hidden');
    } catch (err) {
      connectionBanner.className = 'connection-banner error';
      connectionBanner.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>
          <strong>Connection failed.</strong> ${escapeHtml(err.message)}. Check your URL in <code>js/config.js</code>. See <code>SETUP-INSTRUCTIONS.txt</code>.
        </div>`;
      connectionBanner.classList.remove('hidden');
    }
  }

  async function loadSingles() {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10">
          <div class="empty-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Loading submissions…</p>
          </div>
        </td>
      </tr>`;

    if (!BluegrassDB.isConfigured()) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10">
            <div class="empty-state">
              <i class="fa-solid fa-plug-circle-xmark"></i>
              <p>Connect Google Sheets to load submissions. See SETUP-INSTRUCTIONS.txt in the project folder.</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    try {
      allSingles = await BluegrassDB.getAllSingles();
      updateStats(allSingles);
      filterSingles();
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `
        <tr>
          <td colspan="10">
            <div class="empty-state">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <p>Failed to load submissions: ${escapeHtml(err.message)}</p>
            </div>
          </td>
        </tr>`;
    }
  }

  function openDetail(id) {
    const single = allSingles.find((s) => String(s.id) === String(id));
    if (!single) return;

    const body = document.getElementById('modal-body');
    body.innerHTML = `
      ${single.coverArt ? `<img class="modal-cover" src="${escapeHtml(single.coverArt)}" alt="Cover art">` : ''}
      <div class="detail-grid">
        <div class="detail-item">
          <label>Artist Name</label>
          <p>${escapeHtml(single.artistName)}</p>
        </div>
        <div class="detail-item">
          <label>Song Title</label>
          <p>${escapeHtml(single.songTitle)}</p>
        </div>
        <div class="detail-item">
          <label>Duration</label>
          <p>${escapeHtml(single.duration || '—')}</p>
        </div>
        <div class="detail-item">
          <label>Release Date</label>
          <p>${formatDate(single.releaseDate)}</p>
        </div>
        <div class="detail-item">
          <label>Label</label>
          <p>${escapeHtml(single.label || '—')}</p>
        </div>
        <div class="detail-item">
          <label>Writers</label>
          <p>${escapeHtml(single.writers || '—')}</p>
        </div>
        <div class="detail-item full">
          <label>Description</label>
          <p>${escapeHtml(single.description || '—')}</p>
        </div>
        <div class="detail-item full">
          <label>Musicians</label>
          <p>${escapeHtml(single.musicians || '—')}</p>
        </div>
        <div class="detail-item">
          <label>Submitted Date</label>
          <p>${formatDate(single.submittedDate)}</p>
        </div>
      </div>
      <div class="modal-audio">
        <label>Preview</label>
        ${renderPreviewPlayer(single.previewLink)}
      </div>
      <div class="modal-links">
        ${renderDownloadBtn(single.mp3DownloadLink, 'Download MP3')}
        ${renderDownloadBtn(single.wavDownloadLink, 'Download WAV')}
        ${renderLink(single.generatedOneSheet, 'One Sheet', 'file-pdf')}
      </div>
    `;

    detailModal.classList.add('open');
  }

  function openPlaylist() {
    const selected = allSingles.filter((s) => selectedIds.has(String(s.id)));
    const body = document.getElementById('playlist-body');

    if (!selected.length) return;

    body.innerHTML = selected
      .map(
        (s, i) => `
      <div class="playlist-item">
        <div class="playlist-item-header">
          <span class="playlist-number">${i + 1}</span>
          <div class="playlist-cover">${renderCover(s.coverArt)}</div>
          <div class="playlist-meta">
            <strong>${escapeHtml(s.artistName)}</strong>
            <span>${escapeHtml(s.songTitle)}</span>
            ${s.duration ? `<span class="playlist-duration">${escapeHtml(s.duration)}</span>` : ''}
          </div>
        </div>
        <div class="playlist-preview">
          ${renderPreviewPlayer(s.previewLink)}
        </div>
        <div class="playlist-links">
          ${renderDownloadBtn(s.mp3DownloadLink, 'Download MP3')}
          ${renderDownloadBtn(s.wavDownloadLink, 'Download WAV')}
          ${renderLink(s.generatedOneSheet, 'One Sheet PDF', 'file-pdf') || '<span class="no-link">No one sheet yet</span>'}
        </div>
      </div>`
      )
      .join('');

    playlistModal.classList.add('open');
  }

  async function deleteRecord(id) {
    const single = allSingles.find((s) => String(s.id) === String(id));
    if (!single) return;

    const confirmed = confirm(
      `Delete "${single.songTitle}" by ${single.artistName}? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await BluegrassDB.deleteSingle(id);
      selectedIds.delete(String(id));
      await loadSingles();
    } catch (err) {
      console.error(err);
      alert('Failed to delete record: ' + err.message);
    }
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;

    if (password === CONFIG.dashboardPassword) {
      sessionStorage.setItem(CONFIG.dashboardAuthKey, 'true');
      loginError.classList.remove('show');
      showDashboard();
    } else {
      loginError.classList.add('show');
    }
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem(CONFIG.dashboardAuthKey);
    document.getElementById('password').value = '';
    selectedIds.clear();
    showLogin();
  });

  keywordInput.addEventListener('input', filterSingles);
  artistInput.addEventListener('input', filterSingles);
  songInput.addEventListener('input', filterSingles);
  clearFiltersBtn.addEventListener('click', clearFilters);

  selectAllCheckbox.addEventListener('change', () => {
    filteredSingles.forEach((s) => {
      const id = String(s.id);
      if (selectAllCheckbox.checked) selectedIds.add(id);
      else selectedIds.delete(id);
    });
    filterSingles();
  });

  createPlaylistBtn.addEventListener('click', openPlaylist);

  modalClose.addEventListener('click', () => detailModal.classList.remove('open'));
  playlistModalClose.addEventListener('click', () => playlistModal.classList.remove('open'));

  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) detailModal.classList.remove('open');
  });

  playlistModal.addEventListener('click', (e) => {
    if (e.target === playlistModal) playlistModal.classList.remove('open');
  });

  if (isAuthenticated()) {
    showDashboard();
  } else {
    showLogin();
  }
})();