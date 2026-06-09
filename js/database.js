/**
 * Bluegrass Singles — Google Sheets API Client
 * Connects to a deployed Google Apps Script web app.
 */
const BluegrassDB = (() => {
  const FIELDS = [
    'artistName',
    'songTitle',
    'coverArt',
    'description',
    'duration',
    'releaseDate',
    'label',
    'writers',
    'musicians',
    'previewLink',
    'mp3DownloadLink',
    'wavDownloadLink',
    'generatedOneSheet',
    'submittedDate',
  ];

  function getScriptUrl() {
    const url = (CONFIG.googleScriptUrl || '').trim();
    if (!url || url.includes('YOUR_GOOGLE_APPS_SCRIPT_URL')) {
      throw new Error('NOT_CONFIGURED');
    }
    return url;
  }

  function buildUrl(params) {
    const url = new URL(getScriptUrl());
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  }

  async function apiGet(params) {
    const response = await fetch(buildUrl(params));
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Request failed');
    }
    return result;
  }

  async function apiPost(payload) {
    const response = await fetch(getScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Request failed');
    }
    return result;
  }

  async function addSingle(data) {
    const result = await apiPost({ action: 'add', data });
    return result.single;
  }

  async function getAllSingles() {
    const result = await apiGet({ action: 'list' });
    return result.singles || [];
  }

  async function getSingle(id) {
    const result = await apiGet({ action: 'get', id });
    return result.single;
  }

  async function deleteSingle(id) {
    await apiPost({ action: 'delete', id });
  }

  async function count() {
    const all = await getAllSingles();
    return all.length;
  }

  async function testConnection() {
    const result = await apiGet({ action: 'list' });
    return { ok: true, count: (result.singles || []).length };
  }

  function isConfigured() {
    try {
      getScriptUrl();
      return true;
    } catch {
      return false;
    }
  }

  return {
    DB_NAME: 'Bluegrass Singles',
    FIELDS,
    addSingle,
    getAllSingles,
    getSingle,
    deleteSingle,
    count,
    testConnection,
    isConfigured,
  };
})();