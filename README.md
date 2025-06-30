traffic_challan_v2

## AI Traffic Challan System for Telangana Police

A React/TypeScript web application designed for AI-powered traffic violation management with integrated RTA database access through TSeChallan API.

### Features

- **Image Intake System**: Drag-and-drop interface for traffic violation images
- **AI Processing**: Automatic license plate detection and violation identification
- **RTA Integration**: Real-time vehicle verification through TSeChallan API
- **Review Workflow**: Multi-stage challan review and approval process
- **Real-time Matching**: Fuzzy matching algorithm for RTA vs AI-detected data

### Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js + Express (TSeChallan API proxy)

### Architecture

Due to TSeChallan API IP whitelisting requirements, this system uses a **backend proxy architecture**:

```
Frontend (localhost/Vercel) → Backend (Render - whitelisted IPs) → TSeChallan API
```

## Getting Started

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

**Frontend Environment Variables** (`.env.local`):
```bash
# Backend API Configuration (Recommended)
VITE_BACKEND_API_URL=https://your-backend-app.onrender.com

# Alternative: Direct API (requires IP whitelisting)
# VITE_RTA_API_URL=https://echallan.tspolice.gov.in/TSeChallanRST
# VITE_RTA_VENDOR_CODE=Squarebox
# VITE_RTA_VENDOR_KEY=SDF#$%jkjkh@#$MBJG8790JKH
```

```bash
# Run development server
npm run dev
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
touch .env
```

**Backend Environment Variables** (`backend/.env`):
```bash
# TSeChallan API Configuration
TSECHALLAN_API_URL=https://echallan.tspolice.gov.in/TSeChallanRST
TSECHALLAN_VENDOR_CODE=Squarebox
TSECHALLAN_VENDOR_KEY=SDF#$%jkjkh@#$MBJG8790JKH

# Server Configuration  
PORT=3001
NODE_ENV=development
```

```bash
# Run backend development server
npm run dev
```

## Deployment

### Backend Deployment (Render)

1. **Push backend to GitHub repository**
2. **Connect to Render** (render.com)
3. **Configure service**:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Set environment variables** in Render dashboard
5. **Deploy** - This will use whitelisted IPs for TSeChallan

### Frontend Deployment (Vercel/Netlify)

1. **Update** `VITE_BACKEND_API_URL` to your Render backend URL
2. **Deploy** frontend to Vercel/Netlify
3. **Test** the complete integration

## API Integration Modes

The system automatically detects and uses the appropriate integration mode:

### 🟢 Backend API Mode (Recommended)
- **When**: `VITE_BACKEND_API_URL` is configured
- **Benefits**: Secure, IP whitelisting handled, credentials protected
- **Use for**: Production deployment

### 🟡 Direct API Mode
- **When**: TSeChallan credentials configured but no backend URL
- **Limitations**: Requires frontend IP whitelisting (will fail from localhost)
- **Use for**: Testing only (if your local IP is whitelisted)

### 🟡 Mock Data Mode
- **When**: No backend URL or credentials configured
- **Use for**: Development and testing

## Testing TSeChallan Integration

1. **Navigate to** `http://localhost:5173`
2. **Click "RTA Test" tab**
3. **Use Quick Test section**:
   - **Backend Mode**: Test both connectivity and vehicle lookup
   - **Direct Mode**: Test direct TSeChallan calls (may fail due to IP)
   - **Mock Mode**: Test with sample data

### Test Vehicle Numbers
- `TS09AB1234` - Test mismatch scenarios
- `TS07CD5678` - Test perfect match
- Any valid Telangana registration number

## Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # UI components
│   ├── services/          # API services & TSeChallan integration
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript definitions
│   └── data/              # Mock data
├── backend/               # Backend proxy service
│   ├── index.js           # Express server
│   ├── package.json       # Backend dependencies
│   └── README.md          # Backend documentation
└── README.md              # This file
```

## Important Notes

### Security
- ⚠️ **Never commit actual vendor credentials** to version control
- 🔒 **Backend handles sensitive credentials** - frontend only calls backend
- 🛡️ **IP whitelisting** is handled at backend level (Render platform)

### IP Whitelisting Issue
- Your **Render backend IPs are whitelisted** with TSeChallan
- **Direct frontend calls from localhost will fail** due to IP restrictions
- **Solution**: Use backend proxy architecture (recommended setup)

### Production Checklist
- [ ] Deploy backend to Render with TSeChallan credentials
- [ ] Configure `VITE_BACKEND_API_URL` in frontend
- [ ] Test connectivity using "RTA Test" tab
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Verify end-to-end integration

## License

This project is developed for the Telangana Traffic Police Department.
