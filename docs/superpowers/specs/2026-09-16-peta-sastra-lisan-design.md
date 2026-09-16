# Design Specification: Atlas Digital Peta Sastra Lisan Jawa Tengah

- **Tanggal Dokumen:** 2026-09-16
- **Status:** Approved by User / Ready for Implementation Plan
- **Gaya Desain Antarmuka:** Neobrutalisme Kontemporer (*punchy borders, bold colors, hard drop-shadows*)
- **Target Platform:** Standalone Web GIS Application (Offline-ready, No-build, Zero-dependency runtime) + Ekspor Data Spasial QGIS/ArcGIS

---

## 1. Latar Belakang & Tujuan

Proyek ini bertujuan memvisualisasikan data riset dan kurasi pemetaan sastra lisan se-Provinsi Jawa Tengah yang dihimpun oleh Balai Bahasa Provinsi Jawa Tengah ke dalam sebuah sistem **Atlas Digital Peta Sastra Lisan** yang interaktif, informatif, dan berkarakter visual kuat (*Neobrutalisme*).

Sistem ini menjembatani dua kebutuhan utama:
1. **Publik & Peneliti Sastra:** Menjelajahi persebaran sastra lisan Jawa Tengah secara visual, membaca kutipan tuturan/formula teks (mantra, tembang macapat, suluk, parikan), menyimak transkrip naskah, serta menikmati dokumentasi multimedia (video rekaman pertunjukan dan galeri foto maestro).
2. **Akademisi & Praktisi Geospasial (GIS):** Menyediakan fasilitas ekspor data spasial terstandarisasi (GeoJSON dan CSV koordinat WKT) yang dapat langsung diolah dan dianalisis di perangkat lunak SIG profesional seperti **QGIS** dan **ArcGIS Pro/Online**.

---

## 2. Kategori & Sumber Data

Seluruh data bersumber dari berkas kurasi resmi di lingkungan kerja:
- `Peta_Sastra_Lisan_Jawa_Tengah_Fondasi_Terverifikasi.xlsx`
- Dokumen Instrumen Pemetaan:
  - `INSTRUMEN PEMETAAN SASTRA LISAN - Kentrung.docx`
  - `INSTRUMEN PEMETAAN SASTRA LISAN - Maca Babad Pasir Luhur.docx`
  - `INSTRUMEN PEMETAAN SASTRA LISAN - Wayang Othok Obrol.docx`
- Dokumen Laporan & Transkrip:
  - `transkripsi kentrung.docx`
  - `Laporan Revitalisasi Maca Babad Pasir Luhur.docx` (memuat 53 foto dokumentasi)
  - `Ringkasan Laporan Othok Obrol.docx` (memuat 6 foto dokumentasi)
  - `Menelusuri Jejak Blora (Artikel Kentrung).pdf`
- Berkas Media: `kentrung.mp4`, `kentrung-Cover.jpg`, `GMT20260909-020218_Recording_1920x1080.mp4`

### Klasifikasi Ring Pemetaan
Sesuai arahan pengguna, terminologi yang digunakan adalah:
1. **Ring 1 — "Terverifikasi" (3 Tradisi Utama):**
   - **Kentrung Blora** (Kabupaten Blora, Desa Bogorejo; Maestro: Mbah Lasiyo, 75 tahun; Formula: parikan, macapat, dialog carita).
   - **Maca Babad Pasir Luhur** (Kabupaten Banyumas, Dusun Cibun Desa Sunyalangu Karanglewas; Maestro: Santoso Puji Irawan, 45 tahun; Formula: lantunan sekar macapat naskah babad tertua Banyumas).
   - **Wayang Othok Obrol** (Kabupaten Wonosobo, Desa Selokromo Leksono; Maestro: Ki Makim Kartosudarmo, 68 tahun; Formula: teater tutur pakeliran, narasi dalang, dialog tokoh, suluk).
   - *Perlakuan Khusus Ring 1:* Seluruh 3 tradisi ini mendapatkan fitur multimedia penuh (video/galeri foto maestro beresolusi tinggi yang diekstrak dari dokumen laporan revitalisasi, tab transkripsi teks, dan profil sanggar pewaris).
2. **Ring 2 — "Terverifikasi Teks" (44 Tradisi):**
   - Tradisi yang telah terbukti secara tekstual/ilmiah memiliki formula tuturan (mantra, tembang, suluk, parikan, kidungan) di berbagai karesidenan dan zona ekologi DAS/pegunungan/pesisir.
3. **Ring 3 — "Perlu Verifikasi" (44 Tradisi):**
   - Ritus adat atau pertunjukan komunal yang masuk daftar prioritas observasi lapangan lanjutan untuk pembuktian formula teks lisan baku.
4. **Ring 4 — "Eksklusi Non-Sastra" (41 Entri Budaya):**
   - Objek budaya kriya tekstil (batik), kuliner tradisional (apem, gethuk), dan permainan fisik tanpa unsur sastra tutur yang dikeluarkan dari peta dengan dasar telaah ilmiah.
5. **Peta 35 Kabupaten/Kota Se-Jawa Tengah:**
   - Memuat kode wilayah resmi BPS/Kemendagri (33.01 s.d. 33.76), wilayah karesidenan, deskripsi lanskap zona ekologi budaya, dan agregat jumlah tradisi per wilayah.

---

## 3. Arsitektur Teknis & Struktur Berkas

Aplikasi mengadopsi arsitektur **Single Page Application (SPA) Tanpa Build Step** agar pengguna dapat langsung membuka file `index.html` pada peramban peranti lokal secara instan.

```text
c:/Users/user/Videos/sastra lisan/
├── index.html                           # Kerangka UI, layout peta & detail drawer
├── css/
│   └── style.css                        # Aturan visual Neobrutalisme & kustomisasi Leaflet
├── js/
│   ├── app.js                           # State manager, event listeners, render UI, audio/video handler
│   ├── map-layers.js                    # Leaflet controller: tile layers, GeoJSON polygons, custom markers
│   └── export-gis.js                    # Generator ekspor file GeoJSON & CSV (QGIS / ArcGIS)
├── data/
│   ├── sastra_data.js                   # JSON master: Ring 1 (Terverifikasi), Ring 2, Ring 3, Ring 4
│   ├── jateng_kabupaten.js              # Batas wilayah spasial GeoJSON 35 Kab/Kota Jateng
│   └── transkrip_data.js                # Korpus teks transkripsi (Kentrung Blora, Maca Babad, Othok Obrol)
├── media/
│   ├── kentrung.mp4                     # Video rekaman Kentrung Blora
│   ├── kentrung-Cover.jpg               # Cover seni pertunjukan Kentrung
│   ├── banyumas/                        # Foto dokumentasi maestro & ritus Maca Babad Pasir Luhur
│   └── wonosobo/                        # Foto dokumentasi wayang tutur & maestro Ki Makim
├── docs/
│   └── superpowers/specs/
│       └── 2026-09-16-peta-sastra-lisan-design.md
└── tools/
    └── extract_data.py                  # Skrip konversi otomatis dari Excel & Docx ke JavaScript
```

---

## 4. Sistem Desain Neobrutalisme

### Palet Warna & Token Visual
- **Background Utama Kanvas:** `#FFFDF9` (Off-white hangat bertekstur kertas bersih).
- **Warna Identitas Kategori:**
  - 🟡 **Ring 1 (Terverifikasi):** `#FFE600` (Kuning Kenari cerah dengan teks hitam pekat).
  - 🔵 **Ring 2 (Terverifikasi Teks):** `#00E5FF` (Cyan / Biru Elektrik tajam).
  - 🟠 **Ring 3 (Perlu Verifikasi):** `#FF6B35` (Oranye Tangelo mencolok).
  - 🔴 **Ring 4 (Eksklusi):** `#FF3366` (Rose Red / Hot Pink).
  - 🟣 **Kabupaten/Kota (Wilayah):** `#A78BFA` (Ungu Pastel terang).
- **Garis Pembatas (*Borders*):** Solid hitam murni `#000000` dengan ketebalan 2.5px hingga 3px.
- **Bayangan (*Hard Drop Shadows*):** `box-shadow: 4px 4px 0px #000000` (tanpa blur).
- **Interaksi Hover:** `transform: translate(2px, 2px); box-shadow: 2px 2px 0px #000000;`.
- **Tipografi:** Sans-serif tegas berbobot tebal (*Heavy display headings* seperti Space Grotesk / Inter Black) dengan kontras keterbacaan tinggi.

---

## 5. Komponen Antarmuka & Alur Pengguna

### A. Neobrutalist Header & Live Stat Counters
- Judul banner bergaya stempel tebal: **"ATLAS SASTRA LISAN JAWA TENGAH" [KORPUS 2026]**.
- Metrik interaktif berbingkai stiker:
  - `3 Terverifikasi`
  - `44 Terverifikasi Teks`
  - `44 Perlu Verifikasi`
  - `35 Kab/Kota`
- Bilah aksi cepat:
  - **[💾 Ekspor GIS]**: Menampilkan modal unduh file spasial.
  - **[📊 Analitik Wilayah]**: Menampilkan modal perbandingan karesidenan & zona ekologi.
  - **[ℹ️ Metodologi & Ring 4]**: Menampilkan daftar eksklusi beserta argumen ilmiahnya.

### B. Floating Control Panel (Filter & Pencarian)
- **Input Pencarian Instan:** Pencarian dinamis mencakup nama sastra lisan, nama maestro, kabupaten/kota, atau kata kunci tuturan.
- **Filter Ring Validasi:** Tombol *checkbox pill* (Terverifikasi, Terverifikasi Teks, Perlu Verifikasi).
- **Filter Karesidenan:** Dropdown/Pills 6 Karesidenan (Banyumas, Kedu, Pati/Muria, Pekalongan, Semarang, Surakarta).
- **Filter Zona Ekologi Budaya:** Filter lanskap geokultural (DAS Serayu, Karst Kendeng, Kaki Slamet, Pesisir Pantura, dll.).
- **Toggle Batas Wilayah 35 Kab/Kota:** Mengaktifkan/menonaktifkan layer poligon choropleth kepadatan sastra lisan.

### C. Kanvas Peta Interaktif (Leaflet Engine)
- **Tile Layer Dasar:** CartoDB Positron / OpenStreetMap dengan kontras tinggi.
- **Marker Kustom Neobrutalis:**
  - *Terverifikasi (Ring 1):* Pin Emas bertabur bintang tebal dengan animasi pulsa halus.
  - *Terverifikasi Teks (Ring 2):* Pin Lingkaran Biru berikon pena/buku bertepi hitam.
  - *Perlu Verifikasi (Ring 3):* Pin Persegi Oranye berikon kaca pembesar bertepi hitam.
- **Interaksi Klik:** Menggeser kamera peta (*fly-to*) secara halus ke titik sasaran dan membuka Sliding Drawer di sisi kanan.

### D. Sliding Detail Drawer (Panel Multimedia & Transkrip)
Drawer meluncur dari sisi kanan dengan lebar responsif (450–520px) yang memuat 5 tab navigasi:
1. **Tab Profil & Ekologi:** Deskripsi wilayah lengkap (Desa, Kec, Kab, Karesidenan, Zona Ekologi), profil Maestro, komunitas pewaris, dan narasi kurasi Balai Bahasa.
2. **Tab Formula Tuturan:** Klasifikasi dan kutipan teks tuturan (mantra, tembang, suluk, parikan, kidungan).
3. **Tab Multimedia (Setara untuk Seluruh Ring 1):**
   - *Kentrung Blora:* Pemutar video `kentrung.mp4` dengan poster cover `kentrung-Cover.jpg`.
   - *Maca Babad Pasir Luhur:* Galeri foto dokumentasi ritus dan maestro Santoso Puji Irawan yang diekstrak dari laporan resmi.
   - *Wayang Othok Obrol:* Galeri foto pementasan wayang tutur dan maestro Ki Makim Kartosudarmo yang diekstrak dari laporan resmi.
4. **Tab Transkrip Naskah:** Penampil teks transkripsi interaktif per segmen tuturan dilengkapi kotak pencarian kata kunci dalam bait.
5. **Tab Pustaka Ilmiah:** Rujukan dokumen riset, artikel jurnal, dan catatan verifikasi ilmiah.

---

## 6. Modul Interoperabilitas Geospasial (QGIS & ArcGIS)

Modul `export-gis.js` menyediakan fungsi ekspor langsung di peramban:
1. **`sastra_lisan_jateng.geojson` (Point Features):**
   - Memuat seluruh titik tradisi sastra lisan WGS84 (EPSG:4326).
   - Atribut lengkap: `id`, `nama`, `ring_kategori` ("Terverifikasi", "Terverifikasi Teks", "Perlu Verifikasi"), `ring_level`, `kabupaten`, `karesidenan`, `zona_ekologi`, `maestro`, `formula_teks`, `sumber_ilmiah`.
   - 100% kompatibel dengan *drag-and-drop* pada kanvas QGIS dan *Add Data* pada ArcGIS Pro.
2. **`sastra_lisan_jateng_coords.csv` (Delimited XY Data):**
   - Format CSV ber-encoding UTF-8 dengan kolom: `id`, `nama`, `ring`, `kabupaten`, `karesidenan`, `latitude`, `longitude`, `wkt_geom` (`POINT(lng lat)`).
   - Siap dipakai pada fitur *Add Delimited Text Layer* di QGIS dan *Display XY Data* di ArcGIS.
3. **`jateng_35_kabupaten_agregat.geojson` (Polygon Features):**
   - Poligon batas administratif 35 kabupaten/kota yang telah digabungkan (*join*) dengan atribut statistik: `total_sastra_lisan`, `jumlah_terverifikasi`, `jumlah_terverifikasi_teks`, `jumlah_perlu_verifikasi`.

---

## 7. Penanganan Kasus Khusus & Algoritma Spasial

1. **Jittering Spasial Deterministik:**
   Untuk tradisi Ring 2 dan 3 yang berbasis kabupaten/kota (belum memiliki koordinat GPS spesifik tingkat RT/RW), koordinat titik disebar secara radial/spiral sejauh 1–2 km dari titik pusat (*centroid*) kabupaten agar tidak ada marker yang saling menimpa.
2. **Offline-Ready & Fallback:**
   Semua data disimpan dalam variabel JavaScript global di folder `data/`. Jika pengguna membuka `index.html` secara lokal via `file:///`, seluruh peta, filter, data naskah, dan galeri foto tetap berfungsi optimal.
3. **Pencarian Cerdas Toleran:**
   Fungsi pencarian mengabaikan huruf besar/kecil (*case-insensitive*) dan melakukan normalisasi karakter lokal Jawa.

---

## 8. Rencana Verifikasi & Pengujian

1. **Integritas Data:**
   - Memastikan 3 entri Ring 1 (Terverifikasi), 44 entri Ring 2 (Terverifikasi Teks), 44 entri Ring 3 (Perlu Verifikasi), 41 entri Ring 4 (Eksklusi), dan 35 entri Kabupaten/Kota terekstraksi secara utuh tanpa ada nilai `null` pada kolom kritis.
2. **Uji Validitas Geospasial:**
   - Memeriksa struktur JSON berkas ekspor `sastra_lisan_jateng.geojson` sesuai spesifikasi RFC 7946.
3. **Uji Fungsional Antarmuka:**
   - Filter Ring 1, Ring 2, Ring 3, Karesidenan, dan Zona Ekologi merespons dengan pembaruan marker pada peta secara seketika.
   - Klik marker berhasil membuka sliding drawer dan memuat data tab secara akurat.
   - Pemutar video Kentrung dan galeri foto Maca Babad & Wayang Othok Obrol tampil dan berfungsi dengan mulus.
   - Tombol ekspor GIS menghasilkan unduhan berkas GeoJSON dan CSV secara tepat.
