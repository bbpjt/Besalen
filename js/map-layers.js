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

  const MAP_CENTER = [-7.15, 110.14];
  const DEFAULT_ZOOM = 8;

  function getChoroplethColor(count) {
    if (count >= 6) return '#7C3AED';
    if (count >= 4) return '#8B5CF6';
    if (count >= 2) return '#A78BFA';
    return '#DDD6FE';
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
        center: MAP_CENTER,
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
        style: function (feature) {
          const count = feature.properties ? feature.properties.total_sastra : 0;
          return {
            fillColor: getChoroplethColor(count),
            weight: 2,
            opacity: 0.9,
            color: '#000000',
            dashArray: '3',
            fillOpacity: 0.25
          };
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
              const l = e.target;
              l.setStyle({
                weight: 3.5,
                color: '#000',
                dashArray: '',
                fillOpacity: 0.5
              });
              if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                l.bringToFront();
              }
            },
            mouseout: function (e) {
              boundaryLayer.resetStyle(e.target);
            },
            click: function (e) {
              mapInstance.fitBounds(e.target.getBounds(), { padding: [40, 40] });
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
      } else {
        if (mapInstance.hasLayer(boundaryLayer)) {
          mapInstance.removeLayer(boundaryLayer);
        }
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
     * Reset pandangan peta ke keseluruhan Jawa Tengah
     */
    resetView: function () {
      if (!mapInstance) return;
      mapInstance.flyTo(MAP_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
    }
  };

  window.MapLayers = MapLayers;
})(typeof window !== 'undefined' ? window : this);
