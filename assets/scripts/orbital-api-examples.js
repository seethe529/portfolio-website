/**
 * Orbital Governance API Integration Examples
 * Ready-to-use code snippets for developers
 */

const ORBITAL_API = {
    BASE_URL: 'https://u46atxc2al.execute-api.us-east-1.amazonaws.com/prod',
    
    // Get all available orbital tracts
    async getTracts() {
        try {
            const response = await fetch(`${this.BASE_URL}/tracts`);
            const data = await response.json();
            return {
                success: true,
                tracts: data.tracts,
                count: data.count
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // Register a satellite to a specific tract
    async registerSatellite(satelliteName, tractId, operator = 'Unknown', missionType = 'general') {
        try {
            const response = await fetch(`${this.BASE_URL}/satellites/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    satellite_name: satelliteName,
                    tract_id: tractId,
                    operator: operator,
                    mission_type: missionType
                })
            });
            
            const data = await response.json();
            return {
                success: response.ok,
                data: data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // Reserve an orbital tract
    async reserveTract(tractId, operator, duration = 24) {
        try {
            const response = await fetch(`${this.BASE_URL}/tracts/reserve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tract_id: tractId,
                    operator: operator,
                    duration_hours: duration
                })
            });
            
            const data = await response.json();
            return {
                success: response.ok,
                data: data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // Filter tracts by orbital zone
    filterTractsByZone(tracts, zone) {
        return tracts.filter(tract => tract.orbit_zone === zone);
    },
    
    // Find tracts within altitude range
    filterTractsByAltitude(tracts, minAlt, maxAlt) {
        return tracts.filter(tract => 
            parseInt(tract.alt_min) >= minAlt && 
            parseInt(tract.alt_max) <= maxAlt
        );
    },
    
    // Parse tract ID components
    parseTractId(tractId) {
        const parts = tractId.split('-');
        if (parts.length !== 4) return null;
        
        const [zone, altPart, incPart, raanPart] = parts;
        const altitude = parseInt(altPart.replace('A', ''));
        const inclination = parseInt(incPart.replace('I', ''));
        const [raanMin, raanMax] = raanPart.replace('RAAN', '').split('_').map(Number);
        
        return {
            zone,
            altitude,
            inclination,
            raanRange: [raanMin, raanMax]
        };
    }
};

// Usage Examples:

// Example 1: Load and display all tracts
async function loadAllTracts() {
    const result = await ORBITAL_API.getTracts();
    if (result.success) {
        console.log(`Found ${result.count} orbital tracts`);
        result.tracts.forEach(tract => {
            console.log(`${tract.tract_id}: ${tract.orbit_zone} zone, ${tract.alt_min}-${tract.alt_max}km`);
        });
    } else {
        console.error('Failed to load tracts:', result.error);
    }
}

// Example 2: Register a satellite
async function registerTestSatellite() {
    const result = await ORBITAL_API.registerSatellite(
        'TestSat-1',
        'LEO-A1000-I0-RAAN0_5',
        'Demo Operator',
        'testing'
    );
    
    if (result.success) {
        console.log('Satellite registered successfully:', result.data);
    } else {
        console.error('Registration failed:', result.error);
    }
}

// Example 3: Find LEO tracts
async function findLEOTracts() {
    const result = await ORBITAL_API.getTracts();
    if (result.success) {
        const leoTracts = ORBITAL_API.filterTractsByZone(result.tracts, 'LEO');
        console.log(`Found ${leoTracts.length} LEO tracts`);
        return leoTracts;
    }
    return [];
}

// Example 4: Reserve a tract
async function reserveOrbitalSpace() {
    const result = await ORBITAL_API.reserveTract(
        'LEO-A1000-I0-RAAN0_5',
        'Demo Operator',
        48 // 48 hours
    );
    
    if (result.success) {
        console.log('Tract reserved:', result.data);
    } else {
        console.error('Reservation failed:', result.error);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ORBITAL_API;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.ORBITAL_API = ORBITAL_API;
}