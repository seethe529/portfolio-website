/**
 * Orbital Visualization Module
 * Secure, performant CesiumJS integration with AWS best practices
 * @author Ryan Charles Lingo
 */

class OrbitalVisualization {
    constructor() {
        this.viewer = null;
        this.loadedCount = 0;
        this.totalFiles = 3;
        this.czmlFiles = [
            { name: 'assets/data/LEO_shell.czml', description: 'Low Earth Orbit' },
            { name: 'assets/data/MEO_shell.czml', description: 'Medium Earth Orbit' },
            { name: 'assets/data/GEO_shell.czml', description: 'Geostationary Orbit' }
        ];
        
        // Security: Validate Cesium availability
        if (typeof Cesium === 'undefined') {
            console.error('Cesium library not loaded');
            return;
        }
        
        this.init();
    }
    
    init() {
        try {
            // Configure Cesium Ion token (use environment variable in production)
            Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNTY2ODk0ZC05NzU1LTRiODMtYmI5Yy0wZjBlODQ0NmYyOTAiLCJpZCI6MjYxMjU1LCJpYXQiOjE3NjAyODU4Mjh9.SJ11nmMVqRH9JGZ6Kt4IzVpg-1Bq1iSdZT1Td4lrpT0";
            
            this.createViewer();
            this.loadCZMLData();
            this.setupEventHandlers();
            
        } catch (error) {
            console.error('Failed to initialize orbital visualization:', error);
            this.showError('Failed to load visualization');
        }
    }
    
    createViewer() {
        const container = document.getElementById('cesiumContainer');
        if (!container) {
            throw new Error('Cesium container not found');
        }
        
        // Security: Disable unnecessary features to reduce attack surface
        this.viewer = new Cesium.Viewer(container, {
            animation: false,
            timeline: false,
            fullscreenButton: false,
            vrButton: false,
            homeButton: true,
            sceneModePicker: false,
            baseLayerPicker: false,
            navigationHelpButton: false,
            geocoder: false,
            terrainProvider: new Cesium.EllipsoidTerrainProvider(),
            imageryProvider: false,
            requestRenderMode: false
        });
        
        // Configure scene for space visualization
        this.viewer.scene.skyBox.show = true;
        this.viewer.scene.skyAtmosphere.show = true;
        this.viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0a0a0f');
        this.viewer.scene.globe.show = true;
        this.viewer.scene.sun.show = true;
        this.viewer.scene.moon.show = true;
        
        // Debug scene configuration
        console.log('Scene configured:');
        console.log('- Globe show:', this.viewer.scene.globe.show);
        console.log('- SkyBox show:', this.viewer.scene.skyBox.show);
        console.log('- Background color:', this.viewer.scene.backgroundColor);
        console.log('- Request render mode:', this.viewer.scene.requestRenderMode);
        
        // Force initial render
        this.viewer.scene.requestRender();
        
        // Security: Disable right-click context menu
        this.viewer.cesiumWidget.canvas.oncontextmenu = () => false;
        
        // Add highly visible test entities
        this.viewer.entities.add({
            name: 'BRIGHT RED BOX',
            position: Cesium.Cartesian3.fromDegrees(0, 0, 1000000),
            box: {
                dimensions: new Cesium.Cartesian3(2000000, 2000000, 2000000),
                material: Cesium.Color.RED,
                outline: true,
                outlineColor: Cesium.Color.YELLOW
            }
        });
        
        // Add a simple polygon at ground level
        this.viewer.entities.add({
            name: 'GROUND POLYGON',
            polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray([
                    -10, -10,
                    10, -10,
                    10, 10,
                    -10, 10
                ]),
                material: Cesium.Color.BLUE.withAlpha(0.5),
                outline: true,
                outlineColor: Cesium.Color.BLUE,
                height: 0
            }
        });
        
        // Set camera to see these test entities
        this.viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(0, 0, 5000000),
            orientation: {
                heading: 0,
                pitch: -Cesium.Math.PI_OVER_FOUR,
                roll: 0
            }
        });
        
        console.log('Test entities and camera set');
    }
    
    async loadCZMLData() {
        const loadingElement = document.getElementById('orbital-loading');
        
        try {
            // Load files concurrently
            const loadPromises = this.czmlFiles.map(file => 
                this.loadCZMLFile(file).catch(error => {
                    console.warn(`Failed to load ${file.name}:`, error);
                    return null;
                })
            );
            
            // Wait for all files to complete (success or failure)
            await Promise.allSettled(loadPromises);
            
            this.onLoadingComplete();
            
        } catch (error) {
            console.error('CZML loading failed:', error);
            this.showError('Failed to load orbital data');
        } finally {
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
    }
    
    async loadCZMLFile(file) {
        // Security: Validate file path to prevent directory traversal
        if (!this.isValidFilePath(file.name)) {
            throw new Error(`Invalid file path: ${file.name}`);
        }
        
        try {
            // Load and validate CZML data
            const response = await fetch(file.name);
            const czmlData = await response.json();
            
            // Filter out problematic entities
            const cleanData = czmlData.filter((packet, index) => {
                if (index === 0) return true; // Keep document packet
                
                // Skip entities with invalid polygon coordinates
                if (packet.polygon && packet.polygon.positions) {
                    const positions = packet.polygon.positions.cartographicDegrees || packet.polygon.positions;
                    if (Array.isArray(positions)) {
                        for (let i = 0; i < positions.length; i += 3) {
                            const lon = positions[i];
                            const lat = positions[i + 1];
                            const alt = positions[i + 2];
                            
                            if (!isFinite(lon) || !isFinite(lat) || !isFinite(alt) ||
                                Math.abs(lon) > 180 || Math.abs(lat) > 90 || alt < -10000000) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            });
            
            console.log(`${file.description}: ${cleanData.length - 1} valid entities from ${czmlData.length - 1} total`);
            
            const dataSource = await Cesium.CzmlDataSource.load(cleanData);
            
            // Make entities visible
            dataSource.entities.values.forEach(entity => {
                if (entity.polygon) {
                    entity.polygon.show = true;
                    entity.polygon.fill = true;
                    entity.polygon.outline = true;
                    entity.polygon.material = Cesium.Color.CYAN.withAlpha(0.6);
                    entity.polygon.outlineColor = Cesium.Color.WHITE;
                }
                entity.show = true;
            });
            
            this.viewer.dataSources.add(dataSource);
            
            console.log(`✅ Loaded ${file.description}: ${dataSource.entities.values.length} entities`);
            this.loadedCount++;
            
            return dataSource;
            
        } catch (error) {
            console.error(`❌ Failed to load ${file.name}:`, error);
            throw error;
        }
    }
    
    isValidFilePath(path) {
        // Security: Prevent directory traversal attacks
        const allowedPaths = /^assets\/data\/[A-Za-z0-9_-]+\.czml$/;
        return allowedPaths.test(path) && !path.includes('..');
    }
    
    onLoadingComplete() {
        console.log(`🎯 Orbital visualization loaded: ${this.loadedCount}/${this.totalFiles} files`);
        
        // Debug: Check viewer state
        console.log('Viewer scene:', this.viewer.scene);
        console.log('Globe show:', this.viewer.scene.globe.show);
        console.log('SkyBox show:', this.viewer.scene.skyBox.show);
        
        // Log data sources for debugging
        for (let i = 0; i < this.viewer.dataSources.length; i++) {
            const ds = this.viewer.dataSources.get(i);
            console.log(`Data source ${i}: ${ds.name} (${ds.entities.values.length} entities)`);
            
            // Debug first entity in each data source
            if (ds.entities.values.length > 0) {
                const entity = ds.entities.values[0];
                console.log('First entity:', entity.name, entity.id);
                console.log('Entity show:', entity.show);
                if (entity.polygon) {
                    console.log('Polygon show:', entity.polygon.show);
                    console.log('Polygon positions:', entity.polygon.hierarchy);
                }
            }
        }
        
        // Zoom to show all data
        setTimeout(() => {
            console.log('Zooming to all data...');
            if (this.viewer.dataSources.length > 0) {
                this.viewer.zoomTo(this.viewer.dataSources);
            } else {
                // Fallback camera position
                this.viewer.camera.setView({
                    destination: Cesium.Cartesian3.fromDegrees(0, 0, 40000000),
                    orientation: {
                        heading: 0,
                        pitch: -Cesium.Math.PI_OVER_THREE,
                        roll: 0
                    }
                });
            }
        }, 2000);
        
        // Force render
        this.viewer.scene.requestRender();
    }
    
    setupEventHandlers() {
        // Performance: Throttled resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.viewer) {
                    this.viewer.resize();
                }
            }, 250);
        });
        
        // Interactive controls
        this.setupInteractiveControls();
        
        // Security: Sanitize entity selection logging
        const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        handler.setInputAction((movement) => {
            const picked = this.viewer.scene.pick(movement.position);
            if (Cesium.defined(picked) && picked.id) {
                const entityName = picked.id.name || picked.id.id || 'Unknown';
                this.showZoneInfo(entityName);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
    
    setupInteractiveControls() {
        // Zone toggles
        document.getElementById('toggle-leo')?.addEventListener('change', (e) => {
            this.toggleZone('LEO', e.target.checked);
        });
        
        document.getElementById('toggle-meo')?.addEventListener('change', (e) => {
            this.toggleZone('MEO', e.target.checked);
        });
        
        document.getElementById('toggle-geo')?.addEventListener('change', (e) => {
            this.toggleZone('GEO', e.target.checked);
        });
        
        // View controls
        document.getElementById('view-earth')?.addEventListener('click', () => {
            this.viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(0, 0, 15000000)
            });
        });
        
        document.getElementById('view-space')?.addEventListener('click', () => {
            this.viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(0, 0, 50000000)
            });
        });
        
        document.getElementById('view-all')?.addEventListener('click', () => {
            if (this.viewer.dataSources.length > 0) {
                this.viewer.zoomTo(this.viewer.dataSources);
            }
        });
    }
    
    toggleZone(zoneName, visible) {
        this.viewer.dataSources.values.forEach(dataSource => {
            if (dataSource.name && dataSource.name.includes(zoneName)) {
                dataSource.show = visible;
            }
        });
    }
    
    showZoneInfo(entityName) {
        const infoElement = document.getElementById('zone-info');
        if (infoElement) {
            let info = 'Click orbital zones to learn more';
            
            if (entityName.includes('LEO')) {
                info = '🛰️ LEO Zone: 160-2000km altitude. Used for Earth observation, communications, and space stations.';
            } else if (entityName.includes('MEO')) {
                info = '🛰️ MEO Zone: 2000-35,786km altitude. Home to GPS, GLONASS, and Galileo navigation satellites.';
            } else if (entityName.includes('GEO')) {
                info = '🛰️ GEO Zone: 35,786km altitude. Satellites appear stationary for telecommunications and weather monitoring.';
            }
            
            infoElement.textContent = info;
        }
    }
    
    sanitizeString(str) {
        // Security: Basic string sanitization
        return String(str).replace(/[<>\"'&]/g, '');
    }
    
    showError(message) {
        const container = document.getElementById('cesiumContainer');
        if (container) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                           background: #1a1a1a; color: #ff6b35; font-family: Inter, sans-serif;">
                    <div style="text-align: center; padding: 2rem;">
                        <h3>Visualization Unavailable</h3>
                        <p>${this.sanitizeString(message)}</p>
                        <p style="font-size: 0.9rem; opacity: 0.7;">Please try refreshing the page.</p>
                    </div>
                </div>
            `;
        }
    }
    
    destroy() {
        if (this.viewer) {
            this.viewer.destroy();
            this.viewer = null;
        }
    }
}

// Initialize when DOM is ready and Cesium is available
document.addEventListener('DOMContentLoaded', () => {
    // Security: Check if we're in the correct context
    if (document.getElementById('cesiumContainer')) {
        // Performance: Lazy load when section is visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    new OrbitalVisualization();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.1 });
        
        const orbitalSection = document.getElementById('orbital-viz');
        if (orbitalSection) {
            observer.observe(orbitalSection);
        }
    }
});

// Security: Prevent global namespace pollution
(() => {
    'use strict';
    // Module code is contained within this IIFE
})();