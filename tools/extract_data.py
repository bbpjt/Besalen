import os
import re
import json
import math
import zipfile
import openpyxl
import docx

# Centroid coordinates for all 35 Kabupaten/Kota in Central Java
KAB_COORDS = {
    "Kabupaten Cilacap": (-7.545, 108.995),
    "Kabupaten Banyumas": (-7.455, 109.245),
    "Kabupaten Purbalingga": (-7.345, 109.355),
    "Kabupaten Banjarnegara": (-7.385, 109.685),
    "Kabupaten Kebumen": (-7.655, 109.665),
    "Kabupaten Purworejo": (-7.715, 110.015),
    "Kabupaten Wonosobo": (-7.365, 109.915),
    "Kabupaten Magelang": (-7.535, 110.215),
    "Kabupaten Boyolali": (-7.525, 110.605),
    "Kabupaten Klaten": (-7.705, 110.605),
    "Kabupaten Sukoharjo": (-7.675, 110.835),
    "Kabupaten Wonogiri": (-7.825, 110.925),
    "Kabupaten Karanganyar": (-7.605, 110.955),
    "Kabupaten Sragen": (-7.425, 111.025),
    "Kabupaten Grobogan": (-7.115, 110.915),
    "Kabupaten Blora": (-7.015, 111.415),
    "Kabupaten Rembang": (-6.775, 111.345),
    "Kabupaten Pati": (-6.755, 111.035),
    "Kabupaten Kudus": (-6.805, 110.845),
    "Kabupaten Jepara": (-6.585, 110.675),
    "Kabupaten Demak": (-6.895, 110.645),
    "Kabupaten Semarang": (-7.215, 110.425),
    "Kabupaten Temanggung": (-7.275, 110.155),
    "Kabupaten Kendal": (-6.995, 110.185),
    "Kabupaten Batang": (-7.025, 109.845),
    "Kabupaten Pekalongan": (-7.055, 109.625),
    "Kabupaten Pemalang": (-7.015, 109.385),
    "Kabupaten Tegal": (-7.025, 109.155),
    "Kabupaten Brebes": (-7.015, 108.945),
    "Kota Magelang": (-7.475, 110.220),
    "Kota Surakarta": (-7.570, 110.825),
    "Kota Salatiga": (-7.330, 110.505),
    "Kota Semarang": (-6.995, 110.420),
    "Kota Pekalongan": (-6.890, 109.675),
    "Kota Tegal": (-6.870, 109.135)
}

def get_centroid(kab_name):
    clean_name = kab_name.strip()
    # Normalize common variations
    for k, v in KAB_COORDS.items():
        if k.lower() in clean_name.lower() or clean_name.lower() in k.lower():
            return v
    # Fallback to general Central Java center
    return (-7.15, 110.14)

def apply_jitter(base_lat, base_lng, item_index, seed_offset=0):
    """Deterministic spiral jitter so points in the same regency don't stack."""
    angle = (item_index * 137.508 + seed_offset) * (math.pi / 180.0)
    radius = 0.015 + (item_index % 4) * 0.010 # ~1.5km to 4.5km
    jitter_lat = round(base_lat + radius * math.sin(angle), 6)
    jitter_lng = round(base_lng + (radius / math.cos(math.radians(base_lat))) * math.cos(angle), 6)
    return jitter_lat, jitter_lng

def extract_media_photos():
    os.makedirs("media/banyumas", exist_ok=True)
    os.makedirs("media/wonosobo", exist_ok=True)
    
    banyumas_photos = []
    if os.path.exists("Laporan Revitalisasi Maca Babad Pasir Luhur.docx"):
        with zipfile.ZipFile("Laporan Revitalisasi Maca Babad Pasir Luhur.docx", "r") as z:
            for item in sorted(z.namelist()):
                if item.startswith("word/media/") and any(item.endswith(ext) for ext in [".png", ".jpeg", ".jpg"]):
                    fname = os.path.basename(item)
                    dest = os.path.join("media/banyumas", fname)
                    with open(dest, "wb") as f:
                        f.write(z.read(item))
                    banyumas_photos.append(f"media/banyumas/{fname}")
                    
    wonosobo_photos = []
    if os.path.exists("Ringkasan Laporan Othok Obrol.docx"):
        with zipfile.ZipFile("Ringkasan Laporan Othok Obrol.docx", "r") as z:
            for item in sorted(z.namelist()):
                if item.startswith("word/media/") and any(item.endswith(ext) for ext in [".png", ".jpeg", ".jpg"]):
                    fname = os.path.basename(item)
                    dest = os.path.join("media/wonosobo", fname)
                    with open(dest, "wb") as f:
                        f.write(z.read(item))
                    wonosobo_photos.append(f"media/wonosobo/{fname}")
                    
    return banyumas_photos, wonosobo_photos

def parse_kentrung_transcripts():
    segments = []
    if not os.path.exists("transkripsi kentrung.docx"):
        return segments
    doc = docx.Document("transkripsi kentrung.docx")
    current_section = "Pengantar"
    current_time = "00:00"
    
    for p in doc.paragraphs:
        txt = p.text.strip()
        if not txt:
            continue
        if any(w in txt.lower() for w in ["salam dan legitimasi", "bagian cerita", "kelahiran nabi ibrahim", "perdebatan", "penutup"]):
            current_section = txt
            continue
        time_match = re.search(r"\b(\d{2}:\d{2}(?:-\d{2}:\d{2})?)\b", txt)
        if time_match:
            current_time = time_match.group(1)
        segments.append({
            "section": current_section,
            "timestamp": current_time,
            "text": txt
        })
    return segments

def main():
    print("Extracting Sastra Lisan dataset...")
    banyumas_photos, wonosobo_photos = extract_media_photos()
    kentrung_transcripts = parse_kentrung_transcripts()
    
    excel_path = "Peta_Sastra_Lisan_Jawa_Tengah_Fondasi_Terverifikasi.xlsx"
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    
    # 1. Ring 1: Terverifikasi (3 items)
    s1 = wb["Ring 1 - Tradisi Emas"]
    ring1 = []
    for r in range(2, 5):
        row = [s1.cell(r, c).value for c in range(1, 15)]
        reg_id = row[0]
        nama = row[1]
        kab = row[2]
        kec = row[3]
        desa = row[4]
        maestro = row[5]
        usia_garis = row[6]
        komunitas = row[7]
        bentuk = row[8]
        musik = row[9]
        repertoar = row[10]
        
        # Specific spatial & multimedia metadata
        if "Blora" in nama:
            lat, lng = -6.9944, 111.3789
            karesidenan = "Karesidenan Pati (Muria Raya)"
            zona_ekologi = "Karst Kendeng & Hutan Jati Rimba"
            youtube_id = "5XteEv2MU_g"
            youtube_url = "https://youtu.be/5XteEv2MU_g"
            local_video = "kentrung.mp4"
            cover = "kentrung-Cover.jpg"
            gallery = ["kentrung-Cover.jpg"]
            ringkasan = "Kentrung Blora adalah seni tutur lisan berirama bernuansa Islam-Jawa pesisir dengan tabuhan terbang besar dan ketunthung. Penutur membawakan carita kepahlawanan dan religius dengan variasi kandha, janturan, dan caturan secara soliter."
            sumber = "Balai Bahasa Provinsi Jawa Tengah (2026); Transkripsi Fonemik 367 Segmen"
        elif "Babad Pasir Luhur" in nama:
            lat, lng = -7.3889, 109.1867
            karesidenan = "Karesidenan Banyumas"
            zona_ekologi = "Lembah DAS Serayu & Lereng Gunung Slamet"
            youtube_id = "Ixm0NVVzniM"
            youtube_url = "https://youtu.be/Ixm0NVVzniM"
            local_video = ""
            cover = banyumas_photos[0] if banyumas_photos else ""
            gallery = banyumas_photos[:12]
            ringkasan = "Maca Babad Pasir Luhur merupakan tradisi pelantunan tembang macapat (sekar macapat) dari naskah babad tertua di lembah Serayu lereng Gunung Cokol. Pertunjukan memadukan tradisi sastra tulis babad dengan sastra tutur jemblungan akapela."
            sumber = "Balai Bahasa Provinsi Jawa Tengah (2026); Laporan Revitalisasi Maca Babad Pasir Luhur"
        else: # Wayang Othok Obrol
            lat, lng = -7.4206, 109.8433
            karesidenan = "Karesidenan Kedu"
            zona_ekologi = "Dataran Tinggi Serayu Hulu & Pegunungan Dieng"
            youtube_id = "Q_JAmcKSFB0"
            youtube_url = "https://youtube.com/live/Q_JAmcKSFB0"
            local_video = ""
            cover = wonosobo_photos[0] if wonosobo_photos else ""
            gallery = wonosobo_photos
            ringkasan = "Wayang Othok Obrol adalah teater tutur wayang purwa komunal yang sangat langka di Selokromo Leksono Wonosobo. Menggunakan wayang kulit tua peninggalan leluhur, dalang menuturkan pakeliran, suluk, dan dialog tanpa gamelan lengkap, melainkan iringan kendang dan senggakan mulut."
            sumber = "Balai Bahasa Provinsi Jawa Tengah (2026); Laporan Revitalisasi Wayang Othok Obrol"
            
        ring1.append({
            "id": reg_id,
            "nama": nama,
            "ring": "Ring 1 - Terverifikasi",
            "ring_level": 1,
            "status_label": "TERVERIFIKASI (VALIDASI LAPANGAN PENUH)",
            "kabupaten": kab,
            "kecamatan": kec,
            "desa": desa,
            "karesidenan": karesidenan,
            "zona_ekologi": zona_ekologi,
            "maestro": maestro,
            "usia_garis": usia_garis,
            "komunitas": komunitas,
            "bentuk_tuturan": bentuk,
            "iringan_musik": musik,
            "repertoar": repertoar,
            "latitude": lat,
            "longitude": lng,
            "youtube_id": youtube_id,
            "youtube_url": youtube_url,
            "video_local": local_video,
            "cover_image": cover,
            "gallery_images": gallery,
            "ringkasan_ilmiah": ringkasan,
            "sumber_ilmiah": sumber
        })
        
    # 2. Ring 2: Ada referensi (44 items)
    s2 = wb["Ring 2 - Tervalidasi Teks (44)"]
    ring2 = []
    for r in range(2, 46):
        row = [s2.cell(r, c).value for c in range(1, 14)]
        no = row[0]
        nama = row[1]
        kab = row[2] or "Jawa Tengah"
        karesidenan = row[3] or "Jawa Tengah"
        zona = row[4] or "Kawasan Budaya Jawa"
        status_verifikasi = "TERVERIFIKASI TEKS (BERTEKS)"
        unsur_teks = row[6] or ""
        ringkasan = row[7] or ""
        sumber1 = row[8] or ""
        dasar1 = row[9] or ""
        sumber2 = row[10] or ""
        
        base_lat, base_lng = get_centroid(kab)
        lat, lng = apply_jitter(base_lat, base_lng, r, seed_offset=42)
        
        ring2.append({
            "id": f"SLJT-R2-{int(no):03d}",
            "nama": nama,
            "ring": "Ring 2 - Ada referensi",
            "ring_level": 2,
            "status_label": "TERVERIFIKASI TEKS ILMIAH",
            "kabupaten": kab,
            "karesidenan": karesidenan,
            "zona_ekologi": zona,
            "status_verifikasi": status_verifikasi,
            "unsur_teks": unsur_teks,
            "ringkasan_ilmiah": ringkasan,
            "sumber_ilmiah_1": sumber1,
            "dasar_bukti_1": dasar1,
            "sumber_ilmiah_2": sumber2,
            "latitude": lat,
            "longitude": lng
        })
        
    # 3. Ring 3: Tercatat WBTB (44 items)
    s3 = wb["Ring 3 - Tercatat WBTB (44)"]
    ring3 = []
    for r in range(2, 46):
        row = [s3.cell(r, c).value for c in range(1, 12)]
        no = row[0]
        nama = row[1]
        kab = row[2] or "Jawa Tengah"
        karesidenan = row[3] or "Jawa Tengah"
        zona = row[4] or "Kawasan Budaya Jawa"
        status_kerja = "PERLU VERIFIKASI (PRIORITAS OBSERVASI)"
        unsur_lapor = row[6] or ""
        catatan = row[7] or ""
        sumber = row[8] or ""
        
        base_lat, base_lng = get_centroid(kab)
        lat, lng = apply_jitter(base_lat, base_lng, r, seed_offset=199)
        
        ring3.append({
            "id": f"SLJT-R3-{int(no):03d}",
            "nama": nama,
            "ring": "Ring 3 - Tercatat WBTB",
            "ring_level": 3,
            "status_label": "PERLU VERIFIKASI LAPANGAN",
            "kabupaten": kab,
            "karesidenan": karesidenan,
            "zona_ekologi": zona,
            "status_kerja": status_kerja,
            "unsur_teks": unsur_lapor,
            "catatan_kritis": catatan,
            "sumber_referensi": sumber,
            "latitude": lat,
            "longitude": lng
        })
        
    # 4. Ring 4: Eksklusi Non-Sastra (41 items)
    s4 = wb["Ring 4 - Eksklusi Non-Sastra"]
    ring4 = []
    for r in range(2, s4.max_row + 1):
        row = [s4.cell(r, c).value for c in range(1, 10)]
        no = row[0]
        if no is None:
            continue
        nama = row[1]
        kab = row[2] or "Jawa Tengah"
        status_putusan = "DIEKSKLUSI RESMI"
        kategori_asli = row[4] or ""
        alasan = row[5] or ""
        sumber = row[6] or ""
        
        ring4.append({
            "no": int(no),
            "nama": nama,
            "kabupaten": kab,
            "status_keputusan": status_putusan,
            "kategori_asli": kategori_asli,
            "alasan_eksklusi": alasan,
            "sumber": sumber
        })
        
    # 5. Peta 35 Kabupaten/Kota
    s5 = wb["Peta 35 Kab-Kota"]
    kabupaten_list = []
    for r in range(2, 37):
        row = [s5.cell(r, c).value for c in range(1, 13)]
        kode = str(row[0]).strip()
        nama_kab = str(row[1]).strip()
        karesidenan = str(row[2]).strip()
        zona = str(row[3]).strip()
        r1_c = int(row[4] or 0)
        r2_c = int(row[5] or 0)
        r3_c = int(row[6] or 0)
        r4_c = int(row[7] or 0)
        total_p = r1_c + r2_c + r3_c
        status_rep = str(row[9] or "").strip()
        rtl = str(row[10] or "").strip()
        
        lat, lng = get_centroid(nama_kab)
        kabupaten_list.append({
            "kode_wilayah": kode,
            "nama": nama_kab,
            "karesidenan": karesidenan,
            "zona_ekologi": zona,
            "r1_count": r1_c,
            "r2_count": r2_c,
            "r3_count": r3_c,
            "r4_count": r4_c,
            "total_potensi": total_p,
            "status_keterwakilan": status_rep,
            "rencana_tindak_lanjut": rtl,
            "latitude": lat,
            "longitude": lng
        })
        
    # Build MASTER DATA payload
    master_data = {
        "metadata": {
            "judul": "Pangkalan Data Pemetaan Sastra Lisan Jawa Tengah",
            "tahun": 2026,
            "instansi": "Balai Bahasa Provinsi Jawa Tengah",
            "total_ring1": len(ring1),
            "total_ring2": len(ring2),
            "total_ring3": len(ring3),
            "total_ring4": len(ring4),
            "total_kabupaten": len(kabupaten_list)
        },
        "ring1": ring1,
        "ring2": ring2,
        "ring3": ring3,
        "ring4": ring4,
        "kabupaten": kabupaten_list
    }
    
    os.makedirs("data", exist_ok=True)
    with open("data/sastra_data.js", "w", encoding="utf-8") as f:
        f.write("/**\n * Pangkalan Data Pemetaan Sastra Lisan Jawa Tengah (2026)\n * Balai Bahasa Provinsi Jawa Tengah\n */\n")
        f.write("window.SASTRA_DATA = ")
        f.write(json.dumps(master_data, indent=2, ensure_ascii=False))
        f.write(";\n")
    print(f"Written data/sastra_data.js ({len(ring1)} R1, {len(ring2)} R2, {len(ring3)} R3, {len(ring4)} R4, {len(kabupaten_list)} Kab)")
    
    # Transkrip Data payload
    transkrip_master = {
        "kentrung_blora": {
            "judul": "Transkripsi Lakon Kentrung Blora (Kelahiran Nabi Ibrahim)",
            "penutur": "Yanuri Sutrisno / alm. Mbah Sutrisno",
            "lokasi": "Sendanggayam, Banjarejo, Kabupaten Blora",
            "durasi": "45:20 (367 Segmen)",
            "segmen": kentrung_transcripts
        },
        "maca_babad_pasir_luhur": {
            "judul": "Sekar Macapat Babad Pasir Luhur",
            "penutur": "Santoso Puji Irawan & Paguyuban Omah Maca",
            "lokasi": "Dusun Cibun, Desa Sunyalangu, Karanglewas, Banyumas",
            "pupuh": [
                {
                    "metrum": "Dhandhanggula",
                    "bait": 1,
                    "cakepan_jawa": "Yogyanira kang para prajurit, lamun bisa samya anulada, kadya nguni caritane, andelira sang Prabu, Sasrabau ing Maespati, aran Patih Suwanda, lalabuhanipun, kang ginelung tri prakara, guna kaya purun ingkang den antepi, nuhoni trah utama.",
                    "terjemahan": "Seyogianya para prajurit, jika bisa semuanya meneladani, seperti zaman dahulu kisahnya, andalan sang Prabu, Sasrabahu di Maespati, bernama Patih Suwanda, jasanya dirangkum tiga perkara: guna, kaya, dan purun yang dipegang teguh menepati garis utama keturunan luhur."
                },
                {
                    "metrum": "Sinom",
                    "bait": 2,
                    "cakepan_jawa": "Nulada laku utama, tumraping wong tanah Jawi, wong agung ing Ngeksiganda, Panembahan Senapati, kepati amarsudi, sudaning hawa lan nepsu, pinesu tapa brata, tanapi ing siyang ratri, amamangun karyenak tyasing sasama.",
                    "terjemahan": "Meneladani laku utama, bagi manusia tanah Jawa, orang agung di Ngeksiganda, Panembahan Senapati, bersungguh-sungguh mengikis hawa dan nafsu, ditempa tapa brata siang dan malam, membangun ketenteraman di hati sesama."
                },
                {
                    "metrum": "Pangkur",
                    "bait": 3,
                    "cakepan_jawa": "Mingkar-mingkuring ukara, akarana karenan mardi siwi, sinawung resmining kidung, sinuba sinukarta, mrih kretarta pakartining ngelmu luhung, kang tumrap ing tanah Jawa, agama ageming aji.",
                    "terjemahan": "Menghindarkan diri dari kata yang sia-sia, karena hendak mendidik anak, dikemas dalam indahnya kidung, dihias penuh rasa, agar tercapai hakikat budi ilmu luhur, yang berlaku di tanah Jawa, bahwa agama adalah pakaian kemuliaan diri."
                }
            ]
        },
        "wayang_othok_obrol": {
            "judul": "Suluk & Pakeliran Wayang Othok Obrol Selokromo",
            "penutur": "Ki Makim Kartosudarmo",
            "lokasi": "Desa Selokromo, Leksono, Wonosobo",
            "fragmen": [
                {
                    "nama": "Suluk Pathet Nem Pembuka Pakeliran",
                    "teks_jawa": "Meh rahina semu bang hyang aruna, kadi netraning angga kang kapirangu, lumrang gandhaning puspita, katon asri ing patamanan...",
                    "fungsi": "Formula pembuka peneguhan suasana pakeliran sebelum adegan jejer kepatihan dimulai, dituturkan secara vokal ritmis tanpa instrumen gamelan."
                },
                {
                    "nama": "Caturan Dialog Tokoh Punakawan",
                    "teks_jawa": "Semar: 'Gareng, elingana urip ing alam donya ora mung ngoyak drajat pangkat, nanging ngugemi paugeraning Gusti Kang Akarya Jagad.'\nGareng: 'Inggih Rama, sedaya lelampahan menika sampun pinasthi dening Kang Maha Kuwaos.'",
                    "fungsi": "Media penyampaian amanat filosofi hidup, tolak bala, dan keselarasan alam Serayu hulu."
                }
            ]
        }
    }
    
    with open("data/transkrip_data.js", "w", encoding="utf-8") as f:
        f.write("/**\n * Korpus Transkrip Teks Sastra Lisan Jawa Tengah (2026)\n */\n")
        f.write("window.TRANSKRIP_DATA = ")
        f.write(json.dumps(transkrip_master, indent=2, ensure_ascii=False))
        f.write(";\n")
    print(f"Written data/transkrip_data.js successfully!")

if __name__ == "__main__":
    main()
