const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 5050; // Different port as requested
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Storage for file chunks and metadata
const fileTransfers = new Map();
const reconstructedFiles = [];

// WebSocket connections
const wsClients = new Set();

// Transfer method tracking
const transferMethods = new Map(); // fileId -> 'wifi' | 'bluetooth'

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  wsClients.add(ws);
  
  // Send current state to new client
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    files: reconstructedFiles,
    transfers: Array.from(fileTransfers.values())
  }));

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log('WebSocket client disconnected');
  });
});

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  wsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// Verify SHA-256 hash
function verifyHash(data, expectedHash) {
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash === expectedHash;
}

// Initialize a new file transfer
app.post('/api/transfer/init', (req, res) => {
  const { fileId, fileName, fileSize, totalChunks, mimeType, transferMethod } = req.body;
  
  if (!fileId || !fileName || !totalChunks) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const method = transferMethod || 'wifi'; // Default to WiFi
  transferMethods.set(fileId, method);

  fileTransfers.set(fileId, {
    fileId,
    fileName,
    fileSize,
    totalChunks,
    mimeType: mimeType || 'application/octet-stream',
    chunks: new Map(),
    receivedChunks: 0,
    startTime: Date.now(),
    status: 'receiving',
    transferMethod: method,
    methodSwitches: [] // Track method switches
  });

  console.log(`📡 Initialized ${method.toUpperCase()} transfer for ${fileName} (${totalChunks} chunks)`);
  
  broadcast({
    type: 'TRANSFER_INIT',
    transfer: fileTransfers.get(fileId)
  });

  res.json({ success: true, fileId, transferMethod: method });
});

// Switch transfer method
app.post('/api/transfer/switch-method', (req, res) => {
  const { fileId, newMethod } = req.body;

  if (!fileId || !newMethod || !['wifi', 'bluetooth'].includes(newMethod)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const transfer = fileTransfers.get(fileId);
  if (!transfer) {
    return res.status(404).json({ error: 'File transfer not found' });
  }

  const oldMethod = transfer.transferMethod;
  if (oldMethod !== newMethod) {
    transfer.transferMethod = newMethod;
    transfer.methodSwitches.push({
      from: oldMethod,
      to: newMethod,
      timestamp: Date.now(),
      chunkCount: transfer.receivedChunks
    });

    transferMethods.set(fileId, newMethod);

    console.log(`🔄 Switched: ${oldMethod.toUpperCase()} → ${newMethod.toUpperCase()} for ${transfer.fileName} (${transfer.receivedChunks}/${transfer.totalChunks} chunks)`);

    broadcast({
      type: 'METHOD_SWITCHED',
      fileId,
      oldMethod,
      newMethod,
      fileName: transfer.fileName,
      progress: transfer.receivedChunks / transfer.totalChunks * 100
    });
  }

  res.json({ success: true, currentMethod: newMethod });
});

// Receive a file chunk
app.post('/api/transfer/chunk', (req, res) => {
  const { fileId, chunkIndex, chunkData, chunkHash, transferMethod } = req.body;

  if (!fileId || chunkIndex === undefined || !chunkData || !chunkHash) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const transfer = fileTransfers.get(fileId);
  if (!transfer) {
    return res.status(404).json({ error: 'File transfer not found' });
  }

  // Auto-detect method switch
  const currentMethod = transferMethod || transferMethods.get(fileId) || 'wifi';
  if (currentMethod !== transfer.transferMethod) {
    transfer.methodSwitches.push({
      from: transfer.transferMethod,
      to: currentMethod,
      timestamp: Date.now(),
      chunkCount: transfer.receivedChunks
    });
    transfer.transferMethod = currentMethod;
    transferMethods.set(fileId, currentMethod);

    console.log(`🔄 Auto-switched to ${currentMethod.toUpperCase()} at chunk ${chunkIndex + 1}`);
    
    broadcast({
      type: 'METHOD_SWITCHED',
      fileId,
      oldMethod: transfer.transferMethod,
      newMethod: currentMethod,
      fileName: transfer.fileName,
      progress: transfer.receivedChunks / transfer.totalChunks * 100
    });
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(chunkData, 'base64');
  
  // Verify SHA-256 hash
  if (!verifyHash(buffer, chunkHash)) {
    console.error(`❌ Hash verification failed for chunk ${chunkIndex} of ${transfer.fileName}`);
    return res.status(400).json({ error: 'Hash verification failed' });
  }

  // Store the chunk
  transfer.chunks.set(chunkIndex, buffer);
  transfer.receivedChunks = transfer.chunks.size;

  const methodIcon = currentMethod === 'bluetooth' ? '📲' : '📡';
  console.log(`${methodIcon} [${currentMethod.toUpperCase()}] Chunk ${chunkIndex + 1}/${transfer.totalChunks} for ${transfer.fileName} (Hash: ${chunkHash.substring(0, 8)}...)`);

  // Broadcast chunk received
  broadcast({
    type: 'CHUNK_RECEIVED',
    fileId,
    chunkIndex,
    chunkHash: chunkHash.substring(0, 16),
    receivedChunks: transfer.receivedChunks,
    totalChunks: transfer.totalChunks,
    fileName: transfer.fileName,
    transferMethod: currentMethod
  });

  // Check if all chunks received
  if (transfer.receivedChunks === transfer.totalChunks) {
    reconstructFile(fileId);
  }

  res.json({ 
    success: true, 
    receivedChunks: transfer.receivedChunks,
    totalChunks: transfer.totalChunks
  });
});

// Reconstruct file from chunks
async function reconstructFile(fileId) {
  const transfer = fileTransfers.get(fileId);
  if (!transfer) return;

  console.log(`Reconstructing file ${transfer.fileName}...`);
  transfer.status = 'reconstructing';

  broadcast({
    type: 'RECONSTRUCTION_START',
    fileId,
    fileName: transfer.fileName
  });

  try {
    // Sort chunks by index and concatenate
    const sortedChunks = [];
    for (let i = 0; i < transfer.totalChunks; i++) {
      const chunk = transfer.chunks.get(i);
      if (!chunk) {
        throw new Error(`Missing chunk ${i}`);
      }
      sortedChunks.push(chunk);
    }

    const fileBuffer = Buffer.concat(sortedChunks);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Store reconstructed file
    const reconstructedFile = {
      fileId,
      fileName: transfer.fileName,
      fileSize: fileBuffer.length,
      mimeType: transfer.mimeType,
      fileHash,
      data: fileBuffer.toString('base64'),
      reconstructedAt: new Date().toISOString(),
      transferTime: Date.now() - transfer.startTime,
      totalChunks: transfer.totalChunks,
      transferMethod: transfer.transferMethod,
      methodSwitches: transfer.methodSwitches,
      finalMethod: transfer.transferMethod
    };

    reconstructedFiles.unshift(reconstructedFile);
    
    // Keep only last 10 files in memory
    if (reconstructedFiles.length > 10) {
      reconstructedFiles.pop();
    }

    transfer.status = 'completed';
    
    console.log(`File ${transfer.fileName} reconstructed successfully (Hash: ${fileHash.substring(0, 16)}...)`);

    broadcast({
      type: 'FILE_RECONSTRUCTED',
      file: {
        ...reconstructedFile,
        data: undefined // Don't send full data in broadcast
      }
    });

  } catch (error) {
    console.error(`Error reconstructing file ${transfer.fileName}:`, error);
    transfer.status = 'error';
    transfer.error = error.message;

    broadcast({
      type: 'RECONSTRUCTION_ERROR',
      fileId,
      error: error.message
    });
  }
}

// Get all reconstructed files
app.get('/api/files', (req, res) => {
  const filesWithoutData = reconstructedFiles.map(f => ({
    ...f,
    data: undefined,
    dataSize: f.data ? f.data.length : 0
  }));
  res.json(filesWithoutData);
});

// Get specific file with data
app.get('/api/files/:fileId', (req, res) => {
  const file = reconstructedFiles.find(f => f.fileId === req.params.fileId);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.json(file);
});

// Get active transfers
app.get('/api/transfers', (req, res) => {
  const transfers = Array.from(fileTransfers.values()).map(t => ({
    ...t,
    chunks: undefined,
    chunksReceived: Array.from(t.chunks.keys())
  }));
  res.json(transfers);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    activeTransfers: fileTransfers.size,
    reconstructedFiles: reconstructedFiles.length,
    connectedClients: wsClients.size,
    supportedMethods: ['wifi', 'bluetooth']
  });
});

server.listen(PORT, () => {
  console.log(`╔════════════════════════════════════════════╗`);
  console.log(`║  Smart File Transfer System - Backend     ║`);
  console.log(`║  Server running on port ${PORT}             ║`);
  console.log(`║  WebSocket ready for real-time updates    ║`);
  console.log(`║  📡 WiFi & 📲 Bluetooth Support           ║`);
  console.log(`╚════════════════════════════════════════════╝`);
  console.log(`\nEndpoints:`);
  console.log(`  POST /api/transfer/init          - Initialize file transfer`);
  console.log(`  POST /api/transfer/chunk         - Upload file chunk`);
  console.log(`  POST /api/transfer/switch-method - Switch transfer method`);
  console.log(`  GET  /api/files                  - Get all files`);
  console.log(`  GET  /api/files/:id              - Get specific file`);
  console.log(`  GET  /api/transfers              - Get active transfers`);
  console.log(`  GET  /api/health                 - Health check`);
  console.log(`\nWebSocket: ws://localhost:${PORT}`);
  console.log(`\nSupported Methods: WiFi 📡, Bluetooth 📲`);
});
