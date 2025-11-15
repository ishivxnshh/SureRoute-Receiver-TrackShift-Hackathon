# Smart File Transfer System

A modern, real-time file transfer system built with React and Node.js that receives hashed chunks, verifies them using SHA-256, and reconstructs files with live progress visualization.

## ✨ Features

- 🔐 **SHA-256 Verification** - Every chunk is cryptographically verified
- 📊 **Real-time Updates** - WebSocket-powered live progress tracking
- 🎨 **Beautiful UI** - Modern interface built with React, Tailwind CSS, and shadcn/ui
- 🧩 **Visual Chunk Display** - Watch each chunk arrive in real-time with animated visualization
- 📁 **File Management** - Preview images and download reconstructed files
- 📝 **Activity Logging** - Track all transfer activities with detailed logs
- ⚡ **Fast & Efficient** - Chunked transfer for optimal performance

## 🏗️ Architecture

### Backend (Port 5050)
- **Framework**: Express.js with WebSocket support
- **Features**:
  - Receives hashed file chunks via REST API
  - Verifies each chunk using SHA-256
  - Reconstructs files automatically when all chunks received
  - Broadcasts real-time updates to all connected clients
  - In-memory storage for last 10 files

### Frontend (Port 3000)
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS with custom design system
- **Components**: Custom shadcn/ui inspired components
- **Features**:
  - Real-time WebSocket connection
  - Live chunk visualization grid
  - Progress tracking with animations
  - File preview for images
  - Download functionality

## 🚀 Getting Started

### Prerequisites
- Node.js v16 or higher
- npm or yarn

### Installation & Running

#### 1. Install Backend Dependencies
```powershell
cd backend
npm install
```

#### 2. Start Backend Server
```powershell
npm start
```
Server will start on http://localhost:5050

#### 3. Install Frontend Dependencies
```powershell
cd frontend
npm install
```

#### 4. Start Frontend Development Server
```powershell
npm run dev
```
Frontend will start on http://localhost:3000

## 📡 API Documentation

### Initialize File Transfer
```http
POST /api/transfer/init
Content-Type: application/json

{
  "fileId": "unique-file-id",
  "fileName": "example.pdf",
  "fileSize": 1024000,
  "totalChunks": 100,
  "mimeType": "application/pdf"
}
```

### Upload File Chunk
```http
POST /api/transfer/chunk
Content-Type: application/json

{
  "fileId": "unique-file-id",
  "chunkIndex": 0,
  "chunkData": "base64-encoded-chunk-data",
  "chunkHash": "sha256-hash-of-chunk"
}
```

### Get All Files
```http
GET /api/files
```

### Get Specific File
```http
GET /api/files/:fileId
```

### Get Active Transfers
```http
GET /api/transfers
```

### Health Check
```http
GET /api/health
```

## 🔌 WebSocket Events

The server broadcasts these events in real-time:

| Event | Description |
|-------|-------------|
| `INITIAL_STATE` | Initial state when client connects |
| `TRANSFER_INIT` | New file transfer started |
| `CHUNK_RECEIVED` | Chunk received and verified |
| `RECONSTRUCTION_START` | File reconstruction began |
| `FILE_RECONSTRUCTED` | File successfully reconstructed |
| `RECONSTRUCTION_ERROR` | Error during reconstruction |

## 🧪 Testing

Use the included example sender to test the system:

```powershell
# From the backend directory
node example-sender.js path/to/your/file.jpg
```

Watch the magic happen:
1. Chunks appear in real-time on the frontend
2. Each chunk turns green as it's verified
3. Progress bar updates automatically
4. File is reconstructed and ready to download

## 🎨 UI Components

### Active Transfers
- Real-time progress bars
- Chunk counters
- Transfer status badges

### Chunk Visualizer
- Grid-based chunk display
- Animated chunk reception
- Hover tooltips

### Activity Log
- Terminal-style log display
- Color-coded message types
- Real-time updates

### File List
- File metadata display
- Image preview capability
- Download buttons
- SHA-256 hash display

## 🛠️ Tech Stack

**Backend:**
- Node.js
- Express.js
- WebSocket (ws)
- crypto (SHA-256)

**Frontend:**
- React 19
- Vite
- Tailwind CSS
- lucide-react (icons)
- Custom shadcn/ui components

## 📦 Project Structure

```
Data Receiver/
├── backend/
│   ├── server.js           # Main server
│   ├── example-sender.js   # Test sender
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── ActiveTransfers.jsx
│   │   │   ├── ChunkVisualizer.jsx
│   │   │   ├── ActivityLog.jsx
│   │   │   └── FileList.jsx
│   │   ├── lib/
│   │   │   └── utils.js    # Utility functions
│   │   ├── App.jsx         # Main app
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## 🔒 Security

- **SHA-256 Verification**: Every chunk is verified before acceptance
- **Hash Mismatch Detection**: Invalid chunks are rejected
- **File Integrity**: Complete file hash calculated after reconstruction
- **CORS Enabled**: Configurable for production use

## 📝 License

MIT

## Features

✅ **Chunked File Transfer** - Receives files in chunks for efficient transfer
✅ **SHA-256 Verification** - Validates each chunk using cryptographic hashing
✅ **Real-time Updates** - WebSocket-powered live progress tracking
✅ **File Reconstruction** - Automatically rebuilds files from verified chunks
✅ **Visual Chunk Display** - See each chunk arrive in real-time
✅ **File Preview** - View images directly in the browser
✅ **Download Support** - Download reconstructed files
✅ **Activity Logging** - Track all transfer activities

## Architecture

### Backend (Port 5050)
- Express.js server with WebSocket support
- Receives hashed file chunks via REST API
- Verifies each chunk using SHA-256
- Reconstructs files when all chunks are received
- Broadcasts real-time updates to all connected clients

### Frontend
- Pure HTML/CSS/JavaScript (no build required)
- Real-time WebSocket connection
- Visual chunk reception tracking
- File display and download capabilities

## Getting Started

### Prerequisites
- Node.js (v14 or higher)

### Installation

1. **Install Backend Dependencies**
```bash
cd backend
npm install
```

2. **Start the Backend Server**
```bash
npm start
```
The server will start on http://localhost:5050

3. **Open the Frontend**
Simply open `frontend/index.html` in your browser, or use a simple HTTP server:
```bash
cd frontend
npx http-server -p 8080
```
Then visit http://localhost:8080

## API Endpoints

### POST /api/transfer/init
Initialize a new file transfer
```json
{
  "fileId": "unique-file-id",
  "fileName": "example.pdf",
  "fileSize": 1024000,
  "totalChunks": 100,
  "mimeType": "application/pdf"
}
```

### POST /api/transfer/chunk
Upload a file chunk with SHA-256 hash
```json
{
  "fileId": "unique-file-id",
  "chunkIndex": 0,
  "chunkData": "base64-encoded-chunk",
  "chunkHash": "sha256-hash-of-chunk"
}
```

### GET /api/files
Get all reconstructed files (without data)

### GET /api/files/:fileId
Get specific file with data

### GET /api/transfers
Get active transfers

### GET /api/health
Health check endpoint

## WebSocket Events

The server broadcasts the following events:

- `TRANSFER_INIT` - New transfer started
- `CHUNK_RECEIVED` - Chunk received and verified
- `RECONSTRUCTION_START` - File reconstruction started
- `FILE_RECONSTRUCTED` - File successfully reconstructed
- `RECONSTRUCTION_ERROR` - Error during reconstruction

## Example: Sending a File

Here's how another server can send a file to this system:

```javascript
const crypto = require('crypto');
const fs = require('fs');

async function sendFile(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const fileId = crypto.randomUUID();
  const chunkSize = 64 * 1024; // 64KB chunks
  const totalChunks = Math.ceil(fileBuffer.length / chunkSize);

  // Initialize transfer
  await fetch('http://localhost:5050/api/transfer/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileId,
      fileName,
      fileSize: fileBuffer.length,
      totalChunks,
      mimeType: 'application/octet-stream'
    })
  });

  // Send chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, fileBuffer.length);
    const chunk = fileBuffer.slice(start, end);
    const hash = crypto.createHash('sha256').update(chunk).digest('hex');

    await fetch('http://localhost:5050/api/transfer/chunk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId,
        chunkIndex: i,
        chunkData: chunk.toString('base64'),
        chunkHash: hash
      })
    });
  }
}
```

## Security Features

- **SHA-256 Verification**: Every chunk is verified before acceptance
- **Hash Mismatch Detection**: Chunks with invalid hashes are rejected
- **File Integrity**: Complete file hash is calculated after reconstruction

## Configuration

You can modify the following settings in `backend/server.js`:

- `PORT`: Server port (default: 5050)
- File storage limit (currently in-memory, last 10 files)
- CORS settings
- Chunk size expectations

## Tech Stack

**Backend:**
- Node.js
- Express.js
- ws (WebSocket)
- crypto (SHA-256 hashing)

**Frontend:**
- HTML5
- CSS3 (Modern gradients and animations)
- Vanilla JavaScript
- WebSocket API

## License

MIT
