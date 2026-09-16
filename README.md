# Peta Sastra Lisan di Jawa Tengah

Sistem Informasi Geospasial (Web GIS) Interaktif Pemetaan Sastra Lisan se-Jawa Tengah berbasis kurasi data Balai Bahasa Provinsi Jawa Tengah.

Aplikasi ini menyajikan visualisasi persebaran sastra tutur lisan di 35 Kabupaten/Kota Jawa Tengah dengan pendekatan **Ring Validasi Empiris** serta antarmuka modern bertema **Neobrutalisme**.

---

## 🌟 Fitur Utama

1. **Peta Interaktif Neobrutalisme (Leaflet GIS):**
   - Pemetaan titik persebaran 91 tradisi tutur di seluruh 35 Kabupaten/Kota Jawa Tengah.
   - Peta dasar bersih (*ESRI Light Gray Canvas*, *OpenStreetMap*, dan *ESRI Topo*) tanpa watermark atau dependensi API key berbayar.
   - **Sorotan Wilayah Presisi (*Single Region Spotlight*):** Mengklik tradisi (misal *Braen* atau *Cowongan*) secara otomatis menyorot batas administratif resmi kabupaten bersangkutan (*Kabupaten Purbalingga*, *Kabupaten Cilacap*, dst.) dengan garis tipis elegan dan isian warna kontras.

2. **Ring Validasi Ilmiah:**
   - **⭐ Ring 1: Terverifikasi (3 Tradisi):** *Kentrung Blora*, *Maca Babad Pasir Luhur* (Banyumas), dan *Wayang Othok Obrol* (Wonosobo) dilengkapi validasi lapangan, GPS presisi, audio-video resmi, dan transkrip fonemik.
   - **📖 Ring 2: Terverifikasi Teks (44 Tradisi):** Terbukti secara tekstual ilmiah memiliki formula tuturan (mantra, tembang, suluk, caturan).
   - **🔍 Ring 3: Perlu Verifikasi (44 Tradisi):** Ritus adat komunal yang menjadi prioritas penelitian lapangan lebih lanjut.
   - **Ring 4: Eksklusi Non-Sastra (40 Objek):** Objek budaya fisik/kriya/kuliner yang resmi dipisahkan untuk menjaga kemurnian korpus sastra tutur.

3. **Dokumentasi Multimedia & Transkrip:**
   - Pemutar video YouTube resmi dan opsi video lokal.
   - Galeri foto dokumentasi lapangan (termasuk 50 foto dokumentasi Kentrung Blora dari lapangan).
   - Transkripsi fonemik interaktif dengan fitur pencarian kata langsung dalam naskah.

4. **Rujukan Ilmiah & Sitasi Interaktif:**
   - Tombol langsung ke artikel jurnal / DOI resmi.
   - Pencarian otomatis naskah rujukan di Google Scholar dalam satu klik.

5. **Interoperabilitas Geospasial (QGIS & ArcGIS Ready):**
   - Ekspor data titik koordinat ke format **GeoJSON (RFC 7946)**.
   - Ekspor data tabel koordinat ke format **CSV Geospasial** dengan kolom geometri **WKT POINT(lng lat)**.
   - Ekspor batas agregat 35 wilayah administratif poligon.

---

## 🚀 Cara Menjalankan & Membagikan

### 1. Membuka Secara Langsung (Lokal)
Cukup unduh repositori ini (atau berkas .zip), lalu klik dua kali berkas index.html pada peramban web apa pun (Google Chrome, Microsoft Edge, Mozilla Firefox). Tidak memerlukan server backend khusus.

### 2. Berbagi Secara Daring (GitHub Pages)
Repositori ini dirancang siap pakai untuk **GitHub Pages**:
1. Buka tab **Settings** di repositori GitHub bpjt/Peta-Sastra-Lisan-Jateng.
2. Pilih menu **Pages** di bilah navigasi sebelah kiri.
3. Di bawah **Build and deployment** > **Branch**, pilih branch main dan folder /(root), lalu klik **Save**.
4. Dalam hitungan detik, peta ini akan aktif dan dapat diakses publik di:
   https://bbpjt.github.io/Peta-Sastra-Lisan-Jateng/

---

## 📁 Struktur Direktori

`
├── index.html           # Berkas antarmuka utama aplikasi (SPA)
├── css/
│   └── style.css        # Desain gaya tema Neobrutalisme
├── js/
│   ├── app.js           # Pengendali logika antarmuka, filter, dan laci detail
│   ├── map-layers.js    # Pengontrol peta Leaflet & sorotan spasial
│   └── export-gis.js    # Mesin ekspor data untuk QGIS & ArcGIS
├── data/
│   ├── sastra_data.js       # Basis data master 91 sastra lisan & metadata
│   ├── jateng_kabupaten.js  # Batas poligon administratif resmi 35 wilayah (GeoBoundaries)
│   └── transkrip_data.js    # Korpus transkripsi fonemik & naskah tutur
├── media/               # Galeri foto dokumentasi lapangan (Kentrung, Banyumas, Wonosobo)
├── lib/leaflet/         # Pustaka Leaflet mandiri (offline bundle)
└── gis_exports/         # Berkas GeoJSON & CSV WKT siap pakai
`

---

&copy; 2026 Balai Bahasa Provinsi Jawa Tengah &mdash; Badan Pengembangan dan Pembinaan Bahasa, Kementerian Pendidikan Dasar dan Menengah.
