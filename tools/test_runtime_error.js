const fs = require('fs');

// Mock browser globals
global.window = global;
global.document = {
  getElementById: function(id) {
    return {
      id: id,
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      addEventListener: () => {},
      appendChild: () => {},
      querySelectorAll: () => [],
      querySelector: () => null,
      value: '',
      checked: false,
      innerHTML: '',
      textContent: ''
    };
  },
  querySelectorAll: function() { return []; },
  querySelector: function() { return null; },
  createElement: function(tag) {
    return {
      tagName: tag.toUpperCase(),
      style: {},
      classList: { add: () => {}, remove: () => {} },
      addEventListener: () => {},
      appendChild: () => {},
      setAttribute: () => {}
    };
  },
  addEventListener: () => {}
};

// Mock Leaflet
global.L = {
  map: function(id, opts) {
    return {
      addLayer: () => {},
      removeLayer: () => {},
      hasLayer: () => false,
      fitBounds: () => {},
      flyTo: () => {},
      on: () => {},
      getBounds: () => ({ pad: () => {} })
    };
  },
  control: {
    zoom: () => ({ addTo: () => {} }),
    layers: () => ({ addTo: () => {} })
  },
  layerGroup: (layers) => ({
    addTo: () => {},
    clearLayers: () => {},
    addLayer: () => {},
    eachLayer: (cb) => { if (layers) layers.forEach(cb); },
    bringToBack: () => {},
    bringToFront: () => {}
  }),
  tileLayer: () => ({ addTo: () => {} }),
  geoJSON: (data, opts) => {
    const layers = (data && data.features ? data.features : []).map(f => {
      const l = {
        feature: f,
        setStyle: () => {},
        bindTooltip: () => {},
        on: () => {},
        bringToFront: () => {},
        getBounds: () => {}
      };
      return l;
    });
    return {
      addTo: () => {},
      eachLayer: (cb) => layers.forEach(cb),
      setStyle: () => {},
      resetStyle: () => {},
      bringToBack: () => {},
      bringToFront: () => {}
    };
  },
  marker: () => ({
    bindTooltip: () => {},
    on: () => {}
  }),
  divIcon: () => ({}),
  Browser: {}
};

try {
  // Load data
  require('../data/sastra_data.js');
  require('../data/jateng_kabupaten.js');
  require('../data/transkrip_data.js');
  console.log('[OK] Data loaded.');

  // Load map-layers
  require('../js/map-layers.js');
  console.log('[OK] map-layers.js loaded.');

  // Init map
  const map = window.MapLayers.initMap('map');
  console.log('[OK] MapLayers.initMap() executed successfully.');

  // Highlight kabupaten test
  window.MapLayers.highlightKabupaten('Kabupaten Purbalingga');
  console.log('[OK] highlightKabupaten executed.');

  window.MapLayers.resetKabupatenHighlight();
  console.log('[OK] resetKabupatenHighlight executed.');

  // Load app.js
  require('../js/app.js');
  console.log('[OK] app.js loaded.');

  window.App.init();
  console.log('[OK] App.init() executed.');

  window.App.openDrawer(window.SASTRA_DATA.ring1[0]);
  console.log('[OK] App.openDrawer() executed.');

  window.App.closeDrawer();
  console.log('[OK] App.closeDrawer() executed.');

  console.log('SUCCESS: All runtime calls executed with zero errors!');
} catch (err) {
  console.error('RUNTIME ERROR DETECTED:', err);
  process.exit(1);
}
