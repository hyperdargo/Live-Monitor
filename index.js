console.log('📦 Starting Server Status Dashboard with TCP Heartbeats + Web Interface...');

const discord = require('discord.js');
const net = require('net');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// ========== CONFIGURATION ==========
const BOT_TOKEN = 'BOT_TOKEN';
const CHANNEL_ID = '1443835867692269650';
const WEB_PORT = 25577;
const WEBSITE_URL = 'https://live-monitor.ankitgupta.com.np';
// ========== END CONFIGURATION ==========

const serviceStatus = new Map();
const serviceUptime = new Map();
const lastHeartbeat = new Map();
let statusMessage = null;

// Express app for web dashboard
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use(express.json());

const client = new discord.Client({
    intents: [discord.GatewayIntentBits.Guilds, discord.GatewayIntentBits.GuildMessages]
});

// Services configuration with PROPER CATEGORIES
const SERVICES = [
    // ========== SERVICES & BOTS ==========
    { 
        name: 'Music Bot', 
        type: 'heartbeat', 
        port: 25579,
        category: 'services',
        inviteLink: 'https://discord.com/oauth2/authorize?client_id=1071659415289200771&permissions=3157056&integration_type=0&scope=bot',
        description: 'High-quality music bot with advanced features'
    },
    
    // ========== LAVALINK SERVER ==========
    { 
        name: 'Lavalink v4', 
        type: 'lavalink',
        host: 'panel.ankitgupta.com.np', 
        port: 25574,
        category: 'services',
        password: 'DTEmpire',
        secure: false,
        website: 'https://lavalink.ankitgupta.com.np/',
        description: 'Lavalink audio server for music bots'
    },
    
    // ========== API SERVICES ==========
    { 
        name: 'Image Gen API', 
        type: 'api',
        url: 'https://imggen-api.ankitgupta.com.np/',
        category: 'services',
        description: 'AI Image Generation API endpoint'
    },
    
    // ========== GAME SERVERS ==========
    { 
        name: 'Prominence II: Hasturian Era', 
        type: 'port', 
        host: 'panel.ankitgupta.com.np', 
        port: 25571,
        category: 'games',
        description: 'Prominence II modpack server'
    },
    { 
        name: 'Kreate Mod', 
        type: 'port', 
        host: 'panel.ankitgupta.com.np', 
        port: 25565,
        category: 'games',
        description: 'Kreate mod server'
    },
    { 
        name: 'PhoenixCraft', 
        type: 'port', 
        host: 'panel.ankitgupta.com.np', 
        port: 25572,
        category: 'games',
        description: 'PhoenixCraft server'
    },
    
    // ========== WEBSITES ==========
    { 
        name: 'Portfolio', 
        type: 'http', 
        url: 'https://ankitgupta.com.np',
        category: 'websites',
        description: 'Personal portfolio website'
    },
    { 
        name: 'Image Gen', 
        type: 'http', 
        url: 'https://imggen.ankitgupta.com.np',
        category: 'websites',
        description: 'AI Image Generation web interface'
    },
    { 
        name: 'Asura Anticheat', 
        type: 'http', 
        url: 'https://exam.ankitgupta.com.np/',
        category: 'websites',
        description: 'College Exam Portal With Anti-Cheat Added'
    },
    { 
        name: 'Navidrome', 
        type: 'http', 
        url: 'http://panel.ankitgupta.com.np:4533',
        category: 'websites',
        description: 'Personal music streaming server'
    },
    { 
        name: 'NextCloud', 
        type: 'http', 
        url: 'https://depot.ankitgupta.com.np',
        category: 'websites',
        description: 'Personal cloud storage solution'
    },
    { 
        name: 'SecurePKIChat', 
        type: 'http', 
        url: 'https://chat.ankitgupta.com.np/login',
        category: 'websites',
        description: 'Secure PKI encrypted chat server'
    }
];

// Initialize tracking
SERVICES.forEach(service => {
    serviceUptime.set(service.name, {
        firstOnline: null,
        lastOnline: null,
        totalUptime: 0,
        lastCheck: Date.now()
    });
    lastHeartbeat.set(service.name, 0);
    serviceStatus.set(service.name, false);
});

// WebSocket connections
const webClients = new Set();

wss.on('connection', (ws) => {
    webClients.add(ws);
    console.log('🌐 Web client connected');
    
    // Send current status to new client
    ws.send(JSON.stringify({
        type: 'fullUpdate',
        data: getStatusData()
    }));
    
    ws.on('close', () => {
        webClients.delete(ws);
        console.log('🌐 Web client disconnected');
    });
    
    ws.on('error', (error) => {
        console.log('🌐 WebSocket error:', error.message);
        webClients.delete(ws);
    });
});

// Broadcast to all web clients
function broadcastToWebClients(data) {
    webClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Get formatted status data for web
function getStatusData() {
    const servicesWithStatus = SERVICES.map(service => {
        const status = serviceStatus.get(service.name);
        const uptimeData = serviceUptime.get(service.name);
        
        return {
            name: service.name,
            type: service.type,
            category: service.category,
            status: status,
            uptime: formatUptime(uptimeData),
            icon: getServiceIcon(service),
            lastHeartbeat: service.type === 'heartbeat' ? lastHeartbeat.get(service.name) : null,
            details: service // Include all service details
        };
    });
    
    const onlineCount = servicesWithStatus.filter(s => s.status).length;
    const totalCount = servicesWithStatus.length;
    
    return {
        services: servicesWithStatus,
        summary: {
            online: onlineCount,
            total: totalCount,
            lastUpdate: new Date().toISOString(),
            websiteUrl: WEBSITE_URL
        }
    };
}

// Web routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/status', (req, res) => {
    res.json(getStatusData());
});

// Create TCP servers for heartbeat
function createHeartbeatServer(port, serviceName) {
    const server = net.createServer((socket) => {
        lastHeartbeat.set(serviceName, Date.now());
        console.log(`❤️ Heartbeat received from ${serviceName}`);
        
        serviceStatus.set(serviceName, true);
        broadcastToWebClients({
            type: 'statusUpdate',
            data: getStatusData()
        });
        
        socket.on('data', (data) => {
            console.log(`📨 Data from ${serviceName}: ${data.toString()}`);
        });
        
        socket.on('end', () => {
            console.log(`🔌 ${serviceName} disconnected`);
        });
        
        socket.on('error', (err) => {
            console.log(`❌ Socket error from ${serviceName}:`, err.message);
        });
    });

    server.listen(port, '0.0.0.0', () => {
        console.log(`❤️ Heartbeat server for ${serviceName} listening on port ${port}`);
    });

    server.on('error', (err) => {
        console.log(`❌ Server error for ${serviceName}:`, err.message);
    });
}

// Start heartbeat servers for bot services
SERVICES.filter(service => service.type === 'heartbeat').forEach(service => {
    createHeartbeatServer(service.port, service.name);
});

// Check if service sent heartbeat recently (within 3 minutes)
function checkHeartbeat(serviceName) {
    const lastBeat = lastHeartbeat.get(serviceName);
    const threeMinutesAgo = Date.now() - (3 * 60 * 1000);
    return lastBeat > threeMinutesAgo;
}

// Port Check
function checkPort(host, port, timeout = 5000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const startTime = Date.now();
        
        socket.setTimeout(timeout);
        
        socket.on('connect', () => {
            const responseTime = Date.now() - startTime;
            socket.destroy();
            resolve({ alive: true, time: responseTime });
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve({ alive: false, time: 'Timeout' });
        });
        
        socket.on('error', (error) => {
            socket.destroy();
            resolve({ alive: false, time: error.code || 'Connection Failed' });
        });
        
        socket.connect(port, host);
    });
}

// HTTP Check
async function checkHTTP(url, timeout = 10000) {
    try {
        const { default: axios } = await import('axios');
        const startTime = Date.now();
        const response = await axios.get(url, { 
            timeout,
            validateStatus: function (status) {
                return status >= 200 && status < 600;
            }
        });
        const responseTime = Date.now() - startTime;
        
        return {
            alive: response.status < 400,
            time: responseTime,
            statusCode: response.status
        };
    } catch (error) {
        return {
            alive: false,
            time: error.code || 'HTTP Error',
            statusCode: 0
        };
    }
}

// API Check
async function checkAPI(url, timeout = 10000) {
    try {
        const { default: axios } = await import('axios');
        const startTime = Date.now();
        const response = await axios.get(url, { 
            timeout,
            validateStatus: function (status) {
                return status >= 200 && status < 600;
            }
        });
        const responseTime = Date.now() - startTime;
        
        return {
            alive: response.status < 400,
            time: responseTime,
            statusCode: response.status
        };
    } catch (error) {
        return {
            alive: false,
            time: error.code || 'API Error',
            statusCode: 0
        };
    }
}

// Lavalink Check
async function checkLavalink(host, port, timeout = 10000) {
    try {
        const portCheck = await checkPort(host, port, timeout);
        if (!portCheck.alive) {
            return { alive: false, time: 'Port closed', statusCode: 0 };
        }

        const { default: axios } = await import('axios');
        const startTime = Date.now();
        
        try {
            const response = await axios.get(`http://${host}:${port}/version`, { 
                timeout: timeout - 2000
            });
            const responseTime = Date.now() - startTime;
            
            return {
                alive: true,
                time: responseTime,
                statusCode: response.status,
                version: response.data
            };
        } catch (httpError) {
            return {
                alive: true,
                time: portCheck.time,
                statusCode: 0,
                note: 'Port open but HTTP unreachable'
            };
        }
    } catch (error) {
        return {
            alive: false,
            time: error.code || 'Lavalink Error',
            statusCode: 0
        };
    }
}

// Update uptime tracking
function updateUptime(serviceName, isOnline) {
    const now = Date.now();
    const uptimeData = serviceUptime.get(serviceName);
    
    if (isOnline) {
        if (!uptimeData.firstOnline) {
            uptimeData.firstOnline = now;
        }
        uptimeData.lastOnline = now;
        uptimeData.totalUptime += (now - uptimeData.lastCheck);
    }
    
    uptimeData.lastCheck = now;
    serviceUptime.set(serviceName, uptimeData);
}

// Format uptime
function formatUptime(uptimeData) {
    if (!uptimeData.firstOnline) return '0s';
    
    const totalUptime = uptimeData.totalUptime + (Date.now() - uptimeData.lastCheck);
    const seconds = Math.floor(totalUptime / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return `${seconds}s`;
    }
}

// Get service icon based on type
function getServiceIcon(service) {
    switch(service.type) {
        case 'heartbeat': return '🤖';
        case 'port': return '🖥️';
        case 'http': return '🌐';
        case 'api': return '🔧';
        case 'lavalink': return '🎵';
        default: return '📊';
    }
}

// Create beautiful status embed for Discord
function createStatusEmbed() {
    const onlineCount = SERVICES.filter(service => serviceStatus.get(service.name)).length;
    const totalCount = SERVICES.length;
    const lastUpdate = new Date().toLocaleString();
    
    const embed = {
        title: "🟢 DTEmpire - Server Status Dashboard",
        description: `**🌐 Live Monitor:** [Click Here](${WEBSITE_URL})\n**Last Update:** ${lastUpdate}\n**Status:** ${onlineCount}/${totalCount} Services Online\n\n*Real-time monitoring with live updates*`,
        color: onlineCount === totalCount ? 0x00FF00 : 0xFFFF00,
        fields: [],
        timestamp: new Date().toISOString(),
        footer: { 
            text: "DTEmpire Status • Live Monitoring • Real-time Updates"
        },
        thumbnail: {
            url: "https://cdn.discordapp.com/attachments/1443835867692269650/1443835867692269650/server-icon.png"
        }
    };
    
    // Add Services section
    const services = SERVICES.filter(s => s.category === 'services');
    if (services.length > 0) {
        const serviceStatusText = services.map(service => {
            const isOnline = serviceStatus.get(service.name);
            const uptime = formatUptime(serviceUptime.get(service.name));
            const statusIcon = isOnline ? '🟢' : '🔴';
            
            let serviceText = `${statusIcon} **${service.name}** • ${uptime}`;
            if (service.inviteLink && isOnline) {
                serviceText += ` • [Invite](${service.inviteLink})`;
            }
            if (service.website && isOnline) {
                serviceText += ` • [Dashboard](${service.website})`;
            }
            
            return serviceText;
        }).join('\n');
        
        embed.fields.push({
            name: "🛠️ Services & Bots",
            value: serviceStatusText || "No services configured",
            inline: false
        });
    }
    
    // Add Game Servers section
    const gameServers = SERVICES.filter(s => s.category === 'games');
    if (gameServers.length > 0) {
        const gameStatus = gameServers.map(service => {
            const isOnline = serviceStatus.get(service.name);
            const uptime = formatUptime(serviceUptime.get(service.name));
            return `${isOnline ? '🟢' : '🔴'} **${service.name}** • ${uptime}`;
        }).join('\n');
        
        embed.fields.push({
            name: "🎮 Game Servers",
            value: gameStatus || "No game servers configured",
            inline: false
        });
    }
    
    // Add Websites section
    const websites = SERVICES.filter(s => s.category === 'websites');
    if (websites.length > 0) {
        const webStatus = websites.map(service => {
            const isOnline = serviceStatus.get(service.name);
            const uptime = formatUptime(serviceUptime.get(service.name));
            let websiteText = `${isOnline ? '🟢' : '🔴'} **${service.name}** • ${uptime}`;
            
            if (service.url && isOnline) {
                websiteText += ` • [Visit](${service.url})`;
            }
            
            return websiteText;
        }).join('\n');
        
        embed.fields.push({
            name: "🌐 Websites",
            value: webStatus || "No web services",
            inline: false
        });
    }
    
    // Add summary field
    embed.fields.push({
        name: "📊 Live Summary",
        value: `**🟢 Online:** ${onlineCount}\n**🔴 Offline:** ${totalCount - onlineCount}\n**🌐 Dashboard:** [Live Monitor](${WEBSITE_URL})\n\n*Updated every minute*`,
        inline: false
    });
    
    return embed;
}

// Send or update the status dashboard
async function updateStatusDashboard() {
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel || channel.type !== discord.ChannelType.GuildText) return;

        const embed = createStatusEmbed();
        
        if (statusMessage) {
            await statusMessage.edit({ embeds: [embed] });
            console.log('📊 Discord status dashboard updated');
        } else {
            statusMessage = await channel.send({ embeds: [embed] });
            console.log('📊 Discord status dashboard created');
        }
    } catch (error) {
        console.error('Error updating Discord dashboard:', error.message);
        if (error.code === 10008) {
            statusMessage = null;
        }
    }
}

// Check all services
async function checkAllServices() {
    console.log(`\n🔍 Checking ${SERVICES.length} services...`);
    let hasChanges = false;
    
    for (const service of SERVICES) {
        try {
            let result;
            
            switch(service.type) {
                case 'heartbeat':
                    result = { alive: checkHeartbeat(service.name), time: 'TCP Heartbeat' };
                    break;
                case 'port':
                    result = await checkPort(service.host, service.port);
                    break;
                case 'http':
                    result = await checkHTTP(service.url);
                    break;
                case 'api':
                    result = await checkAPI(service.url);
                    break;
                case 'lavalink':
                    result = await checkLavalink(service.host, service.port);
                    break;
                default:
                    result = { alive: false, time: 'Unknown service type' };
            }
            
            const previousStatus = serviceStatus.get(service.name);
            updateUptime(service.name, result.alive);

            if (previousStatus !== result.alive) {
                serviceStatus.set(service.name, result.alive);
                hasChanges = true;
                console.log(`📢 ${service.name}: ${result.alive ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
                
                broadcastToWebClients({
                    type: 'statusUpdate',
                    data: getStatusData()
                });
            }
            
        } catch (error) {
            console.error(`Error checking ${service.name}:`, error.message);
        }
    }
    
    if (hasChanges) {
        await updateStatusDashboard();
    }
    
    console.log('--- Status check completed ---');
}

// Start the web server
server.listen(WEB_PORT, '0.0.0.0', () => {
    console.log(`🌐 Web dashboard running on port ${WEB_PORT}`);
    console.log(`📊 Access at: ${WEBSITE_URL}`);
});

client.once('ready', () => {
    console.log(`✅ Status bot logged in as ${client.user.tag}`);
    
    setTimeout(async () => {
        await checkAllServices();
        await updateStatusDashboard();
    }, 2000);
    
    setInterval(checkAllServices, 60000);
    setInterval(updateStatusDashboard, 300000);
    console.log('🔄 Started monitoring (60s checks, 5m dashboard updates)');
});

console.log('🔐 Connecting to Discord...');
client.login(BOT_TOKEN);