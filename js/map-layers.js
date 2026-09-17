/**
 * Pengontrol Peta Leaflet & Pengelolaan Layer Spasial
 * Atlas Sastra Lisan Jawa Tengah
 */
(function (window) {
  'use strict';

  let mapInstance = null;
  let markerLayerGroup = null;
  let boundaryLayer = null;
  let currentBaseLayer = null;
  let activeHighlightedKabupaten = null;
  let wasTemporarilyAdded = false;

  const MAP_CENTER = [-7.15, 110.14];
  const DEFAULT_ZOOM = 8;

  function getResponsiveMapCenter() {
    if (typeof window !== 'undefined' && window.innerHeight > window.innerWidth) {
      const ratio = window.innerHeight / window.innerWidth;
      if (ratio >= 1.6) {
        // Layar potret tinggi/jenjang: geser sedikit ke selatan (-7.28)
        // agar seluruh daratan Jawa Tengah berpusat tepat di tengah area pandang
        return [-7.28, 110.14];
      }
    }
    return MAP_CENTER;
  }

  const STYLE_HIGHLIGHTED = {
    fillColor: '#FFE600', // Satu warna: Kuning Neobrutalis
    weight: 1.5, // Garis lebih tipis, rapi, dan presisi
    opacity: 0.95,
    color: '#000000',
    dashArray: '',
    fillOpacity: 0.40
  };

  const STYLE_INVISIBLE = {
    fillColor: 'transparent',
    weight: 0,
    opacity: 0,
    fillOpacity: 0
  };

  const STYLE_SUBTLE_OUTLINE = {
    fillColor: 'transparent',
    weight: 0.8, // Garis tepi sangat tipis untuk outline
    opacity: 0.35,
    color: '#000000',
    dashArray: '3',
    fillOpacity: 0
  };

  /**
   * Menemukan tepat SATU poligon kabupaten yang sesuai dengan nama kabupaten sastra lisan
   */
  function matchSingleKabupaten(kabStr, kabFeatureLayers) {
    if (!kabStr || !kabFeatureLayers || !kabFeatureLayers.length) return null;
    const s = String(kabStr).toLowerCase().trim();

    // 1. Cek kecocokan nama persis (Exact match)
    for (let i = 0; i < kabFeatureLayers.length; i++) {
      const layer = kabFeatureLayers[i];
      const name = (layer.feature && layer.feature.properties ? layer.feature.properties.nama : '').toLowerCase().trim();
      if (name === s) return layer;
    }

    // 2. Kota ambigu yang memiliki versi Kabupaten dan Kota (Semarang, Magelang, Pekalongan, Tegal)
    const ambiguous = ['semarang', 'magelang', 'pekalongan', 'tegal'];
    for (let i = 0; i < ambiguous.length; i++) {
      const city = ambiguous[i];
      if (s.includes(city)) {
        const wantsKota = s.includes('kota ' + city);
        for (let j = 0; j < kabFeatureLayers.length; j++) {
          const layer = kabFeatureLayers[j];
          const name = (layer.feature && layer.feature.properties ? layer.feature.properties.nama : '').toLowerCase();
          if (wantsKota && name === 'kota ' + city) return layer;
          if (!wantsKota && name === 'kabupaten ' + city) return layer;
        }
      }
    }

    // 3. Surakarta dan Salatiga
    if (s.includes('surakarta') || s.includes('solo')) {
      for (let i = 0; i < kabFeatureLayers.length; i++) {
        const layer = kabFeatureLayers[i];
        const name = (layer.feature && layer.feature.properties ? layer.feature.properties.nama : '').toLowerCase();
        if (name === 'kota surakarta') return layer;
      }
    }
    if (s.includes('salatiga')) {
      for (let i = 0; i < kabFeatureLayers.length; i++) {
        const layer = kabFeatureLayers[i];
        const name = (layer.feature && layer.feature.properties ? layer.feature.properties.nama : '').toLowerCase();
        if (name === 'kota salatiga') return layer;
      }
    }

    // 4. Cek kata kunci inti setiap kabupaten dengan batas kata (\b)
    for (let i = 0; i < kabFeatureLayers.length; i++) {
      const layer = kabFeatureLayers[i];
      const origName = layer.feature && layer.feature.properties ? layer.feature.properties.nama : '';
      const core = origName.toLowerCase().replace(/^kabupaten\s+|^kota\s+/, '').trim();
      if (core) {
        const re = new RegExp('\\b' + core + '\\b', 'i');
        if (re.test(s)) return layer;
      }
    }

    // 5. Fallback substring
    for (let i = 0; i < kabFeatureLayers.length; i++) {
      const layer = kabFeatureLayers[i];
      const origName = layer.feature && layer.feature.properties ? layer.feature.properties.nama : '';
      const core = origName.toLowerCase().replace(/^kabupaten\s+|^kota\s+/, '').trim();
      if (core && s.includes(core)) return layer;
    }

    return null;
  }

  const MapLayers = {
    /**
     * Inisialisasi peta Leaflet
     */
    initMap: function (containerId) {
      if (mapInstance) {
        return mapInstance;
      }

      mapInstance = L.map(containerId, {
        center: getResponsiveMapCenter(),
        zoom: DEFAULT_ZOOM,
        minZoom: 7,
        maxZoom: 18,
        zoomControl: false
      });

      // Pindahkan zoom control ke kanan bawah agar tidak bertabrakan dengan floating panel
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

      // Tile Layer 1: ESRI World Light Gray Canvas (Bersih, elegan, tanpa watermark, 100% tanpa API key)
      const esriCanvas = L.layerGroup([
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; Esri, DeLorme, NAVTEQ',
          maxZoom: 16
        }),
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
          attribution: '',
          maxZoom: 16
        })
      ]);

      // Tile Layer 2: OpenStreetMap Standard (Gratis, detail jalan & toponimi lengkap)
      const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      });

      // Tile Layer 3: ESRI World Topo Map (Topografi kontur pegunungan & lembah sungai)
      const esriTopo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri &mdash; Topographic Mapping',
        maxZoom: 18
      });

      // Default: ESRI Canvas yang bersih dan kontras
      esriCanvas.addTo(mapInstance);
      currentBaseLayer = esriCanvas;

      // Base layer switcher control (di sudut kanan bawah)
      const baseMaps = {
        'Peta Bersih (Gray Canvas)': esriCanvas,
        'OpenStreetMap (Detail Jalan)': osmStandard,
        'Peta Topografi (Lanskap Alam)': esriTopo
      };
      L.control.layers(baseMaps, null, { position: 'bottomright' }).addTo(mapInstance);

      // Layer group untuk marker titik sastra lisan
      markerLayerGroup = L.layerGroup().addTo(mapInstance);

      // Siapkan layer batas administratif 35 kabupaten jika tersedia
      this.initBoundaries();

      return mapInstance;
    },

    /**
     * Inisialisasi batas poligon 35 kabupaten
     */
    initBoundaries: function () {
      if (!window.JATENG_KABUPATEN) return;

      const self = this;
      boundaryLayer = L.geoJSON(window.JATENG_KABUPATEN, {
        style: function () {
          return STYLE_INVISIBLE;
        },
        onEachFeature: function (feature, layer) {
          const props = feature.properties;
          const tooltipContent = `
            <div style="font-family: 'Space Grotesk', sans-serif; font-weight: 800; font-size: 0.9rem; color: #000;">
              ${props.nama}
            </div>
            <div style="font-size: 0.75rem; color: #444; margin-top: 2px;">
              ${props.karesidenan} &bull; ${props.zona_ekologi}
            </div>
            <div style="font-size: 0.8rem; font-weight: 700; margin-top: 5px; color: #000;">
              Total Potensi: <span class="neo-badge badge-kab">${props.total_sastra} Tradisi</span>
            </div>
            <div style="font-size: 0.72rem; color: #555; margin-top: 3px;">
              ⭐ Ring 1: ${props.r1_count} &nbsp;|&nbsp; 📖 Ring 2: ${props.r2_count} &nbsp;|&nbsp; 🔍 Ring 3: ${props.r3_count}
            </div>
          `;
          layer.bindTooltip(tooltipContent, {
            className: 'leaflet-tooltip-neo',
            sticky: true
          });

          layer.on({
            mouseover: function (e) {
              if (activeHighlightedKabupaten === layer) {
                layer.setStyle(Object.assign({}, STYLE_HIGHLIGHTED, {
                  weight: 2.0,
                  fillOpacity: 0.55
                }));
              }
            },
            mouseout: function (e) {
              if (activeHighlightedKabupaten === layer) {
                layer.setStyle(STYLE_HIGHLIGHTED);
              } else {
                const toggleEl = typeof document !== 'undefined' ? document.getElementById('toggle-boundaries') : null;
                if (toggleEl && toggleEl.checked) {
                  layer.setStyle(STYLE_SUBTLE_OUTLINE);
                } else {
                  layer.setStyle(STYLE_INVISIBLE);
                }
              }
            },
            click: function (e) {
              if (activeHighlightedKabupaten === layer) {
                mapInstance.fitBounds(layer.getBounds(), { padding: [40, 40] });
              }
            }
          });
        }
      });
    },

    /**
     * Mengaktifkan atau menonaktifkan layer poligon 35 kabupaten
     */
    toggleBoundaries: function (show) {
      if (!boundaryLayer || !mapInstance) return;
      if (show) {
        if (!mapInstance.hasLayer(boundaryLayer)) {
          boundaryLayer.addTo(mapInstance);
          boundaryLayer.bringToBack();
        }
        boundaryLayer.eachLayer(function (layer) {
          if (activeHighlightedKabupaten === layer) {
            layer.setStyle(STYLE_HIGHLIGHTED);
          } else {
            layer.setStyle(STYLE_SUBTLE_OUTLINE);
          }
        });
      } else {
        if (!activeHighlightedKabupaten) {
          if (mapInstance.hasLayer(boundaryLayer)) {
            mapInstance.removeLayer(boundaryLayer);
          }
        } else {
          // Hanya sembunyikan kabupaten lain, pertahankan yang sedang tersorot
          boundaryLayer.eachLayer(function (layer) {
            if (activeHighlightedKabupaten === layer) {
              layer.setStyle(STYLE_HIGHLIGHTED);
            } else {
              layer.setStyle(STYLE_INVISIBLE);
            }
          });
        }
      }
    },

    /**
     * Menyeleksi dan menyorot (highlight) HANYA SATU poligon kabupaten tertentu
     * Kabupaten lain dibuat transparan total (tidak perlu warna / garis pengganggu)
     */
    highlightKabupaten: function (kabName) {
      if (!boundaryLayer || !mapInstance) return;

      if (!kabName) {
        this.resetKabupatenHighlight();
        return;
      }

      // Pastikan boundaryLayer terpasang di peta
      if (!mapInstance.hasLayer(boundaryLayer)) {
        boundaryLayer.addTo(mapInstance);
        boundaryLayer.bringToBack();
        wasTemporarilyAdded = true;
      }

      // Kumpulkan layer-layer kabupaten
      const layers = [];
      boundaryLayer.eachLayer(function (l) {
        layers.push(l);
      });

      // Cari tepat satu poligon yang sesuai
      const matchedLayer = matchSingleKabupaten(kabName, layers);

      const toggleEl = typeof document !== 'undefined' ? document.getElementById('toggle-boundaries') : null;
      const isToggleChecked = toggleEl ? toggleEl.checked : false;

      // Warnai HANYA kabupaten yang tersorot, kabupaten lain tidak perlu
      layers.forEach(function (layer) {
        if (matchedLayer && layer === matchedLayer) {
          layer.setStyle(STYLE_HIGHLIGHTED);
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
          }
        } else {
          if (isToggleChecked) {
            layer.setStyle(STYLE_SUBTLE_OUTLINE);
          } else {
            layer.setStyle(STYLE_INVISIBLE);
          }
        }
      });

      // Pastikan titik marker tetap terlihat jelas di atas
      if (markerLayerGroup && markerLayerGroup.bringToFront) {
        markerLayerGroup.bringToFront();
      }

      activeHighlightedKabupaten = matchedLayer;
      return matchedLayer;
    },

    /**
     * Mengembalikan gaya poligon kabupaten (menghilangkan sorotan)
     */
    resetKabupatenHighlight: function () {
      if (!boundaryLayer || !mapInstance) return;

      activeHighlightedKabupaten = null;

      const toggleEl = typeof document !== 'undefined' ? document.getElementById('toggle-boundaries') : null;
      const isToggleChecked = toggleEl ? toggleEl.checked : false;

      if (!isToggleChecked) {
        boundaryLayer.eachLayer(function (layer) {
          layer.setStyle(STYLE_INVISIBLE);
        });
        if (mapInstance.hasLayer(boundaryLayer)) {
          mapInstance.removeLayer(boundaryLayer);
        }
        wasTemporarilyAdded = false;
      } else {
        boundaryLayer.eachLayer(function (layer) {
          layer.setStyle(STYLE_SUBTLE_OUTLINE);
        });
      }
    },

    /**
     * Membuat custom icon Leaflet Neobrutalis
     */
    createCustomMarkerIcon: function (item) {
      let iconClass = 'pin-r2';
      let innerIcon = '<i class="fa-solid fa-feather"></i>';

      if (item.ring_level === 1) {
        iconClass = 'pin-r1';
        innerIcon = '<i class="fa-solid fa-star"></i>';
      } else if (item.ring_level === 3) {
        iconClass = 'pin-r3';
        innerIcon = '<i class="fa-solid fa-magnifying-glass"></i>';
      }

      const html = `<div class="custom-pin ${iconClass}" title="${item.nama}">${innerIcon}</div>`;

      let size = [28, 28];
      let anchor = [14, 14];
      if (item.ring_level === 1) {
        size = [36, 36];
        anchor = [18, 18];
      } else if (item.ring_level === 3) {
        size = [26, 26];
        anchor = [13, 13];
      }

      return L.divIcon({
        html: html,
        className: 'neo-marker-container',
        iconSize: size,
        iconAnchor: anchor,
        popupAnchor: [0, -anchor[1]]
      });
    },

    /**
     * Render daftar marker sastra lisan ke peta
     */
    renderMarkers: function (items, onMarkerClick) {
      if (!markerLayerGroup) return;
      markerLayerGroup.clearLayers();

      const self = this;
      items.forEach(function (item) {
        if (item.latitude === undefined || item.longitude === undefined) return;

        const icon = self.createCustomMarkerIcon(item);
        const marker = L.marker([item.latitude, item.longitude], { icon: icon });

        // Tooltip Neobrutalis informatif saat hover
        let badgeClass = 'badge-r2';
        if (item.ring_level === 1) badgeClass = 'badge-r1';
        if (item.ring_level === 3) badgeClass = 'badge-r3';

        const tooltipHtml = `
          <div style="font-family: 'Space Grotesk', sans-serif; font-weight: 800; font-size: 0.88rem;">
            ${item.nama}
          </div>
          <div style="margin: 4px 0;">
            <span class="neo-badge ${badgeClass}">${item.ring}</span>
          </div>
          <div style="font-size: 0.75rem; color: #444;">
            <i class="fa-solid fa-location-dot"></i> ${item.kabupaten} &bull; ${item.karesidenan}
          </div>
          ${item.maestro ? `<div style="font-size: 0.75rem; font-weight: 700; color: #000; margin-top: 2px;"><i class="fa-solid fa-user"></i> ${item.maestro}</div>` : ''}
        `;

        marker.bindTooltip(tooltipHtml, {
          className: 'leaflet-tooltip-neo',
          offset: [0, -10]
        });

        marker.on('click', function () {
          self.flyToLocation(item.latitude, item.longitude, 12);
          self.highlightKabupaten(item.kabupaten);
          if (typeof onMarkerClick === 'function') {
            onMarkerClick(item);
          }
        });

        markerLayerGroup.addLayer(marker);
      });
    },

    /**
     * Animasi geser dan perbesar kamera peta
     */
    flyToLocation: function (lat, lng, zoom) {
      if (!mapInstance) return;
      mapInstance.flyTo([lat, lng], zoom || 12, {
        duration: 0.75,
        easeLinearity: 0.25
      });
    },

    /**
     * Menyesuaikan zoom dan posisi kamera peta agar pas mencakup semua marker terfilter
     */
    fitFilteredMarkers: function (items) {
      if (!mapInstance || !items || !items.length) return;
      const valid = items.filter(function (i) {
        return typeof i.latitude === 'number' && typeof i.longitude === 'number';
      });
      if (!valid.length) return;

      if (valid.length === 1) {
        mapInstance.flyTo([valid[0].latitude, valid[0].longitude], 12, { duration: 0.8 });
      } else {
        const bounds = L.latLngBounds(valid.map(function (i) {
          return [i.latitude, i.longitude];
        }));
        mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 12, animate: true, duration: 0.8 });
      }
    },

    /**
     * Reset pandangan peta ke keseluruhan Jawa Tengah
     */
    resetView: function () {
      if (!mapInstance) return;
      this.resetKabupatenHighlight();
      mapInstance.flyTo(getResponsiveMapCenter(), DEFAULT_ZOOM, { duration: 0.8 });
    },

    /**
     * Dapatkan instance peta Leaflet (untuk event klik & tools admin)
     */
    getMap: function () {
      return mapInstance;
    }
  };

  window.MapLayers = MapLayers;
})(typeof window !== 'undefined' ? window : this);
