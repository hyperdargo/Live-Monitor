# DTEmpire Server Status Dashboard

![DTEmpire Banner](https://img.shields.io/badge/DTEmpire-Server%20Status-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Discord.js](https://img.shields.io/badge/Discord.js-14-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

A real-time server monitoring dashboard for Discord that provides live status updates using TCP heartbeats, port checks, and HTTP monitoring with animated visual indicators.
Live: https://live-monitor.ankitgupta.com.np/

## ✨ Features

### 🎯 **Real-time Monitoring**
- **TCP Heartbeat System**: Direct bot-to-bot communication for instant status updates
- **Port Checking**: Monitor game servers, applications, and services
- **HTTP/HTTPS Monitoring**: Website and web service availability checks
- **Live Updates**: Automatic dashboard refreshes every 30 seconds

### 💓 **Animated Status Indicators**
- **Beating Hearts** for online services: `💚` → `💓` → `💗`
- **Breaking Hearts** for offline services: `💔` → `❌` → `🖤`
- **Visual Service Categories**: Distinct icons for bots, servers, and web services

### 📊 **Comprehensive Dashboard**
- **Service Grouping**: Organized by Bot Services, Server Services, and Web Services
- **Uptime Tracking**: Automatic calculation of service availability
- **Response Time Monitoring**: Real-time performance metrics
- **Historical Data**: Last seen timestamps and connection history

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- Discord Bot Token
- Basic knowledge of Discord Developer Portal

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/hyperdargo/Live-Monitor
cd Live-Monitor
```

2. **Install dependencies**
```bash
npm install discord.js axios
```

3. **Configure your bot**
   - Create a new application at [Discord Developer Portal](https://discord.com/developers/applications)
   - Get your bot token
   - Enable required intents (Guilds, Guild Messages)
   - Invite the bot to your server

4. **Configure the monitoring script**
Edit the configuration section in `status-bot.js`:
```javascript
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const CHANNEL_ID = 'YOUR_CHANNEL_ID_HERE';
```

5. **Customize your services**
Modify the `SERVICES` array to monitor your specific services:
```javascript
const SERVICES = [
    { name: 'Music Bot', type: 'heartbeat', port: 25579 },
    { name: 'Game Server', type: 'port', host: 'server.example.com', port: 25565 },
    { name: 'Website', type: 'http', url: 'https://example.com' }
];
```

6. **Start the bot**
```bash
node status-bot.js
```

## 📋 Service Types

### 🤖 Bot Services (TCP Heartbeat)
- **Purpose**: Monitor Discord bots and applications
- **How it works**: Bots connect to designated ports to send heartbeat signals
- **Setup**: Configure your bots to connect to the heartbeat port
- **Response Time**: Instant (TCP connection based)

### 🖥️ Server Services (Port Check)
- **Purpose**: Monitor game servers, databases, and applications
- **How it works**: Regular TCP connection attempts to specified ports
- **Setup**: Add hostname and port for each service
- **Response Time**: Typically 1-5 seconds

### 🌐 Web Services (HTTP Check)
- **Purpose**: Monitor websites and web applications
- **How it works**: HTTP/HTTPS requests with status code validation
- **Setup**: Add URL for each web service
- **Response Time**: Varies based on server response

## 🔧 Configuration Options

### Service Configuration Parameters
```javascript
{
    name: 'Service Name',      // Display name in dashboard
    type: 'heartbeat|port|http', // Monitoring type
    port: 25579,               // Port number (for heartbeat/port types)
    host: 'example.com',       // Hostname (for port type)
    url: 'https://example.com' // URL (for http type)
}
```

### Update Intervals
- **Service Checks**: Every 60 seconds
- **Dashboard Updates**: Every 30 seconds (for animation)
- **Heartbeat Timeout**: 3 minutes (offline detection)

## 🎨 Customization

### Changing Status Icons
Modify the `getStatusIcon()` function in `status-bot.js`:
```javascript
// Online animation sequence
const heartBeats = ['💚', '💓', '💗'];

// Offline animation sequence
const brokenHearts = ['💔', '❌', '🖤'];
```

### Custom Service Categories
Add new service types by modifying the `getServiceIcon()` function:
```javascript
function getServiceIcon(service) {
    switch(service.type) {
        case 'heartbeat': return '🤖';
        case 'port': return '🖥️';
        case 'http': return '🌐';
        case 'database': return '🗄️'; // Add new type
        default: return '📊';
    }
}
```

### Embed Customization
Edit the `createStatusEmbed()` function to:
- Change colors (use hex codes)
- Modify field layouts
- Add custom footer/header text
- Adjust timestamp formats

## 📈 Uptime Calculation

The system automatically calculates and displays:
- **Total Uptime**: Cumulative time service has been online
- **Current Status**: Real-time availability
- **Last Seen**: Time since last successful connection
- **Format**: Automatically adjusts (seconds → minutes → hours → days)

## 🚨 Alert System

### Built-in Notifications
- **Status Changes**: Automatic dashboard updates on state changes
- **Console Logging**: Detailed logs for debugging
- **Visual Indicators**: Color-coded embeds and animated emojis

### Extending Alert Features
To add notifications (DM alerts, webhooks, etc.):
1. Add notification logic to the `checkAllServices()` function
2. Trigger notifications when `hasChanges` is true
3. Implement your preferred notification method

## 🛠️ Troubleshooting

### Common Issues

1. **Bot won't start**
   - Verify Node.js version (18+ required)
   - Check Discord bot token validity
   - Ensure required intents are enabled

2. **Services show as offline**
   - Verify port numbers and hostnames
   - Check firewall settings
   - Ensure services are running and accessible

3. **Heartbeat not working**
   - Confirm heartbeat port is open
   - Check if bots are connecting to correct port
   - Verify network connectivity

4. **Dashboard not updating**
   - Check channel permissions
   - Verify bot has message sending permissions
   - Check for rate limiting

### Log Messages
- `💓 Heartbeat received from ServiceName` - Successful heartbeat
- `💔 Socket error` - Connection issues
- `📢 ServiceName: 💚 ONLINE` - Status change to online
- `📢 ServiceName: 💔 OFFLINE` - Status change to offline

## 🔒 Security Considerations

### Token Security
- **Never commit tokens** to public repositories
- Use environment variables for sensitive data
- Consider using a `.env` file:
```bash
BOT_TOKEN=your_token_here
CHANNEL_ID=your_channel_id
```

### Network Security
- Limit exposed ports to necessary services
- Use firewalls to restrict access
- Consider VPN for internal services

### Discord Permissions
- Use minimal required permissions
- Regular token rotation
- Monitor bot access logs

## 📚 API Reference

### Main Functions
- `createHeartbeatServer(port, serviceName)` - Creates TCP server for heartbeat monitoring
- `checkHeartbeat(serviceName)` - Verifies recent heartbeat activity
- `checkPort(host, port)` - Tests TCP port connectivity
- `checkHTTP(url)` - Performs HTTP status checks
- `updateStatusDashboard()` - Updates Discord embed with current status

### Data Structures
- `serviceStatus` - Map of service name → boolean (online/offline)
- `serviceUptime` - Map of service name → uptime tracking object
- `lastHeartbeat` - Map of service name → last heartbeat timestamp

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add comments for new functionality
- Update documentation accordingly
- Test changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) - Powerful Discord API library
- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Axios](https://axios-http.com/) - Promise based HTTP client

## 🆘 Need Help?

**For support, questions, or troubleshooting:**
Join our Discord community for assistance and updates:

🔗 **http://dsc.gg/dtempire-server**

Our team and community members are ready to help you with:
- Setup and configuration
- Troubleshooting issues
- Feature requests
- Customizations
- General support
---

**Made with 💚 by DTEmpire Team**

*Last Updated: December 01, 2025*
