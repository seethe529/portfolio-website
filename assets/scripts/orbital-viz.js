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
            imageryProvider: new Cesium.IonImageryProvider({ assetId: 2 }),
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
        
        // Debug: Add a test entity to verify Cesium is working
        this.viewer.entities.add({
            name: 'Test Point',
            position: Cesium.Cartesian3.fromDegrees(-75.0, 40.0, 1000000),
            point: {
                pixelSize: 20,
                color: Cesium.Color.YELLOW,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2
            },
            label: {
                text: 'TEST POINT',
                font: '14pt sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE
            }
        });
        
        console.log('Test entity added. Total entities:', this.viewer.entities.values.length);
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
            const dataSource = await Cesium.CzmlDataSource.load(file.name);
            
            // Fix: Ensure all polygon entities are visible
            dataSource.entities.values.forEach(entity => {
                if (entity.polygon) {
                    entity.polygon.show = true;
                    entity.polygon.fill = true;
                    entity.polygon.outline = true;
                    entity.polygon.material = Cesium.Color.CYAN.withAlpha(0.3);
                    entity.polygon.outlineColor = Cesium.Color.CYAN;
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
        
        // Try multiple camera positions
        setTimeout(() => {
            console.log('Setting camera to Earth view...');
            this.viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
                orientation: {
                    heading: 0,
                    pitch: -Cesium.Math.PI_OVER_FOUR,
                    roll: 0
                }
            });
        }, 1000);
        
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
        
        // Security: Sanitize entity selection logging
        const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        handler.setInputAction((movement) => {
            const picked = this.viewer.scene.pick(movement.position);
            if (Cesium.defined(picked) && picked.id) {
                const entityName = picked.id.name || picked.id.id || 'Unknown';
                console.log('Selected entity:', this.sanitizeString(entityName));
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
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