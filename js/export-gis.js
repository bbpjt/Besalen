/**
 * Modul Ekspor Geospasial Sastra Lisan Jawa Tengah
 * Mendukung format GeoJSON (RFC 7946) dan CSV WKT (QGIS & ArcGIS Ready)
 */
(function (window) {
  'use strict';

  function escapeCSV(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  function getAllSpatialItems(sastraData) {
    const items = [];
    if (sastraData.ring1 && Array.isArray(sastraData.ring1)) {
      items.push(...sastraData.ring1);
    }
    if (sastraData.ring2 && Array.isArray(sastraData.ring2)) {
      items.push(...sastraData.ring2);
    }
    if (sastraData.ring3 && Array.isArray(sastraData.ring3)) {
      items.push(...sastraData.ring3);
    }
    return items;
  }

  const GISExporter = {
    /**
     * Membangun payload GeoJSON FeatureCollection dari data sastra lisan
     */
    buildGeoJSON: function (sastraData) {
      const items = Array.isArray(sastraData) ? sastraData : getAllSpatialItems(sastraData);
      const features = items.map(function (item) {
        return {
          type: 'Feature',
          id: item.id,
          geometry: {
            type: 'Point',
            coordinates: [Number(item.longitude), Number(item.latitude)]
          },
          properties: {
            id: item.id,
            nama: item.nama,
            ring_kategori: item.ring,
            ring_level: item.ring_level,
            status_label: item.status_label || '',
            kabupaten: item.kabupaten,
            kecamatan: item.kecamatan || '',
            desa: item.desa || '',
            karesidenan: item.karesidenan,
            zona_ekologi: item.zona_ekologi,
            maestro: item.maestro || '',
            formula_teks: item.unsur_teks || item.bentuk_tuturan || '',
            ringkasan: item.ringkasan_ilmiah || '',
            sumber_ilmiah: item.sumber_ilmiah || item.sumber_ilmiah_1 || item.sumber_referensi || '',
            url_sumber_1: item.url1 || '',
            url_sumber_2: item.url2 || '',
            youtube_url: item.youtube_url || ''
          }
        };
      });

      return {
        type: 'FeatureCollection',
        name: 'Peta_Sastra_Lisan_Jawa_Tengah',
        crs: {
          type: 'name',
          properties: {
            name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
          }
        },
        features: features
      };
    },

    /**
     * Membangun teks CSV Geospasial dengan kolom koordinat dan geometri WKT POINT(lng lat)
     */
    buildCSV: function (sastraData) {
      const items = Array.isArray(sastraData) ? sastraData : getAllSpatialItems(sastraData);
      const headers = [
        'id',
        'nama',
        'ring_kategori',
        'ring_level',
        'kabupaten',
        'kecamatan',
        'desa',
        'karesidenan',
        'zona_ekologi',
        'maestro',
        'formula_teks',
        'ringkasan_ilmiah',
        'sumber_ilmiah',
        'url_sumber_1',
        'url_sumber_2',
        'latitude',
        'longitude',
        'wkt_geom',
        'youtube_url'
      ];

      const rows = [headers.join(',')];

      items.forEach(function (item) {
        const lng = Number(item.longitude);
        const lat = Number(item.latitude);
        const wkt = `POINT(${lng} ${lat})`;

        const row = [
          escapeCSV(item.id),
          escapeCSV(item.nama),
          escapeCSV(item.ring),
          item.ring_level,
          escapeCSV(item.kabupaten),
          escapeCSV(item.kecamatan || ''),
          escapeCSV(item.desa || ''),
          escapeCSV(item.karesidenan),
          escapeCSV(item.zona_ekologi),
          escapeCSV(item.maestro || ''),
          escapeCSV(item.unsur_teks || item.bentuk_tuturan || ''),
          escapeCSV(item.ringkasan_ilmiah || ''),
          escapeCSV(item.sumber_ilmiah || item.sumber_ilmiah_1 || item.sumber_referensi || ''),
          escapeCSV(item.url1 || ''),
          escapeCSV(item.url2 || ''),
          lat,
          lng,
          escapeCSV(wkt),
          escapeCSV(item.youtube_url || '')
        ];
        rows.push(row.join(','));
      });

      return rows.join('\r\n');
    },

    /**
     * Memvalidasi dan menyiapkan GeoJSON batas administratif
     */
    buildBoundaryGeoJSON: function (boundaryData) {
      if (!boundaryData) {
        boundaryData = window.JATENG_KABUPATEN || {};
      }
      return boundaryData;
    },

    /**
     * Memicu dialog unduh berkas di browser klien
     */
    downloadFile: function (content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
    },

    exportGeoJSON: function (sastraData, filename) {
      const geojson = this.buildGeoJSON(sastraData || window.SASTRA_DATA);
      const jsonStr = JSON.stringify(geojson, null, 2);
      this.downloadFile(jsonStr, filename || 'sastra_lisan_jateng.geojson', 'application/geo+json;charset=utf-8');
    },

    exportCSV: function (sastraData, filename) {
      const csvStr = this.buildCSV(sastraData || window.SASTRA_DATA);
      this.downloadFile(csvStr, filename || 'sastra_lisan_jateng_coords.csv', 'text/csv;charset=utf-8');
    },

    exportBoundaryGeoJSON: function (boundaryData, filename) {
      const geojson = this.buildBoundaryGeoJSON(boundaryData || window.JATENG_KABUPATEN);
      const jsonStr = JSON.stringify(geojson, null, 2);
      this.downloadFile(jsonStr, filename || 'jateng_35_kabupaten_agregat.geojson', 'application/geo+json;charset=utf-8');
    }
  };

  window.GISExporter = GISExporter;
})(typeof window !== 'undefined' ? window : this);
