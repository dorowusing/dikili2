/**
 * DIKILI - Mobile-First Web Application for Historical Gorontalo Manuscript (Naskah D)
 * Core Application Engine
 */

(function () {
  'use strict';

  // Application State
  const state = {
    data: null,
    currentSair: 1,
    theme: localStorage.getItem('dikili_theme') || 'parchment',
    fontSizeArabic: parseInt(localStorage.getItem('dikili_fs_ar') || '24', 10),
    fontSizeLatin: parseInt(localStorage.getItem('dikili_fs_la') || '15', 10),
    visibility: {
      arabic: localStorage.getItem('dikili_vis_ar') !== 'false',
      latin: localStorage.getItem('dikili_vis_la') !== 'false',
      translation: localStorage.getItem('dikili_vis_tr') !== 'false',
      gorontalo: localStorage.getItem('dikili_vis_gor') !== 'false'
    },
    bookmarks: JSON.parse(localStorage.getItem('dikili_bookmarks') || '[]')
  };

  // DOM Elements Cache
  const elements = {
    appContainer: document.getElementById('appContainer'),
    unitsContainer: document.getElementById('unitsContainer'),
    sairSelectorPill: document.getElementById('sairSelectorPill'),
    sairTitlePill: document.getElementById('sairTitlePill'),
    sairBadgePill: document.getElementById('sairBadgePill'),
    sairHeroNumber: document.getElementById('sairHeroNumber'),
    sairHeroTitle: document.getElementById('sairHeroTitle'),
    sairHeroPages: document.getElementById('sairHeroPages'),
    sairHeroTheme: document.getElementById('sairHeroTheme'),
    progressBarFill: document.getElementById('progressBarFill'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    
    // Modals
    sairListSheet: document.getElementById('sairListSheet'),
    sairSheetItems: document.getElementById('sairSheetItems'),
    searchSheet: document.getElementById('searchSheet'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    bookmarksSheet: document.getElementById('bookmarksSheet'),
    bookmarkItems: document.getElementById('bookmarkItems'),
    infoSheet: document.getElementById('infoSheet'),
    
    // Toast
    toast: document.getElementById('toastMsg')
  };

  // Toast Helper
  let toastTimer = null;
  function showToast(msg) {
    if (!elements.toast) return;
    elements.toast.textContent = msg;
    elements.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 2200);
  }

  // Refresh DOM Elements Cache
  function refreshElementRefs() {
    elements.appContainer = document.getElementById('appContainer');
    elements.unitsContainer = document.getElementById('unitsContainer');
    elements.sairSelectorPill = document.getElementById('sairSelectorPill');
    elements.sairTitlePill = document.getElementById('sairTitlePill');
    elements.sairBadgePill = document.getElementById('sairBadgePill');
    elements.sairHeroNumber = document.getElementById('sairHeroNumber');
    elements.sairHeroTitle = document.getElementById('sairHeroTitle');
    elements.sairHeroPages = document.getElementById('sairHeroPages');
    elements.sairHeroTheme = document.getElementById('sairHeroTheme');
    elements.progressBarFill = document.getElementById('progressBarFill');
    elements.prevBtn = document.getElementById('prevBtn');
    elements.nextBtn = document.getElementById('nextBtn');
    
    // Modals
    elements.sairListSheet = document.getElementById('sairListSheet');
    elements.sairSheetItems = document.getElementById('sairSheetItems');
    elements.searchSheet = document.getElementById('searchSheet');
    elements.searchInput = document.getElementById('searchInput');
    elements.searchResults = document.getElementById('searchResults');
    elements.bookmarksSheet = document.getElementById('bookmarksSheet');
    elements.bookmarkItems = document.getElementById('bookmarkItems');
    elements.infoSheet = document.getElementById('infoSheet');
    
    // Toast
    elements.toast = document.getElementById('toastMsg');
  }

  // Initialize App
  async function init() {
    refreshElementRefs();

    // 1. Apply Theme
    applyTheme(state.theme);

    // 2. Apply Visibility & Font Sizes
    updateDisplaySettings();

    // 3. Load Data
    if (window.DIKILI_DATA) {
      state.data = window.DIKILI_DATA;
      onDataLoaded();
    } else {
      try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Network error');
        state.data = await response.json();
        onDataLoaded();
      } catch (err) {
        console.error('Failed to load Dikili data:', err);
        showToast('Gagal memuat data naskah. Pastikan berkas data.json tersedia.');
      }
    }
  }

  function onDataLoaded() {
    // Load last read Sair from localStorage if exists
    const lastRead = parseInt(localStorage.getItem('dikili_last_sair') || '1', 10);
    if (lastRead >= 1 && lastRead <= 17) {
      state.currentSair = lastRead;
    }
    
    buildSairDrawerList();
    renderSair(state.currentSair);
    setupEventListeners();
  }

  // Apply Theme
  function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem('dikili_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  function cycleTheme() {
    const themes = ['parchment', 'dark', 'light'];
    const nextIdx = (themes.indexOf(state.theme) + 1) % themes.length;
    applyTheme(themes[nextIdx]);
    const names = { parchment: 'Naskah Kuno (Parchment)', dark: 'Mode Gelap (Malam)', light: 'Mode Terang (Putih)' };
    showToast(`Tema: ${names[themes[nextIdx]]}`);
  }

  // Update Font Sizes and Visibility
  function updateDisplaySettings() {
    document.documentElement.style.setProperty('--arabic-size', `${state.fontSizeArabic}px`);
    document.documentElement.style.setProperty('--latin-size', `${state.fontSizeLatin}px`);

    const container = elements.appContainer;
    container.classList.toggle('hide-arabic', !state.visibility.arabic);
    container.classList.toggle('hide-latin', !state.visibility.latin);
    container.classList.toggle('hide-translation', !state.visibility.translation);
    container.classList.toggle('hide-gorontalo', !state.visibility.gorontalo);

    // Update chips state
    document.querySelectorAll('.toggle-chip[data-toggle]').forEach(chip => {
      const key = chip.getAttribute('data-toggle');
      chip.classList.toggle('active', !!state.visibility[key]);
    });
  }

  function adjustFontSize(delta) {
    state.fontSizeArabic = Math.max(18, Math.min(38, state.fontSizeArabic + delta * 2));
    state.fontSizeLatin = Math.max(12, Math.min(22, state.fontSizeLatin + delta));
    localStorage.setItem('dikili_fs_ar', state.fontSizeArabic);
    localStorage.setItem('dikili_fs_la', state.fontSizeLatin);
    updateDisplaySettings();
    showToast(`Ukuran Huruf: Arab ${state.fontSizeArabic}px / Latin ${state.fontSizeLatin}px`);
  }

  function toggleVisibilityKey(key) {
    state.visibility[key] = !state.visibility[key];
    localStorage.setItem(`dikili_vis_${key.substr(0, 3)}`, state.visibility[key]);
    updateDisplaySettings();
  }

  // Render Sair List Drawer
  function buildSairDrawerList() {
    if (!state.data || !elements.sairSheetItems) return;
    elements.sairSheetItems.innerHTML = '';
    
    state.data.sairs.forEach(s => {
      const item = document.createElement('div');
      item.className = `sair-sheet-item ${s.sair_number === state.currentSair ? 'active' : ''}`;
      item.setAttribute('data-sair', s.sair_number);
      
      const hasGor = s.gorontalo_sections_recorded > 0 ? ' • Bahasa Gorontalo' : '';
      
      item.innerHTML = `
        <div class="sair-sheet-left">
          <div class="sair-sheet-num">${s.sair_number}</div>
          <div class="sair-sheet-info">
            <div class="sair-sheet-name">${s.sair_title} (${s.sair_letter})</div>
            <div class="sair-sheet-snippet">Hlm ${s.pdf_pages[0]}–${s.pdf_pages[1]} • ${s.jabu_recorded} Jābu${hasGor}</div>
          </div>
        </div>
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${s.total_units || (s.units ? s.units.length : 0)} unit</div>
      `;
      
      item.addEventListener('click', () => {
        switchSair(s.sair_number);
        closeAllModals();
      });
      
      elements.sairSheetItems.appendChild(item);
    });
  }

  // Switch Sair
  function switchSair(num) {
    if (num < 1 || num > 17) return;
    state.currentSair = num;
    localStorage.setItem('dikili_last_sair', num);
    renderSair(num);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update drawer active states
    document.querySelectorAll('.sair-sheet-item').forEach(el => {
      const sNum = parseInt(el.getAttribute('data-sair'), 10);
      el.classList.toggle('active', sNum === num);
    });
  }

  // Render Current Sair
  function renderSair(num) {
    if (!state.data) return;
    const sair = state.data.sairs.find(s => s.sair_number === num);
    if (!sair) return;

    // Header updates
    elements.sairTitlePill.textContent = `${sair.sair_title} (${sair.sair_letter})`;
    elements.sairBadgePill.textContent = `Sair ${sair.sair_number} / 17`;
    
    elements.sairHeroNumber.textContent = `BAB ${sair.sair_number} (${sair.sair_letter.toUpperCase()})`;
    elements.sairHeroTitle.textContent = sair.sair_title;
    elements.sairHeroPages.textContent = `Naskah D: Hlm. Dokumen ${sair.doc_pages[0]}–${sair.doc_pages[1]} (PDF Hlm. ${sair.pdf_pages[0]}–${sair.pdf_pages[1]}) • ${sair.jabu_recorded} Jābu`;
    elements.sairHeroTheme.textContent = sair.theme_summary;

    // Progress bar
    const progressPct = ((num) / 17) * 100;
    elements.progressBarFill.style.width = `${progressPct}%`;

    // Pager buttons state
    elements.prevBtn.disabled = (num === 1);
    elements.nextBtn.disabled = (num === 17);

    // Render Unit Cards
    renderUnitCards(sair.units);
  }

  // Render Cards
  function renderUnitCards(units) {
    elements.unitsContainer.innerHTML = '';

    units.forEach((u, idx) => {
      // Determine unit badge and card style
      let tagClass = 'tag-puisi';
      let tagLabel = 'Bait Sair';
      let cardClass = '';

      if (u.unit_type === 'header_dan_pembuka') {
        tagClass = 'tag-puisi';
        tagLabel = 'Pembuka Sair';
      } else if (u.unit_type === 'jabu_refrein') {
        tagClass = 'tag-jabu';
        tagLabel = '✨ Jābu (Refrein Zikir)';
        cardClass = 'is-jabu';
      } else if (u.unit_type === 'prosa_hikayat_gorontalo') {
        tagClass = 'tag-gorontalo';
        tagLabel = '🌿 Teks Bahasa Gorontalo (Pegon)';
        cardClass = 'is-gorontalo';
      } else if (u.unit_type === 'catatan_filologis') {
        tagClass = 'tag-puisi';
        tagLabel = 'Catatan Filologis';
      }

      const isBookmarked = state.bookmarks.includes(u.unit_id);

      const card = document.createElement('div');
      card.className = `unit-card ${cardClass}`;
      card.id = `unit-${u.unit_id}`;

      let cardHtml = `
        <div class="unit-header">
          <span class="unit-tag ${tagClass}">${tagLabel}</span>
          <div class="unit-actions">
            <span style="font-size: 11px; color: var(--text-muted); margin-right: 6px;">#${u.unit_order}</span>
            <button class="btn-unit-action ${isBookmarked ? 'active' : ''}" data-action="bookmark" data-id="${u.unit_id}" title="Simpan Penanda">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            <button class="btn-unit-action" data-action="copy" data-id="${u.unit_id}" title="Salin Teks">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
      `;

      if (u.text_arabic) {
        cardHtml += `<div class="unit-arabic">${escapeHtml(u.text_arabic)}</div>`;
      }

      if (u.transliteration_latin) {
        cardHtml += `<div class="unit-latin">${escapeHtml(u.transliteration_latin)}</div>`;
      }

      if (u.translation_indonesian && u.translation_indonesian !== u.transliteration_latin) {
        cardHtml += `<div class="unit-translation">${escapeHtml(u.translation_indonesian)}</div>`;
      }

      if (u.text_gorontalo) {
        cardHtml += `
          <div class="unit-gorontalo-box">
            <div class="gorontalo-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
              Transkripsi Bahasa Gorontalo Klasik:
            </div>
            <div class="gorontalo-text">${escapeHtml(u.text_gorontalo)}</div>
          </div>
        `;
      }

      if (u.apparatus_notes) {
        cardHtml += `<div class="unit-note-box">${escapeHtml(u.apparatus_notes)}</div>`;
      }

      card.innerHTML = cardHtml;

      // Event listener for bookmark and copy
      card.querySelectorAll('.btn-unit-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.getAttribute('data-action');
          const id = btn.getAttribute('data-id');
          if (action === 'bookmark') {
            toggleBookmark(id);
          } else if (action === 'copy') {
            copyUnitText(u);
          }
        });
      });

      elements.unitsContainer.appendChild(card);
    });
  }

  // Bookmark Toggle
  function toggleBookmark(unitId) {
    const idx = state.bookmarks.indexOf(unitId);
    if (idx > -1) {
      state.bookmarks.splice(idx, 1);
      showToast('Penanda dihapus');
    } else {
      state.bookmarks.push(unitId);
      showToast('Ditambahkan ke Penanda');
    }
    localStorage.setItem('dikili_bookmarks', JSON.stringify(state.bookmarks));
    
    // Update active state in current cards
    const btn = document.querySelector(`.unit-card [data-id="${unitId}"][data-action="bookmark"]`);
    if (btn) {
      const isMarked = state.bookmarks.includes(unitId);
      btn.classList.toggle('active', isMarked);
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', isMarked ? 'currentColor' : 'none');
    }

    renderBookmarksList();
  }

  // Copy Unit Text
  function copyUnitText(u) {
    let textToCopy = '';
    if (u.text_arabic) textToCopy += `${u.text_arabic}\n\n`;
    if (u.transliteration_latin) textToCopy += `${u.transliteration_latin}\n\n`;
    if (u.translation_indonesian) textToCopy += `Terjemahan: ${u.translation_indonesian}\n\n`;
    if (u.text_gorontalo) textToCopy += `Gorontalo: ${u.text_gorontalo}\n\n`;
    textToCopy += `— Naskah D Dikili Gorontalo (${u.unit_id})`;

    navigator.clipboard.writeText(textToCopy.trim()).then(() => {
      showToast('Teks berhasil disalin ke clipboard');
    }).catch(() => {
      showToast('Gagal menyalin teks');
    });
  }

  // Search Engine
  function performSearch(query) {
    if (!state.data || !query || query.trim().length < 2) {
      elements.searchResults.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px;">Ketik kata kunci untuk mencari...</div>';
      return;
    }

    const q = query.toLowerCase().trim();
    const results = [];

    state.data.sairs.forEach(s => {
      s.units.forEach(u => {
        const inArabic = (u.text_arabic || '').toLowerCase().includes(q);
        const inLatin = (u.transliteration_latin || '').toLowerCase().includes(q);
        const inTrans = (u.translation_indonesian || '').toLowerCase().includes(q);
        const inGor = (u.text_gorontalo || '').toLowerCase().includes(q);

        if (inArabic || inLatin || inTrans || inGor) {
          results.push({ sair: s, unit: u });
        }
      });
    });

    elements.searchResults.innerHTML = '';
    if (results.length === 0) {
      elements.searchResults.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px;">Tidak ditemukan hasil untuk "${escapeHtml(query)}"</div>`;
      return;
    }

    results.slice(0, 50).forEach(res => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      
      let snippet = res.unit.transliteration_latin || res.unit.translation_indonesian || res.unit.text_gorontalo || res.unit.text_arabic || '';
      if (snippet.length > 130) snippet = snippet.substr(0, 130) + '...';

      item.innerHTML = `
        <div class="result-meta">
          <span>${res.sair.sair_title} (${res.sair.sair_letter.toUpperCase()})</span>
          <span>${res.unit.unit_id}</span>
        </div>
        <div class="result-text">${escapeHtml(snippet)}</div>
      `;

      item.addEventListener('click', () => {
        closeAllModals();
        switchSair(res.sair.sair_number);
        setTimeout(() => {
          const target = document.getElementById(`unit-${res.unit.unit_id}`);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.style.borderColor = 'var(--accent-gold)';
            setTimeout(() => { target.style.borderColor = ''; }, 2500);
          }
        }, 300);
      });

      elements.searchResults.appendChild(item);
    });
  }

  // Bookmarks List
  function renderBookmarksList() {
    if (!state.data || !elements.bookmarkItems) return;
    elements.bookmarkItems.innerHTML = '';

    if (state.bookmarks.length === 0) {
      elements.bookmarkItems.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 24px;">Belum ada penanda yang disimpan. Klik ikon penanda pada bait untuk menyimpan bacaan.</div>';
      return;
    }

    state.bookmarks.forEach(id => {
      // Find unit
      let foundUnit = null;
      let foundSair = null;
      for (const s of state.data.sairs) {
        const u = s.units.find(x => x.unit_id === id);
        if (u) {
          foundUnit = u;
          foundSair = s;
          break;
        }
      }

      if (!foundUnit) return;

      const item = document.createElement('div');
      item.className = 'search-result-item';
      
      let snippet = foundUnit.transliteration_latin || foundUnit.translation_indonesian || foundUnit.text_gorontalo || foundUnit.text_arabic || '';
      if (snippet.length > 120) snippet = snippet.substr(0, 120) + '...';

      item.innerHTML = `
        <div class="result-meta">
          <span>${foundSair.sair_title}</span>
          <span>${foundUnit.unit_id}</span>
        </div>
        <div class="result-text">${escapeHtml(snippet)}</div>
      `;

      item.addEventListener('click', () => {
        closeAllModals();
        switchSair(foundSair.sair_number);
        setTimeout(() => {
          const target = document.getElementById(`unit-${foundUnit.unit_id}`);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      });

      elements.bookmarkItems.appendChild(item);
    });
  }

  // Modal Sheet Controls
  function openModal(modal) {
    if (!modal) return;
    closeAllModals();
    modal.classList.add('open');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  }

  // Event Listeners
  let listenersAttached = false;
  function setupEventListeners() {
    if (listenersAttached) return;
    listenersAttached = true;

    // Sair Selector Pill Tap
    if (elements.sairSelectorPill) {
      elements.sairSelectorPill.addEventListener('click', () => {
        openModal(elements.sairListSheet);
      });
    }

    // Pager
    if (elements.prevBtn) {
      elements.prevBtn.addEventListener('click', () => switchSair(state.currentSair - 1));
    }
    if (elements.nextBtn) {
      elements.nextBtn.addEventListener('click', () => switchSair(state.currentSair + 1));
    }

    // Display Toggle Chips
    document.querySelectorAll('.toggle-chip[data-toggle]').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.getAttribute('data-toggle');
        toggleVisibilityKey(key);
      });
    });

    // Font Size Adjusters
    const fontDec = document.getElementById('fontDecBtn');
    if (fontDec) fontDec.addEventListener('click', () => adjustFontSize(-1));

    const fontInc = document.getElementById('fontIncBtn');
    if (fontInc) fontInc.addEventListener('click', () => adjustFontSize(1));

    // Theme Switcher Button
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', cycleTheme);

    // Search trigger
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        openModal(elements.searchSheet);
        setTimeout(() => {
          if (elements.searchInput) elements.searchInput.focus();
        }, 250);
      });
    }

    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
      });
    }

    // Bottom Navigation Bar
    const navSairList = document.getElementById('navSairList');
    if (navSairList) navSairList.addEventListener('click', () => openModal(elements.sairListSheet));

    const navSearch = document.getElementById('navSearch');
    if (navSearch) {
      navSearch.addEventListener('click', () => {
        openModal(elements.searchSheet);
        setTimeout(() => {
          if (elements.searchInput) elements.searchInput.focus();
        }, 250);
      });
    }

    const navBookmarks = document.getElementById('navBookmarks');
    if (navBookmarks) {
      navBookmarks.addEventListener('click', () => {
        renderBookmarksList();
        openModal(elements.bookmarksSheet);
      });
    }

    const navInfo = document.getElementById('navInfo');
    if (navInfo) navInfo.addEventListener('click', () => openModal(elements.infoSheet));

    // Brand click (opens Sair list)
    const navBrand = document.getElementById('navBrand');
    if (navBrand) navBrand.addEventListener('click', () => openModal(elements.sairListSheet));

    // Close buttons on sheets
    document.querySelectorAll('.btn-close-sheet, .sheet-grabber').forEach(btn => {
      btn.addEventListener('click', closeAllModals);
    });

    // Click outside modal to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAllModals();
      });
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllModals();
      } else if (e.key === 'ArrowLeft' && !document.querySelector('.modal-overlay.open')) {
        switchSair(state.currentSair - 1);
      } else if (e.key === 'ArrowRight' && !document.querySelector('.modal-overlay.open')) {
        switchSair(state.currentSair + 1);
      }
    });
  }

  // HTML Escaper
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run on DOM load
  document.addEventListener('DOMContentLoaded', init);
})();
