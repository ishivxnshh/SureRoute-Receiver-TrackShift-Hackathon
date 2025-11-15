const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Example client to send files to the Smart File Transfer System
 * This demonstrates how another server can send chunked files with SHA-256 hashes
 */
// Point to deployed backend by default; falls back to local when env set
const SERVER_URL = process.env.SERVER_URL || 'https://data-receiver.onrender.com/api';
const CHUNK_SIZE = 64 * 1024; // 64KB chunks

async function sendFile(filePath) {
  try {
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const fileId = crypto.randomUUID();
    const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);
    
    console.log(`\n📤 Sending file: ${fileName}`);
    console.log(`📊 Size: ${fileBuffer.length} bytes`);
    console.log(`🧩 Total chunks: ${totalChunks}`);
    console.log(`🔑 File ID: ${fileId}\n`);

    // Step 1: Initialize transfer
    console.log('Initializing transfer...');
    const initResponse = await fetch(`${SERVER_URL}/transfer/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId,
        fileName,
        fileSize: fileBuffer.length,
        totalChunks,
        mimeType: getMimeType(fileName)
      })
    });

    if (!initResponse.ok) {
      throw new Error('Failed to initialize transfer');
    }

    console.log('✅ Transfer initialized\n');

    // Step 2: Send chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileBuffer.length);
      const chunk = fileBuffer.slice(start, end);
      
      // Calculate SHA-256 hash of the chunk
      const hash = crypto.createHash('sha256').update(chunk).digest('hex');

      console.log(`📦 Sending chunk ${i + 1}/${totalChunks} (${chunk.length} bytes) - Hash: ${hash.substring(0, 16)}...`);

      const chunkResponse = await fetch(`${SERVER_URL}/transfer/chunk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          chunkIndex: i,
          chunkData: chunk.toString('base64'),
          chunkHash: hash
        })
      });

      if (!chunkResponse.ok) {
        const error = await chunkResponse.json();
        throw new Error(`Failed to send chunk ${i}: ${error.error}`);
      }

      // Small delay to simulate network latency and make visualization better
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n✅ All chunks sent successfully!');
    console.log('🔄 Server is reconstructing the file...\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.txt': 'text/plain',
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Example usage
if (require.main === module) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.log('Usage: node example-sender.js <file-path>');
    console.log('Example: node example-sender.js ./test-image.jpg');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  sendFile(filePath);
}

module.exports = { sendFile };
