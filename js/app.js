/**
 * Aplikasi Utama Atlas Sastra Lisan Jawa Tengah
 * Logika filter reaktif, drawer detail multimedia, transkrip, dan dialog modal
 */
(function (window, document) {
  'use strict';

  // Global State
  const state = {
    searchQuery: '',
    filterR1: true,
    filterR2: true,
    filterR3: true,
    selectedKaresidenan: 'ALL',
    selectedEkologi: 'ALL',
    showBoundaries: false,
    selectedItem: null,
    currentVideoSource: 'youtube' // 'youtube' or 'local'
  };

  /**
   * Mengambil semua entri spasial (Ring 1, Ring 2, Ring 3)
   */
  function getAllItems() {
    if (!window.SASTRA_DATA) return [];
    const r1 = window.SASTRA_DATA.ring1 || [];
    const r2 = window.SASTRA_DATA.ring2 || [];
    const r3 = window.SASTRA_DATA.ring3 || [];
    return [...r1, ...r2, ...r3];
  }

  /**
   * Filter reaktif titik sastra lisan
   */
  function applyFilters() {
    const all = getAllItems();
    const query = state.searchQuery.toLowerCase().trim();

    const filtered = all.filter(function (item) {
      // 1. Filter Ring
      if (item.ring_level === 1 && !state.filterR1) return false;
      if (item.ring_level === 2 && !state.filterR2) return false;
      if (item.ring_level === 3 && !state.filterR3) return false;

      // 2. Filter Karesidenan
      if (state.selectedKaresidenan !== 'ALL') {
        const itemKar = (item.karesidenan || '').toLowerCase();
        if (!itemKar.includes(state.selectedKaresidenan.toLowerCase())) {
          return false;
        }
      }

      // 3. Filter Zona Ekologi
      if (state.selectedEkologi !== 'ALL') {
        const itemEko = (item.zona_ekologi || '').toLowerCase();
        if (!itemEko.includes(state.selectedEkologi.toLowerCase())) {
          return false;
        }
      }

      // 4. Filter Kata Kunci Pencarian
      if (query.length > 0) {
        const matchNama = (item.nama || '').toLowerCase().includes(query);
        const matchKab = (item.kabupaten || '').toLowerCase().includes(query);
        const matchMaestro = (item.maestro || '').toLowerCase().includes(query);
        const matchTeks = (item.unsur_teks || item.bentuk_tuturan || '').toLowerCase().includes(query);
        const matchRingkasan = (item.ringkasan_ilmiah || '').toLowerCase().includes(query);
        if (!matchNama && !matchKab && !matchMaestro && !matchTeks && !matchRingkasan) {
          return false;
        }
      }

      return true;
    });

    // Perbarui layer marker di peta
    if (window.MapLayers) {
      window.MapLayers.renderMarkers(filtered, openDrawer);
    }
  }

  /**
   * Membuka sliding drawer detail
   */
  function openDrawer(item) {
    state.selectedItem = item;
    const drawer = document.getElementById('detail-drawer');
    const drawerTitle = document.getElementById('drawer-title');
    const drawerBadge = document.getElementById('drawer-badge');

    drawerTitle.textContent = item.nama;

    // Set badge style & label
    drawerBadge.className = 'neo-badge';
    if (item.ring_level === 1) {
      drawerBadge.classList.add('badge-r1');
      drawerBadge.textContent = '⭐ Ring 1: Terverifikasi';
    } else if (item.ring_level === 2) {
      drawerBadge.classList.add('badge-r2');
      drawerBadge.textContent = '📖 Ring 2: Terverifikasi Teks';
    } else {
      drawerBadge.classList.add('badge-r3');
      drawerBadge.textContent = '🔍 Ring 3: Perlu Verifikasi';
    }

    // Render Tab Content
    renderTabProfil(item);
    renderTabTuturan(item);
    renderTabMultimedia(item);
    renderTabTranskrip(item);
    renderTabPustaka(item);

    // Reset ke tab pertama (Profil)
    switchDrawerTab('tab-pane-profil');

    // Sorot poligon wilayah kabupaten di peta
    if (window.MapLayers && typeof window.MapLayers.highlightKabupaten === 'function') {
      window.MapLayers.highlightKabupaten(item.kabupaten);
    }

    // Tampilkan Drawer
    drawer.classList.add('drawer-open');
  }

  function closeDrawer() {
    const drawer = document.getElementById('detail-drawer');
    drawer.classList.remove('drawer-open');
    // Hentikan video yang sedang berputar bila ada
    const videoWrapper = document.getElementById('video-wrapper');
    if (videoWrapper) {
      videoWrapper.innerHTML = '';
    }
    // Reset sorotan poligon wilayah kabupaten di peta
    if (window.MapLayers && typeof window.MapLayers.resetKabupatenHighlight === 'function') {
      window.MapLayers.resetKabupatenHighlight();
    }
  }

  /**
   * Mengubah tab aktif di drawer
   */
  function switchDrawerTab(targetPaneId) {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      if (btn.getAttribute('data-target') === targetPaneId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.tab-pane').forEach(function (pane) {
      if (pane.id === targetPaneId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }

  /**
   * Render Tab 1: Profil & Ekologi
   */
  function renderTabProfil(item) {
    const locGrid = document.getElementById('meta-location-grid');
    locGrid.innerHTML = `
      <span class="meta-label">Kabupaten / Kota:</span>
      <span class="meta-value">${item.kabupaten || '-'}</span>
      <span class="meta-label">Kecamatan:</span>
      <span class="meta-value">${item.kecamatan || '-'}</span>
      <span class="meta-label">Desa / Dusun:</span>
      <span class="meta-value">${item.desa || '-'}</span>
      <span class="meta-label">Karesidenan:</span>
      <span class="meta-value">${item.karesidenan || '-'}</span>
      <span class="meta-label">Zona Ekologi:</span>
      <span class="meta-value">${item.zona_ekologi || '-'}</span>
      <span class="meta-label">Koordinat GPS:</span>
      <span class="meta-value">${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}</span>
    `;

    const maestroGrid = document.getElementById('meta-maestro-grid');
    maestroGrid.innerHTML = `
      <span class="meta-label">Nama Maestro:</span>
      <span class="meta-value" style="font-weight: 800; color: #000;">${item.maestro || 'Belum terdaftar profil maestro perorangan'}</span>
      <span class="meta-label">Usia / Garis:</span>
      <span class="meta-value">${item.usia_garis || '-'}</span>
      <span class="meta-label">Komunitas Pewaris:</span>
      <span class="meta-value">${item.komunitas || 'Masyarakat adat dan sanggar seni setempat'}</span>
    `;

    const narrative = document.getElementById('narrative-summary');
    const sourceSummary = item.sumber_ilmiah_1 || item.sumber_ilmiah || item.sumber_referensi || 'Balai Bahasa Provinsi Jawa Tengah (2026)';
    narrative.innerHTML = `
      <div style="margin-bottom: 12px; line-height: 1.6; font-size: 0.86rem;">
        ${item.ringkasan_ilmiah || item.catatan_kritis || 'Belum ada catatan deskriptif naratif.'}
      </div>
      <div style="background: #fdfbf7; border: 2px solid #000; box-shadow: 2px 2px 0px #000; padding: 10px; margin-top: 10px;">
        <div style="font-size: 0.75rem; color: #555; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-graduation-cap text-yellow-600"></i> Rujukan Ilmiah Verifikasi:
        </div>
        <div style="font-size: 0.82rem; font-style: italic; color: #111; margin-bottom: 8px;">
          "${sourceSummary}"
        </div>
        <button type="button" class="neo-btn neo-btn-cyan" style="font-size: 0.74rem; padding: 4px 10px; font-weight: 700;" onclick="document.getElementById('tab-pustaka').click();">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Lihat Tautan & Detail Sumber
        </button>
      </div>
    `;
  }

  /**
   * Render Tab 2: Formula Tuturan
   */
  function renderTabTuturan(item) {
    const bentukEl = document.getElementById('formula-bentuk');
    bentukEl.textContent = item.bentuk_tuturan || item.unsur_teks || 'Tradisi tutur lisan komunal';

    const musikEl = document.getElementById('formula-musik');
    musikEl.textContent = item.iringan_musik || 'Tuturan ritmis dengan instrumen penopang khas daerah';

    const sampleEl = document.getElementById('formula-sample');
    if (item.repertoar) {
      sampleEl.textContent = item.repertoar;
    } else if (item.unsur_teks) {
      sampleEl.textContent = `Unsur tuturan teridentifikasi: ${item.unsur_teks}`;
    } else {
      sampleEl.textContent = 'Formula tuturan baku sedang dalam penelusuran lebih lanjut.';
    }
  }

  /**
   * Render Tab 3: Multimedia (YouTube Embeds, Local Video, Photo Gallery)
   */
  function renderTabMultimedia(item) {
    const videoWrapper = document.getElementById('video-wrapper');
    const btnYtExternal = document.getElementById('btn-yt-external');
    const btnSwitchSource = document.getElementById('btn-switch-video-source');
    const galleryGrid = document.getElementById('photo-gallery-grid');

    videoWrapper.innerHTML = '';
    galleryGrid.innerHTML = '';

    // Pemetaan YouTube resmi untuk Ring 1
    let ytId = null;
    if (item.nama && item.nama.includes('Blora')) {
      ytId = '5XteEv2MU_g'; // Kentrung Blora
    } else if (item.nama && item.nama.includes('Pasir Luhur')) {
      ytId = 'Ixm0NVVzniM'; // Maca Babad Pasir Luhur
    } else if (item.nama && item.nama.includes('Othok Obrol')) {
      ytId = 'Q_JAmcKSFB0'; // Wayang Othok Obrol
    } else if (item.youtube_id) {
      ytId = item.youtube_id;
    }

    if (ytId) {
      // Pasang embed YouTube
      videoWrapper.innerHTML = `
        <iframe 
          src="https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1" 
          title="Dokumentasi Video ${item.nama}" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      `;
      btnYtExternal.style.display = 'inline-flex';
      btnYtExternal.href = `https://youtu.be/${ytId}`;

      // Opsi tombol video lokal untuk Kentrung
      if (item.video_local) {
        btnSwitchSource.style.display = 'inline-flex';
        btnSwitchSource.onclick = function () {
          if (state.currentVideoSource === 'youtube') {
            videoWrapper.innerHTML = `
              <video controls style="width:100%; height:100%; object-fit:cover;" poster="${item.cover_image || ''}">
                <source src="${item.video_local}" type="video/mp4">
                Peramban Anda tidak mendukung pemutaran video HTML5.
              </video>
            `;
            btnSwitchSource.innerHTML = '<i class="fa-brands fa-youtube"></i> Putar YouTube';
            state.currentVideoSource = 'local';
          } else {
            videoWrapper.innerHTML = `
              <iframe 
                src="https://www.youtube.com/embed/${ytId}?rel=0" 
                title="Dokumentasi Video ${item.nama}" 
                allow="accelerometer; autoplay; encrypted-media;" 
                allowfullscreen>
              </iframe>
            `;
            btnSwitchSource.innerHTML = '<i class="fa-solid fa-video"></i> Putar Video Lokal';
            state.currentVideoSource = 'youtube';
          }
        };
      } else {
        btnSwitchSource.style.display = 'none';
      }
    } else {
      // Bukan Ring 1 atau belum ada video
      videoWrapper.innerHTML = `
        <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f4efe6; color:#444; padding:20px; text-align:center;">
          <i class="fa-solid fa-film" style="font-size: 2.5rem; margin-bottom: 10px; color:#999;"></i>
          <p style="font-weight: 700; font-size: 0.9rem;">Dokumentasi Video Lapangan Belum Diunggah</p>
          <p style="font-size: 0.75rem; color: #666; margin-top: 4px;">Entri ini saat ini terdokumentasikan dalam laporan inventarisasi ilmiah dan naskah.</p>
        </div>
      `;
      btnYtExternal.style.display = 'none';
      btnSwitchSource.style.display = 'none';
    }

    // Galeri Foto
    let photos = [];
    if (item.gallery_images && item.gallery_images.length > 0) {
      photos = item.gallery_images;
    } else if (item.cover_image) {
      photos = [item.cover_image];
    }

    const galleryCard = (galleryGrid && typeof galleryGrid.closest === 'function') ? galleryGrid.closest('.info-card') : null;
    if (galleryCard) {
      const h4 = galleryCard.querySelector('h4');
      if (h4) {
        h4.innerHTML = `<i class="fa-solid fa-images"></i> Galeri Dokumentasi Lapangan (${photos.length} Foto)`;
      }
    }

    if (photos.length > 0) {
      photos.forEach(function (src, idx) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Dokumentasi ${item.nama} (${idx + 1})`;
        img.title = `Foto ke-${idx + 1} &bull; Klik untuk membuka ukuran penuh`;
        img.className = 'gallery-thumb';
        img.loading = 'lazy';
        img.onclick = function () {
          window.open(src, '_blank');
        };
        galleryGrid.appendChild(img);
      });

      // Tambahkan tautan langsung ke folder Google Drive bila Kentrung Blora
      if (item.nama && item.nama.includes('Blora')) {
        const driveDiv = document.createElement('div');
        driveDiv.style.gridColumn = '1 / -1';
        driveDiv.style.marginTop = '8px';
        driveDiv.innerHTML = `
          <a href="https://drive.google.com/drive/folders/18w4WNaHh6PTtLBR11E406lFkM9far-rF?usp=sharing" target="_blank" rel="noopener noreferrer" class="neo-btn" style="font-size:0.75rem; text-decoration:none; background:#fff; display:inline-flex; align-items:center; gap:6px;">
            <i class="fa-brands fa-google-drive text-green-600"></i> Buka Folder Google Drive Asli (50 Foto Dokumentasi)
          </a>
        `;
        galleryGrid.appendChild(driveDiv);
      }
    } else {
      galleryGrid.innerHTML = '<p style="font-size:0.8rem; color:#777;">Tidak ada foto tambahan untuk tradisi ini.</p>';
    }
  }

  /**
   * Render Tab 4: Transkrip Naskah
   */
  function renderTabTranskrip(item) {
    const listEl = document.getElementById('transcript-segments-list');
    listEl.innerHTML = '';

    const transkripData = window.TRANSKRIP_DATA || {};

    if (item.nama && item.nama.includes('Blora')) {
      const korpus = transkripData.kentrung_blora;
      if (korpus && korpus.segmen) {
        renderTranscriptSegments(korpus.segmen, listEl);
      }
    } else if (item.nama && item.nama.includes('Pasir Luhur')) {
      const korpus = transkripData.maca_babad_pasir_luhur;
      if (korpus && korpus.pupuh) {
        korpus.pupuh.forEach(function (p) {
          const div = document.createElement('div');
          div.className = 'segment-item';
          div.innerHTML = `
            <span class="segment-time">Pupuh ${p.metrum} (Bait ${p.bait})</span>
            <p style="font-family:'Times New Roman', serif; font-size:1rem; line-height:1.6; margin:6px 0; font-style:italic;">
              "${p.cakepan_jawa}"
            </p>
            <p style="font-size:0.8rem; color:#444; border-top:1px dashed #bbb; padding-top:4px;">
              <strong>Terjemahan:</strong> ${p.terjemahan}
            </p>
          `;
          listEl.appendChild(div);
        });
      }
    } else if (item.nama && item.nama.includes('Othok Obrol')) {
      const korpus = transkripData.wayang_othok_obrol;
      if (korpus && korpus.fragmen) {
        korpus.fragmen.forEach(function (f) {
          const div = document.createElement('div');
          div.className = 'segment-item';
          div.innerHTML = `
            <span class="segment-time">${f.nama}</span>
            <p style="line-height:1.5; margin:6px 0; font-style:italic; font-family:'Times New Roman', serif; font-size:0.95rem;">
              ${f.teks_jawa.replace(/\n/g, '<br>')}
            </p>
            <p style="font-size:0.8rem; color:#444; border-top:1px dashed #bbb; padding-top:4px;">
              <strong>Fungsi Tutur:</strong> ${f.fungsi}
            </p>
          `;
          listEl.appendChild(div);
        });
      }
    } else {
      // Tampilkan ringkasan tekstual untuk Ring 2 dan 3
      listEl.innerHTML = `
        <div class="segment-item">
          <span class="segment-time">Catatan Formula Teks</span>
          <p style="margin-top:6px; font-weight:600;">${item.unsur_teks || 'Belum ada transkripsi fonemik penuh untuk entri ini.'}</p>
          <p style="font-size:0.8rem; color:#555; margin-top:4px;">${item.ringkasan_ilmiah || item.catatan_kritis || ''}</p>
        </div>
      `;
    }
  }

  function renderTranscriptSegments(segments, containerEl) {
    segments.forEach(function (seg) {
      const div = document.createElement('div');
      div.className = 'segment-item';
      div.setAttribute('data-text', seg.text.toLowerCase());
      div.innerHTML = `
        <span class="segment-time">${seg.timestamp} &bull; ${seg.section}</span>
        <p style="line-height:1.5; margin-top:4px;">${seg.text}</p>
      `;
      containerEl.appendChild(div);
    });

    // In-transcript live search
    const transInput = document.getElementById('transcript-search-input');
    transInput.oninput = function () {
      const q = transInput.value.toLowerCase().trim();
      const items = containerEl.querySelectorAll('.segment-item');
      items.forEach(function (itemEl) {
        const text = itemEl.getAttribute('data-text') || '';
        if (!q || text.includes(q)) {
          itemEl.style.display = 'block';
          if (q) itemEl.classList.add('highlight');
          else itemEl.classList.remove('highlight');
        } else {
          itemEl.style.display = 'none';
          itemEl.classList.remove('highlight');
        }
      });
    };
  }

  /**
   * Mengubah teks URL menjadi tautan HTML interaktif
   */
  function linkifyText(text) {
    if (!text) return '';
    return text.replace(/(https?:\/\/[^\s<>"']+)/g, function (url) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0044cc; font-weight: 700; text-decoration: underline; word-break: break-all;">${url} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75em;"></i></a>`;
    });
  }

  /**
   * Render Tab 5: Sumber Pustaka Ilmiah dengan Tautan Interaktif (DOI / Jurnal / Garuda / WBTB)
   */
  function renderTabPustaka(item) {
    const citationEl = document.getElementById('citation-content');
    if (!citationEl) return;

    const ringLevel = item.ring_level || (item.ring && item.ring.includes('1') ? 1 : item.ring && item.ring.includes('2') ? 2 : 3);

    // Sumber Utama
    const s1Raw = item.sumber_ilmiah_1 || item.sumber_ilmiah || item.sumber_referensi || 'Balai Bahasa Provinsi Jawa Tengah (2026)';
    const url1 = (item.url1 && item.url1.trim().startsWith('http')) ? item.url1.trim() : null;

    // Sumber Pembanding / Kedua
    const s2Raw = item.sumber_ilmiah_2 || null;
    const url2 = (item.url2 && item.url2.trim().startsWith('http')) ? item.url2.trim() : null;

    // Tentukan label badge berdasarkan tipe rujukan dan level ring
    let badgeClass = 'badge-r1';
    let badgeTitle = 'Rujukan Utama';
    let badgeSub = 'Verifikasi Ilmiah';

    if (ringLevel === 1) {
      badgeClass = 'badge-r1';
      badgeTitle = 'Arsip & Bukti Lapangan';
      badgeSub = 'Primer Balai Bahasa';
    } else if (ringLevel === 2) {
      badgeClass = 'badge-r2';
      badgeTitle = 'Rujukan Akademik Berteks';
      badgeSub = 'Jurnal Ilmiah Terindeks';
    } else if (ringLevel === 3) {
      badgeClass = 'badge-r3';
      if (url1 && url1.includes('dapobud.kemenbud.go.id')) {
        badgeTitle = 'Registrasi WBTB Nasional';
        badgeSub = 'Prioritas Pengamatan Lapangan';
      } else if (url1 && (url1.includes('doi.org') || url1.includes('journal') || url1.includes('ejournal') || url1.includes('garuda'))) {
        badgeTitle = 'Kajian Akademik Pendukung';
        badgeSub = 'Perlu Transkripsi Lapangan';
      } else {
        badgeTitle = 'Pencatatan Pangkalan Data';
        badgeSub = 'Target Verifikasi Lapangan';
      }
    }

    // Label tombol URL 1
    let url1Label = 'Buka Tautan Sumber / DOI';
    let url1Icon = 'fa-arrow-up-right-from-square';
    if (url1) {
      if (url1.includes('doi.org')) {
        url1Label = 'Buka DOI Resmi (Artikel Jurnal)';
        url1Icon = 'fa-certificate';
      } else if (url1.includes('dapobud.kemenbud.go.id')) {
        url1Label = 'Buka Detail WBTB Resmi (Kemenbud)';
        url1Icon = 'fa-landmark';
      } else if (url1.includes('balaibahasajateng') || url1.includes('.go.id')) {
        url1Label = 'Buka Dokumentasi Resmi Pemda / Balai Bahasa';
        url1Icon = 'fa-building-columns';
      } else if (url1.includes('youtu')) {
        url1Label = 'Tonton Rekaman Dokumentasi Lapangan';
        url1Icon = 'fa-video';
      } else if (url1.endsWith('.pdf')) {
        url1Label = 'Buka Dokumen / Laporan PDF';
        url1Icon = 'fa-file-pdf';
      }
    }

    // Label tombol URL 2
    let url2Label = 'Buka Tautan Alternatif / OJS';
    let url2Icon = 'fa-arrow-up-right-from-square';
    if (url2) {
      if (url2.includes('doi.org')) {
        url2Label = 'Buka DOI Resmi';
        url2Icon = 'fa-certificate';
      } else if (url2.includes('garuda.kemdiktisaintek.go.id')) {
        url2Label = 'Buka Arsip di Portal Garuda';
        url2Icon = 'fa-graduation-cap';
      } else if (url2.includes('dapobud.kemenbud.go.id')) {
        url2Label = 'Buka Detail WBTB Resmi (Kemenbud)';
        url2Icon = 'fa-landmark';
      } else if (url2.includes('balaibahasajateng') || url2.includes('.go.id')) {
        url2Label = 'Buka Dokumentasi Pemda / Balai Bahasa';
        url2Icon = 'fa-building-columns';
      }
    }

    // Query pencarian yang aman (tanpa memicu bot block Google Scholar)
    const safeSearchQuery = encodeURIComponent(`${item.nama} tradisi lisan jawa tengah jurnal`);
    const garudaSearchQuery = encodeURIComponent(item.nama);

    let html = `
      <div style="margin-bottom: 16px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <span class="neo-badge ${badgeClass}" style="font-size:0.75rem; padding:3px 8px;">
            <i class="fa-solid fa-bookmark"></i> ${badgeTitle}
          </span>
          <span style="font-size:0.75rem; color:#555; font-weight:700;">${badgeSub}</span>
        </div>

        <div style="padding: 12px; background: #fffbe6; border: 2.5px solid #000; box-shadow: 3px 3px 0px #000; margin-bottom: 10px; font-size: 0.88rem; line-height: 1.55;">
          ${linkifyText(s1Raw)}
        </div>

        ${item.dasar_bukti_1 ? `
          <div style="font-size: 0.8rem; background: #fff; border: 2px solid #000; border-left: 5px solid #FF6B35; padding: 8px 10px; margin-bottom: 10px; color: #111;">
            <strong style="color: #c2410c;"><i class="fa-solid fa-check-double"></i> Dasar Bukti Tekstual:</strong><br>
            <span style="margin-top: 2px; display: inline-block;">${item.dasar_bukti_1}</span>
          </div>
        ` : ''}

        ${(ringLevel === 3 && item.catatan_kritis) ? `
          <div style="font-size: 0.8rem; background: #fff8f0; border: 2px solid #000; border-left: 5px solid #ea580c; padding: 8px 10px; margin-bottom: 10px; color: #111;">
            <strong style="color: #c2410c;"><i class="fa-solid fa-clipboard-question"></i> Catatan Kritis Lapangan:</strong><br>
            <span style="margin-top: 2px; display: inline-block;">${item.catatan_kritis}</span>
          </div>
        ` : ''}

        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
          ${url1 ? `
            <a href="${url1}" target="_blank" rel="noopener noreferrer" class="neo-btn neo-btn-cyan" style="font-size: 0.78rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid ${url1Icon}"></i> ${url1Label}
            </a>
          ` : ''}
          <a href="https://www.google.com/search?q=${safeSearchQuery}" target="_blank" rel="noreferrer" class="neo-btn" style="font-size: 0.78rem; text-decoration: none; background: #fff; display: inline-flex; align-items: center; gap: 6px;">
            <i class="fa-brands fa-google text-blue-600"></i> Cari di Google Web
          </a>
          <a href="https://garuda.kemdiktisaintek.go.id/?q=${garudaSearchQuery}" target="_blank" rel="noreferrer" class="neo-btn" style="font-size: 0.78rem; text-decoration: none; background: #fff; display: inline-flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-graduation-cap text-orange-600"></i> Cari di Portal Garuda
          </a>
        </div>
      </div>
    `;

    if (s2Raw) {
      html += `
        <div style="margin-top: 18px; border-top: 2.5px dashed #000; padding-top: 14px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span class="neo-badge badge-r2" style="font-size:0.75rem; padding:3px 8px;">
              <i class="fa-solid fa-book-open"></i> Sumber Pendamping / Repositori
            </span>
          </div>

          <div style="padding: 12px; background: #e0f2fe; border: 2.5px solid #000; box-shadow: 3px 3px 0px #000; margin-bottom: 10px; font-size: 0.88rem; line-height: 1.55;">
            ${linkifyText(s2Raw)}
          </div>

          ${item.dasar_bukti_2 ? `
            <div style="font-size: 0.8rem; background: #fff; border: 2px solid #000; border-left: 5px solid #00E5FF; padding: 8px 10px; margin-bottom: 10px; color: #111;">
              <strong style="color: #0284c7;"><i class="fa-solid fa-check"></i> Dasar Bukti Tambahan:</strong><br>
              <span style="margin-top: 2px; display: inline-block;">${item.dasar_bukti_2}</span>
            </div>
          ` : ''}

          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
            ${url2 ? `
              <a href="${url2}" target="_blank" rel="noopener noreferrer" class="neo-btn neo-btn-cyan" style="font-size: 0.78rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                <i class="fa-solid ${url2Icon}"></i> ${url2Label}
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }

    // Informasi Ringkasan Metodologis
    let noteText = 'Seluruh rujukan akademik telah melalui uji kurasi komprehensif Balai Bahasa Provinsi Jawa Tengah untuk memastikan keterpenuhan korpus sastra tutur lisan.';
    if (ringLevel === 3) {
      noteText = 'Objek berstatus Ring 3 adalah tradisi yang tercatat dalam pangkalan data budaya daerah/WBTB, namun belum memiliki transkripsi teks sastra lisan di jurnal ilmiah bereputasi. Status ini menjadi panduan prioritas bagi tim Balai Bahasa untuk melakukan perekaman dan pengujian korpus tutur langsung di lapangan.';
    }

    html += `
      <div style="margin-top: 16px; background: #fdfaf6; border: 1.5px solid #999; padding: 10px; font-size: 0.75rem; color: #444; line-height: 1.4;">
        <i class="fa-solid fa-circle-info text-blue-600"></i>
        ${noteText}
      </div>
    `;

    citationEl.innerHTML = html;
  }

  /**
   * Modal Dialogs Controller
   */
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  function renderAnalyticsModal() {
    const body = document.getElementById('analytics-modal-body');
    if (!body || !window.SASTRA_DATA) return;

    const data = window.SASTRA_DATA;
    const kabs = data.kabupaten || [];

    // Hitung per Karesidenan
    const karesidenanCounts = {};
    kabs.forEach(function (k) {
      const kar = k.karesidenan || 'Lainnya';
      if (!karesidenanCounts[kar]) {
        karesidenanCounts[kar] = { total: 0, r1: 0, r2: 0, r3: 0, r4: 0, kabCount: 0 };
      }
      karesidenanCounts[kar].total += k.total_potensi;
      karesidenanCounts[kar].r1 += k.r1_count;
      karesidenanCounts[kar].r2 += k.r2_count;
      karesidenanCounts[kar].r3 += k.r3_count;
      karesidenanCounts[kar].r4 += k.r4_count;
      karesidenanCounts[kar].kabCount += 1;
    });

    let html = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:10px; margin-bottom:20px;">
        <div class="stat-chip badge-r1" style="justify-content:center; padding:10px;">
          <div><div style="font-size:1.4rem; font-weight:800;">${data.metadata.total_ring1}</div><div style="font-size:0.75rem;">Ring 1 (Terverifikasi)</div></div>
        </div>
        <div class="stat-chip badge-r2" style="justify-content:center; padding:10px;">
          <div><div style="font-size:1.4rem; font-weight:800;">${data.metadata.total_ring2}</div><div style="font-size:0.75rem;">Ring 2 (Terverifikasi Teks)</div></div>
        </div>
        <div class="stat-chip badge-r3" style="justify-content:center; padding:10px;">
          <div><div style="font-size:1.4rem; font-weight:800;">${data.metadata.total_ring3}</div><div style="font-size:0.75rem;">Ring 3 (Perlu Verifikasi)</div></div>
        </div>
        <div class="stat-chip badge-r4" style="justify-content:center; padding:10px;">
          <div><div style="font-size:1.4rem; font-weight:800;">${data.metadata.total_ring4}</div><div style="font-size:0.75rem;">Ring 4 (Eksklusi)</div></div>
        </div>
      </div>

      <h4 style="font-family:'Space Grotesk', sans-serif; font-size:1rem; font-weight:800; margin-bottom:10px;">
        Distribusi Potensi Sastra Lisan Berdasarkan 6 Wilayah Karesidenan:
      </h4>
      <table style="width:100%; border-collapse:collapse; font-size:0.82rem; border:2px solid #000;">
        <thead>
          <tr style="background:#FFE600; border-bottom:2px solid #000;">
            <th style="padding:8px; text-align:left; border-right:1px solid #000;">Wilayah Karesidenan</th>
            <th style="padding:8px; text-align:center; border-right:1px solid #000;">Kab/Kota</th>
            <th style="padding:8px; text-align:center; border-right:1px solid #000;">⭐ R1</th>
            <th style="padding:8px; text-align:center; border-right:1px solid #000;">📖 R2</th>
            <th style="padding:8px; text-align:center; border-right:1px solid #000;">🔍 R3</th>
            <th style="padding:8px; text-align:center;">Total Sastra</th>
          </tr>
        </thead>
        <tbody>
    `;

    Object.keys(karesidenanCounts).sort().forEach(function (kar) {
      const row = karesidenanCounts[kar];
      html += `
        <tr style="border-bottom:1px solid #ddd;">
          <td style="padding:7px 8px; font-weight:700; border-right:1px solid #ddd;">${kar}</td>
          <td style="padding:7px 8px; text-align:center; border-right:1px solid #ddd;">${row.kabCount}</td>
          <td style="padding:7px 8px; text-align:center; font-weight:700; color:#d97706; border-right:1px solid #ddd;">${row.r1}</td>
          <td style="padding:7px 8px; text-align:center; font-weight:700; color:#0284c7; border-right:1px solid #ddd;">${row.r2}</td>
          <td style="padding:7px 8px; text-align:center; font-weight:700; color:#ea580c; border-right:1px solid #ddd;">${row.r3}</td>
          <td style="padding:7px 8px; text-align:center; font-weight:800;">${row.total}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    body.innerHTML = html;
  }

  function renderMethodologyModal() {
    const body = document.getElementById('methodology-modal-body');
    if (!body || !window.SASTRA_DATA) return;

    const ring4 = window.SASTRA_DATA.ring4 || [];

    let html = `
      <div style="background:#FFFDF9; border:2px solid #000; padding:12px; margin-bottom:16px; box-shadow:3px 3px 0px #000;">
        <h4 style="font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:0.95rem; margin-bottom:4px;">
          Kriteria Metodologi Kurasi Ilmiah Balai Bahasa Provinsi Jawa Tengah (2026)
        </h4>
        <p style="font-size:0.82rem; line-height:1.5;">
          Pemetaan Sastra Lisan menggunakan pendekatan <strong>Ring Validasi Empiris</strong> untuk menjaga integritas data kebahasaan dan kesusastraan nasional:
        </p>
        <ul style="font-size:0.8rem; margin:8px 0 0 18px; line-height:1.5;">
          <li><strong>Ring 1 (Terverifikasi):</strong> Telah divalidasi penuh di lapangan dengan profil maestro aktif, GPS presisi, transkrip rekaman, dan media resmi.</li>
          <li><strong>Ring 2 (Terverifikasi Teks):</strong> Terbukti secara tekstual ilmiah memiliki formula tuturan (mantra, tembang, suluk, parikan).</li>
          <li><strong>Ring 3 (Perlu Verifikasi):</strong> Ritus adat atau pertunjukan komunal yang masuk prioritas verifikasi lapangan untuk menemukan naskah tuturan bakunya.</li>
          <li><strong>Ring 4 (Eksklusi Non-Sastra):</strong> Objek budaya yang resmi dikeluarkan karena merupakan kriya, busana, kuliner tradisional, atau penanggalan fisik tanpa unsur sastra tutur.</li>
        </ul>
      </div>

      <h4 style="font-family:'Space Grotesk',sans-serif; font-weight:800; font-size:0.95rem; margin-bottom:8px;">
        Daftar 40 Entri Budaya Ring 4 (Eksklusi Non-Sastra):
      </h4>
      <div style="max-height: 340px; overflow-y: auto; border: 2px solid #000;">
        <table style="width:100%; border-collapse:collapse; font-size:0.78rem;">
          <thead style="position:sticky; top:0; background:#FF3366; color:#fff;">
            <tr>
              <th style="padding:6px; text-align:center; width:40px;">No.</th>
              <th style="padding:6px; text-align:left;">Nama Entri Budaya</th>
              <th style="padding:6px; text-align:left;">Daerah Asal</th>
              <th style="padding:6px; text-align:left;">Kategori Budaya</th>
              <th style="padding:6px; text-align:left;">Alasan Ilmiah Eksklusi</th>
            </tr>
          </thead>
          <tbody>
    `;

    ring4.forEach(function (r) {
      html += `
        <tr style="border-bottom:1px solid #ddd;">
          <td style="padding:6px; text-align:center; font-weight:700;">${r.no}</td>
          <td style="padding:6px; font-weight:700;">${r.nama}</td>
          <td style="padding:6px;">${r.kabupaten}</td>
          <td style="padding:6px;"><span class="neo-badge" style="background:#eee;">${r.kategori_asli}</span></td>
          <td style="padding:6px; color:#555;">${r.alasan_eksklusi}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    body.innerHTML = html;
  }

  /**
   * Inisialisasi Event Listener
   */
  function setupEventListeners() {
    // 1. Search Input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function () {
      state.searchQuery = searchInput.value;
      applyFilters();
    });

    // 2. Ring Checkboxes
    document.getElementById('filter-r1').addEventListener('change', function (e) {
      state.filterR1 = e.target.checked;
      applyFilters();
    });
    document.getElementById('filter-r2').addEventListener('change', function (e) {
      state.filterR2 = e.target.checked;
      applyFilters();
    });
    document.getElementById('filter-r3').addEventListener('change', function (e) {
      state.filterR3 = e.target.checked;
      applyFilters();
    });

    // 3. Dropdowns
    document.getElementById('select-karesidenan').addEventListener('change', function (e) {
      state.selectedKaresidenan = e.target.value;
      applyFilters();
    });
    document.getElementById('select-ekologi').addEventListener('change', function (e) {
      state.selectedEkologi = e.target.value;
      applyFilters();
    });

    // 4. Toggle Boundaries
    document.getElementById('toggle-boundaries').addEventListener('change', function (e) {
      state.showBoundaries = e.target.checked;
      if (window.MapLayers) {
        window.MapLayers.toggleBoundaries(state.showBoundaries);
      }
    });

    // 5. Reset Button
    document.getElementById('btn-reset-filters').addEventListener('click', function () {
      searchInput.value = '';
      state.searchQuery = '';
      document.getElementById('filter-r1').checked = true;
      document.getElementById('filter-r2').checked = true;
      document.getElementById('filter-r3').checked = true;
      state.filterR1 = true;
      state.filterR2 = true;
      state.filterR3 = true;
      document.getElementById('select-karesidenan').value = 'ALL';
      state.selectedKaresidenan = 'ALL';
      document.getElementById('select-ekologi').value = 'ALL';
      state.selectedEkologi = 'ALL';
      closeDrawer();
      applyFilters();
      if (window.MapLayers) {
        window.MapLayers.resetKabupatenHighlight();
        window.MapLayers.resetView();
      }
    });

    // 6. Toggle Panel Collapse
    const btnTogglePanel = document.getElementById('btn-toggle-panel');
    const panelBody = document.getElementById('panel-body-content');
    btnTogglePanel.addEventListener('click', function () {
      if (panelBody.style.display === 'none') {
        panelBody.style.display = 'flex';
        btnTogglePanel.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
      } else {
        panelBody.style.display = 'none';
        btnTogglePanel.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
      }
    });

    // 7. Drawer Close Button
    document.getElementById('drawer-close-btn').addEventListener('click', closeDrawer);

    // 8. Drawer Tab Buttons
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const target = btn.getAttribute('data-target');
        switchDrawerTab(target);
      });
    });

    // 9. Modals Trigger
    document.getElementById('btn-export-gis').addEventListener('click', function () {
      openModal('modal-export');
    });

    document.getElementById('btn-analytics').addEventListener('click', function () {
      renderAnalyticsModal();
      openModal('modal-analytics');
    });

    document.getElementById('btn-methodology').addEventListener('click', function () {
      renderMethodologyModal();
      openModal('modal-methodology');
    });

    // Modal Close buttons
    document.querySelectorAll('.modal-close-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const modalId = btn.getAttribute('data-modal');
        closeModal(modalId);
      });
    });

    // Modal backdrop click
    document.querySelectorAll('.neo-modal-backdrop').forEach(function (backdrop) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) {
          backdrop.classList.remove('open');
        }
      });
    });

    // 10. GIS Exporter Buttons
    document.getElementById('btn-download-geojson').addEventListener('click', function () {
      if (window.GISExporter) {
        window.GISExporter.exportGeoJSON(window.SASTRA_DATA);
      }
    });

    document.getElementById('btn-download-csv').addEventListener('click', function () {
      if (window.GISExporter) {
        window.GISExporter.exportCSV(window.SASTRA_DATA);
      }
    });

    document.getElementById('btn-download-boundary-geojson').addEventListener('click', function () {
      if (window.GISExporter) {
        window.GISExporter.exportBoundaryGeoJSON(window.JATENG_KABUPATEN);
      }
    });
  }

  // App Initialization
  function init() {
    console.log('Inisialisasi Atlas Digital Sastra Lisan Jawa Tengah...');
    if (window.MapLayers) {
      window.MapLayers.initMap('map');
    }
    setupEventListeners();
    applyFilters();
  }

  // Expose to window
  window.App = {
    init: init,
    applyFilters: applyFilters,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    renderTranscript: renderTabTranskrip,
    renderAnalyticsModal: renderAnalyticsModal,
    renderMethodologyModal: renderMethodologyModal
  };

  document.addEventListener('DOMContentLoaded', init);
})(typeof window !== 'undefined' ? window : this, document);
