class StatusDashboard {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        
        // Define categories explicitly
        this.categories = {
            'services': { name: 'Services & Bots', icon: '🛠️', services: [] },
            'games': { name: 'Game Servers', icon: '🎮', services: [] },
            'websites': { name: 'Websites', icon: '🌐', services: [] }
        };
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Status Dashboard...');
        this.setupEventListeners();
        this.setupModal();
        this.connectWebSocket();
        this.loadInitialData();
        
        // Show demo data after a short delay if nothing loads
        setTimeout(() => {
            if (document.querySelectorAll('.service-card').length === 0) {
                console.log('🔄 No data loaded, showing demo data...');
                this.showDemoData();
            }
        }, 3000);
    }

    async loadInitialData() {
        try {
            console.log('📡 Fetching initial data from /api/status...');
            const response = await fetch('/api/status');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            console.log('✅ Initial data loaded:', data);
            this.updateDashboard(data);
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            this.showPlaceholderData();
            this.showDemoData(); // Show demo data on failure
        }
    }

    showPlaceholderData() {
        console.log('🔄 Showing placeholder data...');
        document.getElementById('onlineCount').textContent = '0';
        document.getElementById('offlineCount').textContent = '0';
        document.getElementById('totalCount').textContent = '0';
        
        Object.keys(this.categories).forEach(category => {
            const countElement = document.getElementById(`${category}-count`);
            const grid = document.getElementById(`${category}-grid`);
            if (countElement) countElement.textContent = '0/0';
            if (grid) grid.innerHTML = '<div class="loading-text">Loading services...</div>';
        });
    }

    showDemoData() {
        console.log('🎭 Loading demo data...');
        const demoData = {
            summary: {
                online: 8,
                total: 12,
                lastUpdate: new Date().toISOString(),
                websiteUrl: 'live-monitor.ankitgupta.com.np'
            },
            services: [
                // Services & Bots
                {
                    name: "Music Bot",
                    type: "heartbeat",
                    status: true,
                    uptime: "3m",
                    category: "services",
                    port: "25579",
                    inviteLink: "https://discord.com/oauth2/authorize?client_id=1071659415289200771",
                    icon: "🎵",
                    lastHeartbeat: Date.now() - 15000
                },
                {
                    name: "DTEmpire Bot",
                    type: "heartbeat",
                    status: true,
                    uptime: "2h",
                    category: "services",
                    port: "25580",
                    inviteLink: "https://discord.com/oauth2/authorize?client_id=1172206793972269177",
                    icon: "🤖",
                    lastHeartbeat: Date.now() - 10000
                },
                {
                    name: "Moderation Bot",
                    type: "heartbeat",
                    status: false,
                    uptime: "0s",
                    category: "services",
                    port: "25581",
                    icon: "🛡️",
                    lastHeartbeat: Date.now() - 120000
                },

                // Game Servers
                {
                    name: "Minecraft Survival",
                    type: "port",
                    status: true,
                    uptime: "5h",
                    category: "games",
                    ip: "mc.dtempire.com",
                    port: "25565",
                    icon: "⛏️",
                    lastHeartbeat: Date.now() - 5000
                },
                {
                    name: "CS:GO Server",
                    type: "port",
                    status: true,
                    uptime: "1h",
                    category: "games",
                    ip: "csgo.dtempire.com",
                    port: "27015",
                    icon: "🔫",
                    lastHeartbeat: Date.now() - 8000
                },
                {
                    name: "Rust Server",
                    type: "port",
                    status: false,
                    uptime: "0s",
                    category: "games",
                    ip: "rust.dtempire.com",
                    port: "28015",
                    icon: "🦀",
                    lastHeartbeat: Date.now() - 180000
                },
                {
                    name: "GTA V RP",
                    type: "port",
                    status: true,
                    uptime: "12h",
                    category: "games",
                    ip: "gtav.dtempire.com",
                    port: "30120",
                    icon: "🚗",
                    lastHeartbeat: Date.now() - 3000
                },

                // Websites
                {
                    name: "DTEmpire Main",
                    type: "http",
                    status: true,
                    uptime: "24h",
                    category: "websites",
                    url: "https://dtempire.com",
                    icon: "🌐",
                    lastHeartbeat: Date.now() - 2000
                },
                {
                    name: "Community Forum",
                    type: "http",
                    status: true,
                    uptime: "18h",
                    category: "websites",
                    url: "https://forum.dtempire.com",
                    icon: "💬",
                    lastHeartbeat: Date.now() - 4000
                },
                {
                    name: "Documentation",
                    type: "http",
                    status: false,
                    uptime: "0s",
                    category: "websites",
                    url: "https://docs.dtempire.com",
                    icon: "📚",
                    lastHeartbeat: Date.now() - 300000
                },
                {
                    name: "Status Page",
                    type: "http",
                    status: true,
                    uptime: "24h",
                    category: "websites",
                    url: "https://status.dtempire.com",
                    icon: "📊",
                    lastHeartbeat: Date.now() - 1000
                }
            ]
        };

        this.updateDashboard(demoData);
        
        // Update connection status to show it's demo data
        const connectionElement = document.getElementById('connectionStatus');
        if (connectionElement) {
            connectionElement.innerHTML = '🔶 <span class="pulse"></span> Displaying Demo Data - Waiting for live connection...';
            connectionElement.className = 'connecting';
        }
    }

    setupModal() {
        this.modal = document.getElementById('serviceModal');
        this.closeModal = document.querySelector('.close-modal');
        
        if (this.closeModal) {
            this.closeModal.onclick = () => {
                this.closeServiceModal();
            };
        }
        
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.closeServiceModal();
            }
        };
    }

    closeServiceModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('🌐 Connected to live updates');
                this.updateConnectionStatus('connected');
                this.reconnectAttempts = 0;
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 WebSocket message received:', data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('🔌 Disconnected from live updates');
                this.updateConnectionStatus('disconnected');
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.updateConnectionStatus('error');
            };
            
        } catch (error) {
            console.error('❌ Failed to connect:', error);
            this.updateConnectionStatus('error');
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.updateConnectionStatus('connecting');
            
            setTimeout(() => {
                this.connectWebSocket();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.updateConnectionStatus('failed');
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'fullUpdate':
            case 'statusUpdate':
                console.log('🔄 Updating dashboard with new data');
                this.updateDashboard(data.data);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    updateDashboard(statusData) {
        if (!statusData) {
            console.error('❌ No status data received');
            return;
        }
        
        console.log('📊 Updating dashboard with data:', statusData);
        
        this.updateSummary(statusData.summary);
        this.updateServices(statusData.services || statusData.categories);
        this.updateLastUpdate(statusData.summary.lastUpdate);
        this.updateWebsiteUrl(statusData.summary.websiteUrl);
    }

    updateSummary(summary) {
        if (summary) {
            console.log('📈 Updating summary:', summary);
            document.getElementById('onlineCount').textContent = summary.online || '0';
            document.getElementById('offlineCount').textContent = (summary.total - summary.online) || '0';
            document.getElementById('totalCount').textContent = summary.total || '0';
        }
    }

    updateServices(servicesData) {
        console.log('🔄 Updating services with:', servicesData);
        
        // Reset categories
        Object.keys(this.categories).forEach(category => {
            this.categories[category].services = [];
        });

        let allServices = [];

        // Handle both data formats: flat array or categorized object
        if (Array.isArray(servicesData)) {
            // Format 1: Flat array with category property
            console.log('📋 Processing flat array format');
            allServices = servicesData;
        } else if (typeof servicesData === 'object') {
            // Format 2: Categorized object {services: [], games: [], websites: []}
            console.log('📋 Processing categorized object format');
            Object.keys(servicesData).forEach(category => {
                if (Array.isArray(servicesData[category])) {
                    servicesData[category].forEach(service => {
                        service.category = category;
                        allServices.push(service);
                    });
                }
            });
        } else {
            console.error('❌ Unknown services data format:', servicesData);
            return;
        }

        console.log(`📊 Total services to display: ${allServices.length}`);

        // Categorize services
        allServices.forEach(service => {
            const category = service.category || 'services';
            if (this.categories[category]) {
                this.categories[category].services.push(service);
            } else {
                // Default to services category if unknown
                this.categories.services.services.push(service);
            }
        });

        // Update each category display
        Object.keys(this.categories).forEach(category => {
            this.updateCategoryDisplay(category, this.categories[category].services);
        });
    }

    updateCategoryDisplay(category, services) {
        const grid = document.getElementById(`${category}-grid`);
        const countElement = document.getElementById(`${category}-count`);
        
        if (!grid || !countElement) {
            console.error(`❌ Could not find elements for category: ${category}`);
            return;
        }
        
        // Clear the grid
        grid.innerHTML = '';
        
        if (!services || services.length === 0) {
            console.log(`ℹ️ No services in category: ${category}`);
            grid.innerHTML = '<div class="no-services">No services in this category</div>';
            countElement.textContent = '0/0';
            return;
        }
        
        const onlineCount = services.filter(s => s.status).length;
        const totalCount = services.length;
        
        console.log(`📊 ${category}: ${onlineCount}/${totalCount} services online`);
        
        countElement.textContent = `${onlineCount}/${totalCount}`;
        
        // Add each service to the grid
        services.forEach(service => {
            const serviceCard = this.createServiceCard(service);
            grid.appendChild(serviceCard);
        });
    }

    createServiceCard(service) {
        const card = document.createElement('div');
        card.className = `service-card ${service.status ? 'online' : 'offline'}`;
        card.setAttribute('data-service', service.name);
        
        card.innerHTML = `
            <div class="service-header">
                <div class="service-icon">${service.icon || '📊'}</div>
                <div class="service-name">${service.name}</div>
                <div class="status-indicator ${service.status ? 'status-online' : 'status-offline'}">
                    ${service.status ? 'ONLINE' : 'OFFLINE'}
                </div>
            </div>
            <div class="service-details">
                <div class="detail-item">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${this.formatServiceType(service.type)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Uptime:</span>
                    <span class="detail-value">${service.uptime || '0s'}</span>
                </div>
                ${service.lastHeartbeat ? `
                <div class="detail-item">
                    <span class="detail-label">Last Heartbeat:</span>
                    <span class="detail-value">${this.formatTimeSince(service.lastHeartbeat)}</span>
                </div>
                ` : ''}
            </div>
        `;
        
        // Add click event to show modal
        card.addEventListener('click', () => {
            this.showServiceModal(service);
        });
        
        return card;
    }

    showServiceModal(service) {
        if (!this.modal) return;
        
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        if (!modalTitle || !modalContent) return;
        
        // Clean modal title - just service name and icon
        modalTitle.innerHTML = `
            ${service.icon || '📊'} ${service.name}
        `;
        
        // Get the actual data from the service object - FIXED DATA EXTRACTION
        const serviceType = this.formatServiceType(service.type);
        const status = service.status ? 'ONLINE' : 'OFFLINE';
        const uptime = service.uptime || '0s';
        const category = this.formatCategory(service.category);
        
        // Get data from service.details (real backend data) OR service (demo data)
        const details = service.details || service;
        const port = details.port || 'N/A';
        const inviteLink = details.inviteLink;
        const websiteUrl = details.url || details.website;
        const ipAddress = details.ip || details.host;
        const password = details.password;
        const description = details.description;

        console.log('🔍 Modal service details:', details); // Debug log

        let content = `
            <div class="service-info">
                <div class="info-item">
                    <span class="info-label">Type:</span>
                    <span class="info-value">${serviceType}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Status:</span>
                    <span class="status-badge ${service.status ? 'badge-online' : 'badge-offline'}">
                        ${service.status ? '🟢 ONLINE' : '🔴 OFFLINE'}
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-label">Uptime:</span>
                    <span class="info-value">${uptime}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Category:</span>
                    <span class="info-value">${category}</span>
                </div>
        `;

        // Add description if available
        if (description) {
            content += `
                <div class="info-item">
                    <span class="info-label">Description:</span>
                    <span class="info-value">${description}</span>
                </div>
            `;
        }

        // LAVALINK - Show full connection details
        if (service.type === 'lavalink') {
            if (ipAddress) {
                content += `
                    <div class="info-item">
                        <span class="info-label">Host:</span>
                        <span class="info-value code" data-copy="${ipAddress}">${ipAddress}</span>
                    </div>
                `;
            }
            if (port && port !== 'N/A') {
                content += `
                    <div class="info-item">
                        <span class="info-label">Port:</span>
                        <span class="info-value code" data-copy="${port}">${port}</span>
                    </div>
                `;
            }
            if (password) {
                content += `
                    <div class="info-item">
                        <span class="info-label">Password:</span>
                        <span class="info-value code" data-copy="${password}">${password}</span>
                    </div>
                `;
            }
            if (ipAddress && port && port !== 'N/A') {
                content += `
                    <div class="info-item">
                        <span class="info-label">Connection:</span>
                        <span class="info-value code" data-copy="${ipAddress}:${port}">${ipAddress}:${port}</span>
                    </div>
                `;
            }
        }
        // GAME SERVERS - Show IP and Port for connection
        else if (service.category === 'games') {
            if (ipAddress) {
                content += `
                    <div class="info-item">
                        <span class="info-label">IP Address:</span>
                        <span class="info-value code" data-copy="${ipAddress}">${ipAddress}</span>
                    </div>
                `;
            }
            if (port && port !== 'N/A') {
                content += `
                    <div class="info-item">
                        <span class="info-label">Port:</span>
                        <span class="info-value code" data-copy="${port}">${port}</span>
                    </div>
                `;
            }
            if (ipAddress && port && port !== 'N/A') {
                content += `
                    <div class="info-item">
                        <span class="info-label">Connect:</span>
                        <span class="info-value code" data-copy="${ipAddress}:${port}">${ipAddress}:${port}</span>
                    </div>
                `;
            }
        }
        // WEBSITES & APIS - Show website URL
        else if (service.category === 'websites' || service.type === 'api') {
            if (websiteUrl) {
                content += `
                    <div class="info-item">
                        <span class="info-label">URL:</span>
                        <span class="info-value">${websiteUrl}</span>
                    </div>
                `;
            }
        }
        // SERVICES & BOTS - Show old layout with port and invite link
        else {
            if (port && port !== 'N/A') {
                content += `
                    <div class="info-item">
                        <span class="info-label">Port:</span>
                        <span class="info-value code" data-copy="${port}">${port}</span>
                    </div>
                `;
            }
            
            const inviteLinkText = inviteLink ? 'Available' : 'Not Available';
            content += `
                <div class="info-item">
                    <span class="info-label">Invite Link:</span>
                    <span class="info-value">${inviteLinkText}</span>
                </div>
            `;
        }

        content += `</div><div class="modal-actions">`;

        // Action buttons based on category and type
        if (service.status) {
            // Lavalink - Copy connection info
            if (service.type === 'lavalink' && ipAddress && port && port !== 'N/A') {
                content += `
                    <button class="btn primary copy-connection-btn">
                        <i class="fas fa-copy"></i>
                        Copy Connection
                    </button>
                `;
                if (websiteUrl) {
                    content += `
                        <a href="${websiteUrl}" target="_blank" class="btn primary">
                            <i class="fas fa-external-link-alt"></i>
                            Dashboard
                        </a>
                    `;
                }
            }
            // Game Servers - Copy connection info
            else if (service.category === 'games' && ipAddress && port && port !== 'N/A') {
                content += `
                    <button class="btn primary copy-connection-btn">
                        <i class="fas fa-copy"></i>
                        Copy Connection
                    </button>
                `;
            }
            // Websites & APIs - Visit website
            else if ((service.category === 'websites' || service.type === 'api') && websiteUrl) {
                content += `
                    <a href="${websiteUrl}" target="_blank" class="btn primary">
                        <i class="fas fa-external-link-alt"></i>
                        ${service.type === 'api' ? 'API Docs' : 'Visit Website'}
                    </a>
                `;
            }
            // Services & Bots - Invite bot
            else if (inviteLink) {
                content += `
                    <a href="${inviteLink}" target="_blank" class="btn primary">
                        <i class="fab fa-discord"></i>
                        Invite Bot
                    </a>
                `;
            }
        }

        content += `
            <button class="btn secondary" onclick="statusDashboard.closeServiceModal()">
                <i class="fas fa-times"></i>
                Close
            </button>
        </div>`;

        modalContent.innerHTML = content;
        this.addCopyFunctionality();
        
        // Add specific event listeners
        if ((service.type === 'lavalink' || service.category === 'games') && ipAddress && port && port !== 'N/A') {
            this.addGameServerCopyFunctionality(ipAddress, port);
        }
        
        this.modal.style.display = 'block';
    }

    addGameServerCopyFunctionality(ip, port) {
        const copyBtn = document.querySelector('.copy-connection-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                const connectionString = `${ip}:${port}`;
                try {
                    // Method 1: Modern clipboard API
                    await navigator.clipboard.writeText(connectionString);
                    
                    // Visual feedback
                    const originalHTML = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    copyBtn.style.background = 'linear-gradient(45deg, #00ff88, #00ccff)';
                    copyBtn.style.color = '#000';
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                        copyBtn.style.background = '';
                        copyBtn.style.color = '';
                    }, 2000);
                    
                    console.log('✅ Connection copied to clipboard:', connectionString);
                    
                } catch (err) {
                    console.error('❌ Clipboard API failed, trying fallback...', err);
                    
                    // Method 2: Fallback using execCommand
                    const textArea = document.createElement('textarea');
                    textArea.value = connectionString;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    try {
                        const successful = document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        if (successful) {
                            // Visual feedback for fallback
                            const originalHTML = copyBtn.innerHTML;
                            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                            copyBtn.style.background = 'linear-gradient(45deg, #00ff88, #00ccff)';
                            copyBtn.style.color = '#000';
                            
                            setTimeout(() => {
                                copyBtn.innerHTML = originalHTML;
                                copyBtn.style.background = '';
                                copyBtn.style.color = '';
                            }, 2000);
                            console.log('✅ Connection copied (fallback method):', connectionString);
                        } else {
                            throw new Error('Fallback copy failed');
                        }
                    } catch (fallbackErr) {
                        console.error('❌ Fallback copy also failed:', fallbackErr);
                        
                        // Method 3: Last resort - show the text to user
                        const originalHTML = copyBtn.innerHTML;
                        copyBtn.innerHTML = '<i class="fas fa-exclamation"></i> Select & Copy';
                        copyBtn.style.background = 'rgba(255, 68, 68, 0.3)';
                        
                        // Create a temporary visible element with the text
                        const tempDiv = document.createElement('div');
                        tempDiv.style.position = 'fixed';
                        tempDiv.style.top = '50%';
                        tempDiv.style.left = '50%';
                        tempDiv.style.transform = 'translate(-50%, -50%)';
                        tempDiv.style.background = '#1a1a2e';
                        tempDiv.style.padding = '20px';
                        tempDiv.style.border = '2px solid #00ff88';
                        tempDiv.style.borderRadius = '10px';
                        tempDiv.style.zIndex = '10000';
                        tempDiv.innerHTML = `
                            <h3>Copy Connection Info</h3>
                            <p style="margin: 10px 0; padding: 10px; background: #000; border-radius: 5px; font-family: monospace;">${connectionString}</p>
                            <p>Select the text above and copy manually (Ctrl+C)</p>
                            <button onclick="this.parentElement.remove()" style="padding: 8px 16px; background: #ff4444; border: none; border-radius: 5px; color: white; cursor: pointer;">Close</button>
                        `;
                        document.body.appendChild(tempDiv);
                        
                        setTimeout(() => {
                            copyBtn.innerHTML = originalHTML;
                            copyBtn.style.background = '';
                        }, 4000);
                    }
                }
            });
        }
    }

    addCopyFunctionality() {
        const codeElements = document.querySelectorAll('.info-value.code');
        codeElements.forEach(element => {
            element.addEventListener('click', async (e) => {
                const text = e.target.getAttribute('data-copy') || e.target.textContent;
                try {
                    await navigator.clipboard.writeText(text);
                    const originalText = e.target.textContent;
                    e.target.textContent = 'Copied!';
                    e.target.style.background = 'rgba(0, 255, 136, 0.3)';
                    setTimeout(() => {
                        e.target.textContent = originalText;
                        e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                }
            });
        });
    }

    formatServiceType(type) {
        const types = {
            'heartbeat': 'TCP Heartbeat',
            'port': 'Port Check',
            'http': 'HTTP Check',
            'tcp': 'TCP Heartbeat',
            'api': 'API Endpoint',
            'lavalink': 'Lavalink Server'
        };
        return types[type] || type || 'Unknown';
    }

    formatCategory(category) {
        const categories = {
            'services': 'Services & Bots',
            'games': 'Game Servers',
            'websites': 'Websites'
        };
        return categories[category] || category || 'Services';
    }

    formatTimeSince(timestamp) {
        if (!timestamp) return 'Never';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    }

    updateLastUpdate(timestamp) {
        if (timestamp && document.getElementById('lastUpdate')) {
            const date = new Date(timestamp);
            const formatted = date.toLocaleString();
            document.getElementById('lastUpdate').textContent = formatted;
        }
    }

    updateWebsiteUrl(url) {
        if (url && document.getElementById('websiteUrl')) {
            document.getElementById('websiteUrl').textContent = url.replace('https://', '');
        }
    }

    updateConnectionStatus(status) {
        const element = document.getElementById('connectionStatus');
        if (!element) return;
        
        const messages = {
            'connected': '✅ Connected to live updates',
            'connecting': '🔄 Connecting to live updates...',
            'disconnected': '🔌 Disconnected - Attempting to reconnect...',
            'error': '❌ Connection error - Retrying...',
            'failed': '❌ Failed to connect to live updates'
        };
        
        element.textContent = messages[status] || status;
        element.className = status;
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeServiceModal();
            }
        });
    }
}

// Initialize the dashboard when the page loads
let statusDashboard;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM Content Loaded - Starting dashboard...');
    statusDashboard = new StatusDashboard();
});