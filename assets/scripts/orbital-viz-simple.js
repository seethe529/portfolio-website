/**
 * Simple Orbital Visualization - Working version
 */

class SimpleOrbitalVisualization {
    constructor() {
        this.viewer = null;
        this.init();
    }
    
    init() {
        try {
            this.createViewer();
            this.loadCZML();
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('Visualization failed to load');
        }
    }
    
    createViewer() {
        if (typeof Cesium === 'undefined') {
            throw new Error('Cesium library not loaded');
        }
        
        const container = document.getElementById('cesiumContainer');
        if (!container) {
            throw new Error('cesiumContainer element not found');
        }
        
        this.viewer = new Cesium.Viewer(container, {
            animation: false,
            timeline: false,
            fullscreenButton: false,
            vrButton: false,
            homeButton: false,
            sceneModePicker: false,
            baseLayerPicker: false,
            navigationHelpButton: false,
            geocoder: false,
            terrainProvider: new Cesium.EllipsoidTerrainProvider(),
            imageryProvider: false
        });
        
        this.viewer.scene.globe.show = true;
        this.viewer.scene.skyBox.show = true;
    }
    
    async loadCZML() {
        const files = [
            './assets/data/LEO_shell.czml',
            './assets/data/MEO_shell.czml',
            './assets/data/GEO_shell.czml'
        ];
        
        for (const file of files) {
            try {
                const dataSource = await Cesium.CzmlDataSource.load(file);
                this.viewer.dataSources.add(dataSource);
                console.log(`Loaded ${file}`);
            } catch (error) {
                console.warn(`Failed to load ${file}:`, error);
            }
        }
        
        this.viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(0, 0, 50000000)
        });
        
        const loading = document.getElementById('orbital-loading');
        if (loading) loading.style.display = 'none';
    }
    
    showError(message) {
        const container = document.getElementById('cesiumContainer');
        if (container) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                           background: #1a1a1a; color: #ff6b35; font-family: Inter, sans-serif;">
                    <div style="text-align: center; padding: 2rem;">
                        <h3>Visualization Unavailable</h3>
                        <p>${message}</p>
                    </div>
                </div>
            `;
        }
    }
}

// Simple initialization
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('cesiumContainer');
    if (container) {
        setTimeout(() => {
            new SimpleOrbitalVisualization();
        }, 1000);
    }
});