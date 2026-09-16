# Atlas Digital Peta Sastra Lisan Jawa Tengah Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi Web GIS interaktif mandiri (*Standalone*) bertema Neobrutalisme untuk memetakan seluruh korpus sastra lisan Jawa Tengah (Ring 1 Terverifikasi, Ring 2 Terverifikasi Teks, Ring 3 Perlu Verifikasi, dan Ring 4 Eksklusi), dilengkapi pemutar multimedia resmi, transkrip naskah, serta fitur ekspor spasial untuk QGIS dan ArcGIS.

**Architecture:** Arsitektur SPA murni berbasis browser (HTML5, Vanilla JS, Leaflet.js, CSS Neobrutalis kustom) tanpa server backend/database khusus; data diekstraksi dari Excel/Word ke JavaScript global objek (`sastra_data.js`, `jateng_kabupaten.js`, `transkrip_data.js`) sehingga dapat dibuka langsung via klik berkas `index.html` dan 100% offline-ready.

**Tech Stack:** HTML5, CSS3 (Neobrutalism Design System), JavaScript (ES6+), Leaflet.js v1.9.4, CartoDB Positron / OSM tiles, Python openpyxl/python-docx (untuk ekstraksi korpus data).

**Spec:** docs/superpowers/specs/2026-09-16-peta-sastra-lisan-design.md

## Global Constraints

- Standalone Web GIS: Tidak boleh bergantung pada runtime server khusus (Node.js/Python server) saat dibuka oleh pengguna akhir di browser.
- Palet Warna & Gaya: Wajib mengadopsi Neobrutalisme (border hitam tegas 2.5-3px, hard drop-shadow 4px tanpa blur, palet warna tajam: Kuning Kenari `#FFE600`, Biru Cyan `#00E5FF`, Oranye `#FF6B35`, Merah `#FF3366`, Ungu `#A78BFA`, Kanvas `#FFFDF9`).
- Terminologi Kategori: Wajib menggunakan istilah resmi: Ring 1 = "Terverifikasi", Ring 2 = "Terverifikasi Teks", Ring 3 = "Perlu Verifikasi", Ring 4 = "Eksklusi Non-Sastra".
- Multimedia Ring 1: Ketiga tradisi Terverifikasi (Kentrung Blora, Maca Babad Pasir Luhur, Wayang Othok Obrol) wajib mendapatkan perlakuan video/foto dan transkripsi yang setara (mengintegrasikan tautan resmi YouTube `5XteEv2MU_g`, `Ixm0NVVzniM`, `Q_JAmcKSFB0` + video lokal `kentrung.mp4` + galeri foto dokumen).
- Ekspor Spasial: Format ekspor wajib menghasilkan GeoJSON RFC 7946 dan CSV WKT yang valid dan siap dibuka di QGIS dan ArcGIS.

---

### Task 1: Ekstraksi Data Spasial & Multimedia (`tools/extract_data.py`)

**Files:**
- Create: `tools/extract_data.py`
- Create: `data/sastra_data.js`
- Create: `data/transkrip_data.js`
- Create: `media/banyumas/` (direktori foto)
- Create: `media/wonosobo/` (direktori foto)
- Test: `tools/test_data_integrity.py`

**Interfaces:**
- Produces: 
  - `window.SASTRA_DATA = { ring1: [...], ring2: [...], ring3: [...], ring4: [...], kabupaten: [...] }`
  - `window.TRANSKRIP_DATA = { kentrung: [...], babad_pasir_luhur: [...], othok_obrol: [...] }`

- [ ] **Step 1: Tulis tes verifikasi integritas data**

Buat `tools/test_data_integrity.py` yang memeriksa apakah `data/sastra_data.js` dan `data/transkrip_data.js` dihasilkan dengan struktur lengkap:
- Ring 1 = 3 entri
- Ring 2 = 44 entri
- Ring 3 = 44 entri
- Ring 4 = 41 entri
- Kabupaten = 35 entri
- Koordinat latitude dan longitude terisi valid di Jawa Tengah (-8.5 s.d. -6.3, 108.5 s.d. 111.8).

- [ ] **Step 2: Jalankan tes untuk memastikan gagal sebelum implementasi**

Jalankan: `python tools/test_data_integrity.py`
Ekspektasi: Gagal karena file `data/sastra_data.js` belum ada.

- [ ] **Step 3: Implementasikan skrip ekstraktor `tools/extract_data.py`**

Tulis `tools/extract_data.py` untuk:
1. Membaca `Peta_Sastra_Lisan_Jawa_Tengah_Fondasi_Terverifikasi.xlsx` seluruh sheet (Ring 1, Ring 2, Ring 3, Ring 4, Peta 35 Kab-Kota).
2. Mengekstrak gambar dokumentasi dari `Laporan Revitalisasi Maca Babad Pasir Luhur.docx` ke `media/banyumas/` dan dari `Ringkasan Laporan Othok Obrol.docx` ke `media/wonosobo/`.
3. Membaca `transkripsi kentrung.docx` dan mengekstrak teks segmen lakon.
4. Memasukkan koordinat WGS84 presisi untuk Ring 1 dan koordinat ber-jittering radial untuk Ring 2 dan Ring 3.
5. Menyematkan tautan YouTube dan media lokal untuk Ring 1.
6. Menulis `data/sastra_data.js` dan `data/transkrip_data.js`.

- [ ] **Step 4: Jalankan ekstraktor dan verifikasi dengan tes**

Jalankan: `python tools/extract_data.py ; python tools/test_data_integrity.py`
Ekspektasi: PASS dengan 3 Ring 1, 44 Ring 2, 44 Ring 3, 41 Ring 4, dan 35 Kabupaten.

- [ ] **Step 5: Commit data dan tools ekstraksi**

```bash
git add tools/ data/ media/
git commit -m "feat(data): extract and validate oral literature dataset and multimedia assets"
```

---

### Task 2: Pembangkit Batas Spasial 35 Kabupaten/Kota (`data/jateng_kabupaten.js`)

**Files:**
- Create: `tools/generate_boundaries.py`
- Create: `data/jateng_kabupaten.js`
- Test: `tools/test_boundaries.py`

**Interfaces:**
- Produces: `window.JATENG_KABUPATEN = { type: "FeatureCollection", features: [...] }`
- Atribut tiap feature: `kode_wilayah`, `nama_kabupaten`, `karesidenan`, `zona_ekologi`, `total_sastra`, `r1_count`, `r2_count`, `r3_count`.

- [ ] **Step 1: Tulis tes verifikasi poligon batas wilayah**

Buat `tools/test_boundaries.py` untuk memvalidasi bahwa `data/jateng_kabupaten.js` berisi 35 fitur poligon/multipoligon dengan atribut nama kabupaten yang cocok dengan daftar 35 Kab/Kota di Jawa Tengah.

- [ ] **Step 2: Jalankan tes untuk memastikan gagal**

Jalankan: `python tools/test_boundaries.py`
Ekspektasi: Gagal karena `data/jateng_kabupaten.js` belum ada.

- [ ] **Step 3: Implementasikan `tools/generate_boundaries.py`**

Menghasilkan batas wilayah spasial GeoJSON 35 Kabupaten/Kota Jawa Tengah lengkap dengan koordinat batas administratif dan atribut agregat sastra lisan.

- [ ] **Step 4: Jalankan pembangkit batas dan jalankan tes verifikasi**

Jalankan: `python tools/generate_boundaries.py ; python tools/test_boundaries.py`
Ekspektasi: PASS (35 kabupaten/kota terverifikasi).

- [ ] **Step 5: Commit batas wilayah spasial**

```bash
git add tools/test_boundaries.py tools/generate_boundaries.py data/jateng_kabupaten.js
git commit -m "feat(geo): add GeoJSON boundaries and aggregates for 35 regencies in Central Java"
```

---

### Task 3: Modul Ekspor GIS Universal (`js/export-gis.js`)

**Files:**
- Create: `js/export-gis.js`
- Test: `tools/test_gis_export.py`

**Interfaces:**
- Produces: 
  - `window.GISExporter.downloadGeoJSON(data)`
  - `window.GISExporter.downloadCSV(data)`
  - `window.GISExporter.downloadBoundaryGeoJSON(boundaryData)`

- [ ] **Step 1: Tulis tes verifikasi logika ekspor GIS**

Buat `tools/test_gis_export.py` yang memvalidasi struktur output GeoJSON (RFC 7946) dan output CSV (header `latitude`, `longitude`, `wkt_geom` dan kutipan aman) terhadap dataset `SASTRA_DATA`.

- [ ] **Step 2: Jalankan tes untuk memastikan gagal sebelum modul dibuat**

Jalankan: `python tools/test_gis_export.py`
Ekspektasi: Gagal.

- [ ] **Step 3: Implementasikan `js/export-gis.js`**

Tulis logika generator berkas ekspor di sisi peramban:
1. `downloadGeoJSON()`: Membuat Blob format `application/geo+json` dengan `FeatureCollection`, proyeksi WGS84 EPSG:4326.
2. `downloadCSV()`: Membuat Blob format `text/csv` dengan kolom lengkap termasuk WKT `POINT(lng lat)`.
3. `downloadBoundaryGeoJSON()`: Menyimpan GeoJSON poligon 35 Kab/Kota ber-atribut agregat.
4. Memicu pengunduhan otomatis lewat elemen `<a download=...>` virtual.

- [ ] **Step 4: Jalankan tes verifikasi ekspor**

Jalankan: `python tools/test_gis_export.py`
Ekspektasi: PASS.

- [ ] **Step 5: Commit modul ekspor GIS**

```bash
git add js/export-gis.js tools/test_gis_export.py
git commit -m "feat(gis): add universal GeoJSON and CSV export engine for QGIS and ArcGIS"
```

---

### Task 4: Kerangka Tata Letak HTML & Gaya Neobrutalisme (`index.html`, `css/style.css`)

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Test: `tools/test_ui_structure.py`

**Interfaces:**
- Menghasilkan elemen DOM: `#map`, `#header`, `#floating-panel`, `#detail-drawer`, `#export-modal`, `#analytics-modal`, `#methodology-modal`.
- CSS Classes: `.neo-card`, `.neo-btn`, `.neo-badge`, `.neo-shadow`, `.neo-border`, `.tab-btn`, `.drawer-open`.

- [ ] **Step 1: Tulis tes struktur DOM HTML**

Buat `tools/test_ui_structure.py` yang memeriksa keberadaan ID-ID penting (`#map`, `#search-input`, `#ring-filters`, `#detail-drawer`, dll.) dan pemuatan berkas JS/CSS secara mandiri.

- [ ] **Step 2: Jalankan tes untuk memastikan gagal**

Jalankan: `python tools/test_ui_structure.py`
Ekspektasi: Gagal.

- [ ] **Step 3: Tulis `index.html` dan `css/style.css`**

1. `index.html`: Kerangka lengkap Neobrutalisme:
   - Header bar dengan stempel `[KORPUS 2026]` dan 4 stat counters.
   - Tombol cepat: Ekspor GIS, Analitik, dan Metodologi.
   - Floating filter panel di kiri: pencarian, filter ring (Terverifikasi, Terverifikasi Teks, Perlu Verifikasi), filter karesidenan, filter ekologi, toggle poligon.
   - Sliding Detail Drawer di kanan dengan 5 tab: Profil & Ekologi, Formula Tuturan, Multimedia (YouTube + Video Lokal + Foto), Transkrip Naskah, Pustaka Ilmiah.
   - Modal dialogs untuk Ekspor GIS, Grafik Analitik, dan Tabel Ring 4 Eksklusi.
2. `css/style.css`:
   - Gaya Neobrutalisme sejati: garis tepi 2.5-3px hitam pekat, drop-shadow 4px kaku `#000`, transisi klik geser (*active press effect*).
   - Palet warna: Kuning Emas (`#FFE600`), Biru Cyan (`#00E5FF`), Oranye (`#FF6B35`), Merah (`#FF3366`), Ungu (`#A78BFA`), Latar (`#FFFDF9`).

- [ ] **Step 4: Jalankan tes struktur DOM**

Jalankan: `python tools/test_ui_structure.py`
Ekspektasi: PASS.

- [ ] **Step 5: Commit kerangka UI & styling**

```bash
git add index.html css/style.css tools/test_ui_structure.py
git commit -m "feat(ui): implement Neobrutalism HTML structure and stylesheet"
```

---

### Task 5: Pengontrol Peta Leaflet & Layer Spasial (`js/map-layers.js`)

**Files:**
- Create: `js/map-layers.js`
- Test: `tools/test_map_layers.py`

**Interfaces:**
- Produces:
  - `window.MapLayers.initMap(containerId)`
  - `window.MapLayers.renderMarkers(items, onMarkerClick)`
  - `window.MapLayers.toggleBoundaries(show)`
  - `window.MapLayers.flyToLocation(lat, lng, zoom)`

- [ ] **Step 1: Tulis tes logika marker dan layer**

Buat `tools/test_map_layers.py` untuk menguji generator HTML custom marker Neobrutalis (lencana emas berdenyut untuk Ring 1, lingkaran biru untuk Ring 2, kotak oranye untuk Ring 3) serta kalkulasi warna choropleth kabupaten.

- [ ] **Step 2: Jalankan tes untuk memastikan gagal**

Jalankan: `python tools/test_map_layers.py`
Ekspektasi: Gagal.

- [ ] **Step 3: Implementasikan `js/map-layers.js`**

1. Inisialisasi peta Leaflet berpusat di Jawa Tengah `[-7.2, 110.1]`, zoom 8.
2. Layer dasar: CartoDB Positron dengan fallback OSM.
3. Kustom DivIcon Neobrutalis dengan stiker kontras dan animasi CSS.
4. Layer Poligon Choropleth 35 Kabupaten/Kota dengan tooltip agregat.
5. Handler interaksi klik marker yang memanggil callback `onMarkerClick(item)`.

- [ ] **Step 4: Jalankan tes logika layer**

Jalankan: `python tools/test_map_layers.py`
Ekspektasi: PASS.

- [ ] **Step 5: Commit modul map layers**

```bash
git add js/map-layers.js tools/test_map_layers.py
git commit -m "feat(map): implement Leaflet map controller with custom Neobrutalist markers"
```

---

### Task 6: Pengendali Aplikasi Utama & Integrasi Multimedia (`js/app.js`)

**Files:**
- Create: `js/app.js`
- Modify: `index.html` (memastikan urutan pemuatan skrip sempurna)
- Test: `tools/test_app_integration.py`

**Interfaces:**
- Mengintegrasikan: `SASTRA_DATA`, `JATENG_KABUPATEN`, `TRANSKRIP_DATA`, `MapLayers`, dan `GISExporter`.
- Mengelola *state*: `activeFilters`, `selectedTradisi`, `activeTab`.

- [ ] **Step 1: Tulis tes integrasi aplikasi**

Buat `tools/test_app_integration.py` untuk menguji alur logika filter (filter ring, karesidenan, kata kunci) dan generator konten tab drawer (termasuk embed video YouTube, galeri foto, dan pencarian bait transkrip).

- [ ] **Step 2: Jalankan tes untuk memastikan gagal**

Jalankan: `python tools/test_app_integration.py`
Ekspektasi: Gagal.

- [ ] **Step 3: Implementasikan `js/app.js`**

1. Filter Engine: Reaktif memperbarui titik marker pada peta saat pencarian diketik atau filter dicentang.
2. Detail Drawer Manager:
   - Render tab Profil & Ekologi (maestro, usia, desa, karesidenan, narasi).
   - Render tab Formula Tuturan (mantra, tembang, suluk, kidungan, parikan).
   - Render tab Multimedia:
     - Kentrung Blora: YouTube embed `5XteEv2MU_g` + opsi video lokal `kentrung.mp4` + cover.
     - Maca Babad Pasir Luhur: YouTube embed `Ixm0NVVzniM` + galeri foto dokumen revitalisasi.
     - Wayang Othok Obrol: YouTube embed `Q_JAmcKSFB0` + galeri foto maestro Ki Makim & wayang.
   - Render tab Transkrip Naskah: Penampil transkrip per bait dengan live filter kata kunci.
   - Render tab Pustaka Ilmiah: Sitasi riset Balai Bahasa Jateng.
3. Modal Dialog Manager:
   - Tombol Ekspor GIS: Menjalankan ekspor GeoJSON, CSV, atau Agregat.
   - Tombol Analitik: Visualisasi distribusi karesidenan & zona ekologi.
   - Tombol Metodologi: Menampilkan tabel 41 entri Ring 4 (Eksklusi Non-Sastra).

- [ ] **Step 4: Jalankan tes integrasi aplikasi**

Jalankan: `python tools/test_app_integration.py`
Ekspektasi: PASS.

- [ ] **Step 5: Commit logika aplikasi utama**

```bash
git add js/app.js index.html tools/test_app_integration.py
git commit -m "feat(app): connect filters, detail drawer, multimedia embeds, and modals"
```

---

### Task 7: Pengujian Menyeluruh, Verifikasi Antarmuka & Berkas Ekspor

**Files:**
- Create: `tools/verify_all.py`
- Test: Pengujian peramban lokal & validasi berkas GIS

- [ ] **Step 1: Tulis skrip verifikasi otomatis terintegrasi `tools/verify_all.py`**

Skrip menguji:
1. Keberadaan seluruh file kunci (`index.html`, `style.css`, `app.js`, `map-layers.js`, `export-gis.js`, `sastra_data.js`, `jateng_kabupaten.js`, `transkrip_data.js`).
2. Jumlah data: 3 Ring 1, 44 Ring 2, 44 Ring 3, 41 Ring 4, 35 Kab/Kota.
3. Struktur GeoJSON ekspor memenuhi spesifikasi RFC 7946.
4. Validasi media: file gambar galeri Banyumas & Wonosobo dan cover video Kentrung tersedia.

- [ ] **Step 2: Jalankan verifikasi otomatis**

Jalankan: `python tools/verify_all.py`
Ekspektasi: Seluruh status bertanda [PASS] dan tidak ada anomali.

- [ ] **Step 3: Uji jalankan server lokal dan konfirmasi rendering di browser**

Jalankan local server HTTP sementara dan verifikasi aksesibilitas berkas melalui browser:
`python -m http.server 8000`

- [ ] **Step 4: Commit dokumentasi akhir & hasil verifikasi**

```bash
git add tools/verify_all.py
git commit -m "test: complete end-to-end verification and QA testing"
```
