# NetRecon - Full Stack Reconnaissance Toolkit

## 🎯 Overview

NetRecon is a comprehensive network reconnaissance and vulnerability assessment platform combining:
- **Enhanced Bash Script** with color output, animations, and HTML reports
- **Node.js Backend** with MongoDB integration
- **React Dashboard** for visualization and management

## 📋 Project Structure

```
NetRecon/
├── netrecon.sh              # Enhanced bash scanning script
├── backend/                 # Node.js Express API server
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── server.js           # Main server file
│   ├── package.json        # Dependencies
│   └── .env.example        # Environment variables template
├── frontend/               # React dashboard
│   ├── public/            # Static files
│   ├── src/               # React components & pages
│   │   ├── pages/         # Dashboard pages
│   │   └── styles/        # CSS files
│   └── package.json       # Dependencies
└── reports/               # Generated scan reports (HTML & TXT)
```

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 14+ and npm
- MongoDB running locally or Atlas connection string
- Nmap installed (`sudo apt-get install nmap`)
- Bash shell

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your MongoDB URI and JWT secret
nano .env

# Start the server
npm run dev

# Server will run on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start React development server
npm start

# Dashboard will open at http://localhost:3000
```

### 4. Using the Bash Script

```bash
chmod +x netrecon.sh
./netrecon.sh

# Follow the interactive menu to:
# 1. Select scan type (Quick, Full, Stealth, UDP, Vulnerability, Web, LAN Discovery)
# 2. Enter target IP/Domain
# 3. View results in terminal and generated reports
```

## 📊 Features

### Bash Script (netrecon.sh)
- ✅ **7 Scan Types**: Quick, Full, Stealth, UDP, Vulnerability, Web, LAN Discovery
- ✅ **Color Output**: Full terminal color support with ANSI codes
- ✅ **Spinner Animation**: Visual feedback during scans
- ✅ **Progress Tracking**: Real-time scan status
- ✅ **HTML Reports**: Beautiful styled HTML report generation
- ✅ **Dual Reporting**: Both TXT and HTML formats

### Backend API
- ✅ **Authentication**: JWT-based user authentication
- ✅ **MongoDB Integration**: Persistent scan history and user data
- ✅ **RESTful API**: Complete API endpoints for all operations
- ✅ **WebSocket Support**: Real-time scan updates via Socket.io
- ✅ **Scan Management**: Create, read, update, delete scans

### React Dashboard
- ✅ **User Dashboard**: Overview with statistics and charts
- ✅ **Scan Management**: Create and manage scans
- ✅ **Report Viewer**: View and download HTML reports
- ✅ **User Settings**: Customize preferences
- ✅ **Dark Theme**: Professional dark UI
- ✅ **Mobile Responsive**: Works on all devices

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Scans
- `GET /api/scans` - Get all user scans
- `POST /api/scans` - Create new scan
- `GET /api/scans/:id` - Get specific scan
- `PUT /api/scans/:id` - Update scan
- `DELETE /api/scans/:id` - Delete scan
- `GET /api/scans/stats/overview` - Get statistics

### Reports
- `GET /api/reports` - List all reports
- `GET /api/reports/:id` - Get report content
- `GET /api/reports/download/:id` - Download report

### Users
- `GET /api/users/profile/:id` - Get user profile
- `PUT /api/users/profile/:id` - Update profile

## 🔐 Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/netrecon
JWT_SECRET=your_secret_key_here
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 📝 Scan Types Explained

1. **Quick Scan**: Fast basic port scan using `-F` flag
2. **Full Scan**: Comprehensive scan with all ports (`-p-`)
3. **Stealth Scan**: Slow scan with IDS evasion (`-sS -T1`)
4. **UDP Scan**: UDP port scanning (`-sU`)
5. **Vulnerability Scan**: Service detection with NSE scripts
6. **Web Scan**: Targets common web service ports
7. **LAN Discovery**: Network discovery via ping sweep (`-sn`)

## 📊 MongoDB Collections

### Users Collection
```json
{
  "username": "string",
  "email": "string",
  "password": "string (hashed)",
  "role": "user|admin",
  "profile": {...},
  "preferences": {...},
  "createdAt": "date"
}
```

### Scans Collection
```json
{
  "userId": "ObjectId",
  "target": "string",
  "scanType": "string",
  "status": "pending|running|completed|failed",
  "results": {...},
  "ports": {open, closed, filtered},
  "threats": {critical, high, medium, low},
  "createdAt": "date"
}
```

## 🛠️ Development

### Running in Development Mode

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start

# Terminal 3 - Monitor scans
./netrecon.sh
```

### Building for Production

```bash
# Backend
cd backend
npm install
npm run build

# Frontend
cd frontend
npm install
npm run build
```

## 📖 Documentation

For detailed documentation, see:
- Backend API: See `backend/README.md`
- Frontend: See `frontend/README.md`
- Scripts: See `netrecon.sh` comments

## ⚖️ Legal & Ethical

NetRecon is designed for authorized security testing only. Before using this tool:

- ✅ **DO**: Get explicit written permission from network owners
- ✅ **DO**: Use only on networks you own or have authorization for
- ✅ **DO**: Report vulnerabilities responsibly
- ❌ **DON'T**: Scan networks without permission
- ❌ **DON'T**: Use for malicious purposes
- ❌ **DON'T**: Violate local laws and regulations

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 🚨 Disclaimer

This tool is provided as-is for educational and authorized security testing purposes only. Users are responsible for ensuring they have proper authorization before using this tool on any network. Unauthorized access to networks is illegal.

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review code comments for implementation details

---

**Happy Hacking! Stay Ethical! 🔒**
