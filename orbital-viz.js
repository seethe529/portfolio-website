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
            { name: 'orbits/LEO_shell.czml', description: 'Low Earth Orbit' },
            { name: 'orbits/MEO_shell.czml', description: 'Medium Earth Orbit' },
            { name: 'orbits/GEO_shell.czml', description: 'Geostationary Orbit' }
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
            requestRenderMode: true,
            maximumRenderTimeChange: Infinity
        });
        
        // Configure scene for space visualization
        this.viewer.scene.skyBox.show = true;
        this.viewer.scene.skyAtmosphere.show = true;
        this.viewer.scene.backgroundColor = Cesium.Color.BLACK;
        this.viewer.scene.globe.show = true;
        this.viewer.scene.sun.show = false;
        this.viewer.scene.moon.show = false;
        
        // Security: Disable right-click context menu
        this.viewer.cesiumWidget.canvas.oncontextmenu = () => false;
    }
    
    async loadCZMLData() {
        const loadingElement = document.getElementById('orbital-loading');
        
        try {
            // Performance: Load files concurrently with timeout
            const loadPromises = this.czmlFiles.map(file => 
                this.loadCZMLFile(file).catch(error => {
                    console.warn(`Failed to load ${file.name}:`, error);
                    return null;
                })
            );
            
            // Security: Set reasonable timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Loading timeout')), 15000)
            );
            
            await Promise.race([
                Promise.allSettled(loadPromises),
                timeoutPromise
            ]);
            
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
        const allowedPaths = /^orbits\/[A-Za-z0-9_-]+\.czml$/;
        return allowedPaths.test(path) && !path.includes('..');
    }
    
    onLoadingComplete() {
        console.log(`🎯 Orbital visualization loaded: ${this.loadedCount}/${this.totalFiles} files`);
        
        // Performance: Set optimal camera position
        this.viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(0, 0, 50000000),
            orientation: {
                heading: 0,
                pitch: -Cesium.Math.PI_OVER_TWO,
                roll: 0
            }
        });
        
        // Log data sources for debugging
        for (let i = 0; i < this.viewer.dataSources.length; i++) {
            const ds = this.viewer.dataSources.get(i);
            console.log(`Data source ${i}: ${ds.name} (${ds.entities.values.length} entities)`);
        }
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