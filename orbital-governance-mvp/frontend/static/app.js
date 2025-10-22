// Orbital Governance Demo JavaScript
class OrbitalDemo {
    constructor() {
        this.allSatellites = [];
        this.filteredSatellites = [];
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Extra-Orbital Solutions Demo');
        
        await this.loadStats();
        await this.loadSatellites();
        this.setupEventListeners();
        this.setupTractSelection();
        
        console.log('✅ Demo initialization complete');
        
        // Refresh data every 30 seconds
        setInterval(() => {
            console.log('🔄 Auto-refreshing data...');
            this.loadStats();
            this.loadSatellites();
            this.updateTimestamp();
        }, 30000);
        
        // Update timestamp immediately
        this.updateTimestamp();
    }

    async loadStats() {
        try {
            console.log('📊 Loading system statistics...');
            const response = await fetch('/api/stats');
            const stats = await response.json();
            
            console.log('📈 Stats loaded:', stats);
            
            // Animate numbers counting up
            this.animateNumber('total-tracts', stats.total_tracts);
            this.animateNumber('active-satellites', stats.active_satellites);
            this.animateNumber('available-spaces', stats.available_tracts);
            
            // Calculate collision risk
            this.updateCollisionRisk(stats.active_satellites, stats.total_tracts);
        } catch (error) {
            console.error('❌ Error loading stats:', error);
            document.getElementById('total-tracts').innerHTML = '<span style="color: #ef4444;">Error</span>';
            document.getElementById('active-satellites').innerHTML = '<span style="color: #ef4444;">Error</span>';
            document.getElementById('available-spaces').innerHTML = '<span style="color: #ef4444;">Error</span>';
            document.getElementById('collision-risk').innerHTML = '<span style="color: #ef4444;">Error</span>';
        }
    }
    
    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const duration = 2000; // 2 seconds
        const startTime = performance.now();
        const startValue = 0;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
            
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    async loadSatellites() {
        try {
            console.log('🛰️ Loading satellite data...');
            const response = await fetch('/api/satellites');
            const satellites = await response.json();
            
            console.log(`📡 Loaded ${satellites.length} satellites`);
            this.allSatellites = satellites;
            
            if (satellites.length === 0) {
                console.warn('⚠️ No satellite data available');
                document.getElementById('satellite-list').innerHTML = '<div class="loading-container"><span>No satellite data available</span></div>';
                return;
            }
            
            // Preserve current search filter
            const currentSearch = document.getElementById('satellite-search').value;
            if (currentSearch.trim()) {
                console.log('🔍 Preserving search filter:', currentSearch);
                this.filterSatellites(currentSearch);
            } else {
                this.filteredSatellites = satellites;
                this.updateSatelliteStats(satellites);
                this.renderSatellites(this.filteredSatellites);
            }
        } catch (error) {
            console.error('❌ Error loading satellites:', error);
            document.getElementById('satellite-list').innerHTML = `
                <div class="loading-container" style="color: #ef4444;">
                    <span>Error loading satellite data</span>
                </div>
            `;
        }
    }

    updateTimestamp() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        document.getElementById('last-update').textContent = `Last updated: ${timeString}`;
    }
    
    updateCollisionRisk(activeSatellites, totalTracts) {
        const density = activeSatellites / totalTracts;
        let riskLevel, riskColor, riskDescription;
        
        if (density > 0.15) {
            riskLevel = 'HIGH';
            riskColor = '#ef4444';
            riskDescription = 'High density regions';
        } else if (density > 0.08) {
            riskLevel = 'MEDIUM';
            riskColor = '#f59e0b';
            riskDescription = 'Moderate congestion';
        } else {
            riskLevel = 'LOW';
            riskColor = '#10b981';
            riskDescription = 'Safe orbital spacing';
        }
        
        document.getElementById('collision-risk').innerHTML = `<span style="color: ${riskColor};">${riskLevel}</span>`;
        document.getElementById('risk-description').textContent = riskDescription;
    }
    
    updateSatelliteStats(satellites) {
        const starlink = satellites.filter(sat => 
            sat.name && sat.name.toLowerCase().includes('starlink')
        ).length;
        const oneweb = satellites.filter(sat => 
            sat.name && sat.name.toLowerCase().includes('oneweb')
        ).length;
        const other = satellites.length - starlink - oneweb;
        
        document.getElementById('total-count').textContent = satellites.length;
        document.getElementById('starlink-count').textContent = starlink;
        document.getElementById('oneweb-count').textContent = oneweb;
        document.getElementById('other-count').textContent = other;
    }
    
    renderSatellites(satellites) {
        const listElement = document.getElementById('satellite-list');
        
        listElement.innerHTML = satellites.map(sat => `
            <div class="satellite-item">
                <div class="satellite-header">
                    <strong>${sat.name}</strong>
                    <span class="satellite-status">• Active</span>
                </div>
                <div class="satellite-details">
                    <span class="detail-item">ALT: ${sat.altitude}km</span>
                    <span class="detail-item">INC: ${sat.inclination}°</span>
                    <span class="detail-item">LAT: ${sat.latitude}°</span>
                    <span class="detail-item">LON: ${sat.longitude}°</span>
                </div>
            </div>
        `).join('');
    }
    
    filterSatellites(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredSatellites = this.allSatellites;
        } else {
            this.filteredSatellites = this.allSatellites.filter(sat => {
                const searchLower = searchTerm.toLowerCase();
                return sat.name && sat.name.toLowerCase().includes(searchLower);
            });
        }
        
        this.renderSatellites(this.filteredSatellites);
        this.updateSatelliteStats(this.filteredSatellites);
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('satellite-search').addEventListener('input', (e) => {
            this.filterSatellites(e.target.value);
        });
        
        // Tract search form
        document.getElementById('reservation-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const altitude = document.getElementById('altitude').value;
            const inclination = document.getElementById('inclination').value;
            const button = document.querySelector('.search-button');
            
            // Show loading state
            button.disabled = true;
            button.innerHTML = '<span class="loading"></span> Searching...';
            
            try {
                const response = await fetch(`/api/tracts/available?altitude=${altitude}&inclination=${inclination}`);
                const tracts = await response.json();
                
                const resultsElement = document.getElementById('reservation-results');
                
                if (tracts.length > 0) {
                    resultsElement.innerHTML = `
                        <div class="results-header">
                            <h3>✅ Found ${tracts.length} Available Orbital Tracts</h3>
                            <p class="results-description">These orbital spaces match your mission parameters and are currently available for reservation.</p>
                        </div>
                        <div class="results-grid">
                            ${tracts.map(tract => `
                                <div class="tract-result">
                                    <div class="tract-header">
                                        <strong>${tract.tract_id}</strong>
                                        <span class="availability-badge">Available</span>
                                    </div>
                                    <div class="tract-details">
                                        <div class="detail-row">
                                            <span class="detail-label">Altitude:</span>
                                            <span class="detail-value">${tract.altitude_range}</span>
                                        </div>
                                        <div class="detail-row">
                                            <span class="detail-label">Inclination:</span>
                                            <span class="detail-value">${tract.inclination_range}</span>
                                        </div>
                                        <div class="detail-row">
                                            <span class="detail-label">RAAN:</span>
                                            <span class="detail-value">${tract.raan_range}</span>
                                        </div>
                                    </div>
                                    <button class="select-tract-btn" data-tract-id="${tract.tract_id}">
                                        🎯 Select This Tract
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else {
                    resultsElement.innerHTML = `
                        <div class="no-results">
                            <h3>❌ No Available Spaces Found</h3>
                            <p>No orbital tracts match your current parameters. Try adjusting your altitude or inclination requirements.</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error finding tracts:', error);
                const resultsElement = document.getElementById('reservation-results');
                resultsElement.innerHTML = `
                    <div class="error-message">
                        <h3>❌ Search Error</h3>
                        <p>Unable to search for available tracts. Please try again.</p>
                    </div>
                `;
            } finally {
                // Re-enable the button
                button.disabled = false;
                button.innerHTML = '🔍 Search Available Orbital Tracts';
            }
        });
        
        // Satellite registration form
        document.getElementById('registration-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const satelliteName = document.getElementById('satellite-name').value;
            const operator = document.getElementById('operator').value;
            const tractId = document.getElementById('tract-id').value;
            const missionType = document.getElementById('mission-type').value;
            const button = document.querySelector('.register-button');
            
            // Show loading state
            button.disabled = true;
            button.innerHTML = '<span class="loading"></span> Processing Registration...';
            
            try {
                const response = await fetch('/api/satellites/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        satellite_name: satelliteName,
                        operator: operator,
                        tract_id: tractId,
                        mission_type: missionType
                    })
                });
                
                const result = await response.json();
                const resultsElement = document.getElementById('registration-results');
                
                if (response.ok) {
                    resultsElement.innerHTML = `
                        <div class="registration-success">
                            <h3>✅ Registration Approved</h3>
                            <div class="registration-details">
                                <div class="detail-row">
                                    <span class="detail-label">Registration ID:</span>
                                    <span class="detail-value">${result.registration_id}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Satellite:</span>
                                    <span class="detail-value">${result.satellite_name}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Operator:</span>
                                    <span class="detail-value">${result.operator}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Assigned Tract:</span>
                                    <span class="detail-value">${result.tract_id}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Mission Type:</span>
                                    <span class="detail-value">${result.mission_type}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Status:</span>
                                    <span class="detail-value status-approved">${result.status}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Registered:</span>
                                    <span class="detail-value">${new Date(result.registered_at).toLocaleString()}</span>
                                </div>
                            </div>
                            <p class="governance-note">
                                🌐 Your satellite is now officially registered in the orbital governance system. 
                                Launch coordination and traffic management protocols are active.
                            </p>
                        </div>
                    `;
                    
                    // Clear form
                    document.getElementById('registration-form').reset();
                } else {
                    resultsElement.innerHTML = `
                        <div class="registration-error">
                            <h3>❌ Registration Failed</h3>
                            <p>${result.error}</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error registering satellite:', error);
                const resultsElement = document.getElementById('registration-results');
                resultsElement.innerHTML = `
                    <div class="registration-error">
                        <h3>❌ Registration Error</h3>
                        <p>Unable to process registration. Please try again.</p>
                    </div>
                `;
            } finally {
                // Re-enable the button
                button.disabled = false;
                button.innerHTML = '📝 Register Satellite';
            }
        });
    }
    
    setupTractSelection() {
        // Handle tract selection buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('select-tract-btn')) {
                console.log('🎯 Tract selection button clicked');
                const tractId = e.target.dataset.tractId;
                console.log('📋 Selected tract ID:', tractId);
                
                const tractInput = document.getElementById('tract-id');
                if (tractInput) {
                    tractInput.value = tractId;
                    console.log('✅ Tract ID populated in form:', tractId);
                    
                    // Scroll to registration section
                    const registrationSection = document.querySelector('.registration-system');
                    if (registrationSection) {
                        registrationSection.scrollIntoView({ behavior: 'smooth' });
                        console.log('📍 Scrolled to registration section');
                    }
                    
                    // Highlight the input field briefly
                    tractInput.style.borderColor = '#10b981';
                    setTimeout(() => {
                        tractInput.style.borderColor = '';
                    }, 2000);
                } else {
                    console.error('❌ Could not find tract-id input field');
                }
            }
        });
    }
}

// Initialize demo when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 Extra-Orbital Solutions loading...');
    new OrbitalDemo();
});