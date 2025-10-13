/**
 * Debug Orbital Visualization - Find crash causes
 */

// Global error handler
window.addEventListener('error', (e) => {
    console.error('GLOBAL ERROR:', e.error, e.filename, e.lineno, e.colno);
    document.body.insertAdjacentHTML('beforeend', 
        `<div style="position:fixed;top:0;left:0;background:red;color:white;padding:10px;z-index:9999;">
            ERROR: ${e.error?.message || 'Unknown error'}
        </div>`);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('UNHANDLED PROMISE REJECTION:', e.reason);
    document.body.insertAdjacentHTML('beforeend', 
        `<div style="position:fixed;top:20px;left:0;background:orange;color:white;padding:10px;z-index:9999;">
            PROMISE ERROR: ${e.reason?.message || 'Unknown promise error'}
        </div>`);
});

class SimpleOrbitalVisualization {
    constructor() {
        console.log('🔍 DEBUG: Constructor called');
        this.viewer = null;
        this.debugStep = 0;
        this.init();
    }
    
    init() {
        console.log('🔍 DEBUG: Init step', ++this.debugStep);
        try {
            console.log('🔍 DEBUG: About to create viewer');
            this.createViewer();
            console.log('🔍 DEBUG: Viewer created, about to load CZML');
            this.loadCZML();
            console.log('🔍 DEBUG: Init completed successfully');
        } catch (error) {
            console.error('🔍 DEBUG: Init failed at step', this.debugStep, error);
            this.showError(`Initialization failed at step ${this.debugStep}: ${error.message}`);
        }
    }
    
    createViewer() {
        console.log('🔍 DEBUG: createViewer step', ++this.debugStep);
        
        console.log('🔍 DEBUG: Checking Cesium availability:', typeof Cesium);
        if (typeof Cesium === 'undefined') {
            throw new Error('Cesium library not loaded');
        }
        
        const container = document.getElementById('cesiumContainer');
        console.log('🔍 DEBUG: Container found:', !!container);
        if (!container) {
            throw new Error('cesiumContainer element not found');
        }
        
        console.log('🔍 DEBUG: Creating Cesium.Viewer...');
        try {
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
            console.log('🔍 DEBUG: Cesium.Viewer created successfully');
        } catch (error) {
            console.error('🔍 DEBUG: Cesium.Viewer creation failed:', error);
            throw error;
        }
        
        console.log('🔍 DEBUG: Setting scene properties...');
        this.viewer.scene.globe.show = true;
        this.viewer.scene.skyBox.show = true;
        console.log('🔍 DEBUG: Scene properties set');
    }
    
    async loadCZML() {
        console.log('🔍 DEBUG: loadCZML step', ++this.debugStep);
        
        const files = [
            './assets/data/LEO_shell.czml',
            './assets/data/MEO_shell.czml',
            './assets/data/GEO_shell.czml'
        ];
        
        console.log('🔍 DEBUG: Loading', files.length, 'CZML files');
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`🔍 DEBUG: Loading file ${i + 1}/${files.length}: ${file}`);
            
            try {
                console.log('🔍 DEBUG: Calling Cesium.CzmlDataSource.load...');
                const dataSource = await Cesium.CzmlDataSource.load(file);
                console.log('🔍 DEBUG: DataSource loaded, adding to viewer...');
                
                this.viewer.dataSources.add(dataSource);
                console.log(`✅ DEBUG: Successfully loaded ${file}`);
            } catch (error) {
                console.error(`❌ DEBUG: Failed to load ${file}:`, error);
                // Continue with other files
            }
        }
        
        console.log('🔍 DEBUG: Setting camera position...');
        try {
            this.viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(0, 0, 50000000)
            });
            console.log('🔍 DEBUG: Camera position set');
        } catch (error) {
            console.error('🔍 DEBUG: Camera positioning failed:', error);
        }
        
        console.log('🔍 DEBUG: Hiding loading indicator...');
        const loading = document.getElementById('orbital-loading');
        if (loading) {
            loading.style.display = 'none';
            console.log('🔍 DEBUG: Loading indicator hidden');
        } else {
            console.log('🔍 DEBUG: Loading indicator not found');
        }
        
        console.log('🔍 DEBUG: loadCZML completed successfully');
    }
    
    showError(message) {
        console.error('🔍 DEBUG: showError called with:', message);
        
        const container = document.getElementById('cesiumContainer');
        if (container) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                           background: #1a1a1a; color: #ff6b35; font-family: Inter, sans-serif;">
                    <div style="text-align: center; padding: 2rem;">
                        <h3>Visualization Unavailable</h3>
                        <p>${message}</p>
                        <p style="font-size: 0.8rem; margin-top: 1rem;">Check browser console for debug info</p>
                    </div>
                </div>
            `;
            console.log('🔍 DEBUG: Error message displayed in container');
        } else {
            console.error('🔍 DEBUG: cesiumContainer not found for error display');
        }
    }
}

// Debug initialization
console.log('🔍 DEBUG: Script loaded, setting up initialization');

document.addEventListener('DOMContentLoady', () => {
    console.log('🔍 DEBUG: DOM loaded');
    
    const container = document.getElementById('cesiumContainer');
    console.log('🔍 DEBUG: cesiumContainer found:', !!container);
    
    if (container) {
        console.log('🔍 DEBUG: Waiting 2 seconds before initialization...');
        setTimeout(() => {
            console.log('🔍 DEBUG: Starting SimpleOrbitalVisualization...');
            try {
                new SimpleOrbitalVisualization();
            } catch (error) {
                console.error('🔍 DEBUG: Failed to create SimpleOrbitalVisualization:', error);
                document.body.insertAdjacentHTML('beforeend', 
                    `<div style="position:fixed;bottom:0;left:0;background:red;color:white;padding:10px;z-index:9999;">
                        INIT ERROR: ${error.message}
                    </div>`);
            }
        }, 2000);
    } else {
        console.error('🔍 DEBUG: cesiumContainer not found!');
    }
});

console.log('🔍 DEBUG: Event listener registered');