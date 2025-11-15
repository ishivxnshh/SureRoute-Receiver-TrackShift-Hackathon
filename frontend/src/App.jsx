import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import ActiveTransfers from './components/ActiveTransfers'
import ChunkVisualizer from './components/ChunkVisualizer'
import ActivityLog from './components/ActivityLog'
import FileList from './components/FileList'
import { base64ToBlob } from './lib/utils'
import { Radio, FolderOpen, Activity as ActivityIcon } from 'lucide-react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5050'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api'

function App() {
  const [wsConnected, setWsConnected] = useState(false)
  const [transfers, setTransfers] = useState([])
  const [files, setFiles] = useState([])
  const [logs, setLogs] = useState([])
  const [activeTransfer, setActiveTransfer] = useState(null)
  const [ws, setWs] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [executing, setExecuting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [resetting, setResetting] = useState(false)

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [{ timestamp, message, type }, ...prev].slice(0, 50))
  }, [])

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'INITIAL_STATE':
        setFiles(data.files || [])
        if (data.transfers && data.transfers.length > 0) {
          const transfersMap = new Map(data.transfers.map(t => [t.fileId, {
            ...t,
            receivedChunks: t.chunksReceived || []
          }]))
          setTransfers(Array.from(transfersMap.values()))
        }
        break

      case 'TRANSFER_INIT':
        setTransfers(prev => {
          const newTransfer = {
            ...data.transfer,
            receivedChunks: []
          }
          setActiveTransfer(newTransfer)
          return [...prev, newTransfer]
        })
        addLog(`Transfer started: ${data.transfer.fileName} (${data.transfer.totalChunks} chunks)`, 'chunk')
        break

      case 'CHUNK_RECEIVED':
        setTransfers(prev => prev.map(t => {
          if (t.fileId === data.fileId) {
            const updated = {
              ...t,
              receivedChunks: [...(t.receivedChunks || []), data.chunkIndex],
              transferMethod: data.transferMethod || t.transferMethod
            }
            setActiveTransfer(updated)
            return updated
          }
          return t
        }))
        addLog(`Chunk ${data.chunkIndex + 1}/${data.totalChunks} received for ${data.fileName} [${data.chunkHash}...] via ${(data.transferMethod || 'wifi').toUpperCase()}`, 'chunk')
        break

      case 'METHOD_SWITCHED':
        setTransfers(prev => prev.map(t => {
          if (t.fileId === data.fileId) {
            return {
              ...t,
              transferMethod: data.newMethod,
              methodSwitches: [...(t.methodSwitches || []), {
                from: data.oldMethod,
                to: data.newMethod,
                timestamp: Date.now()
              }]
            }
          }
          return t
        }))
        addLog(`Transfer method switched: ${data.oldMethod.toUpperCase()} → ${data.newMethod.toUpperCase()} for ${data.fileName}`, 'chunk')
        break

      case 'RECONSTRUCTION_START':
        addLog(`Reconstructing file: ${data.fileName}`, 'chunk')
        break

      case 'FILE_RECONSTRUCTED':
        setFiles(prev => [data.file, ...prev])
        setTransfers(prev => prev.filter(t => t.fileId !== data.file.fileId))
        setActiveTransfer(null)
        addLog(`File reconstructed: ${data.file.fileName}`, 'success')
        break

      case 'RECONSTRUCTION_ERROR':
        addLog(`Error reconstructing file: ${data.error}`, 'error')
        break

      case 'RESET':
        setTransfers([])
        setFiles([])
        setActiveTransfer(null)
        addLog('Receiver reset: cleared transfers and files', 'warning')
        break
    }
  }, [addLog])

  useEffect(() => {
    const connectWebSocket = () => {
      const websocket = new WebSocket(WS_URL)

      websocket.onopen = () => {
        console.log('WebSocket connected')
        setWsConnected(true)
        addLog('WebSocket connected successfully', 'success')
      }

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      }

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
        setWsConnected(false)
        addLog('WebSocket connection error', 'error')
      }

      websocket.onclose = () => {
        console.log('WebSocket disconnected')
        setWsConnected(false)
        addLog('WebSocket disconnected. Reconnecting...', 'error')
        setTimeout(connectWebSocket, 3000)
      }

      setWs(websocket)
    }

    connectWebSocket()

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  const handleDownload = async (file) => {
    try {
      const response = await fetch(`${API_URL}/files/${file.fileId}`)
      const fileData = await response.json()
      
      const blob = base64ToBlob(fileData.data, fileData.mimeType)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileData.fileName
      a.click()
      URL.revokeObjectURL(url)
      
      addLog(`Downloaded: ${fileData.fileName}`, 'success')
    } catch (error) {
      addLog(`Download failed: ${error.message}`, 'error')
    }
  }

  const handleReset = async () => {
    try {
      setResetting(true)
      // Optimistically clear local state
      setTransfers([])
      setFiles([])
      setActiveTransfer(null)
      setLogs([])
      const resp = await fetch(`${API_URL}/reset`, { method: 'POST' })
      if (!resp.ok) throw new Error('Reset failed')
      addLog('Reset completed', 'success')
    } catch (e) {
      addLog(`Reset error: ${e.message}`, 'error')
    } finally {
      setResetting(false)
    }
  }


  const handleExecute = async () => {
    if (!selectedFile || executing) return
    try {
      setExecuting(true)
      setUploadProgress(0)
      addLog(`Execute started: ${selectedFile.name}`, 'chunk')
      const CHUNK_SIZE = 64 * 1024
      const fileId = crypto.randomUUID()
      const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE)

      // Init transfer
      const initResp = await fetch(`${API_URL}/transfer/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          totalChunks,
          mimeType: selectedFile.type || 'application/octet-stream'
        })
      })
      if (!initResp.ok) throw new Error('Init failed')

      // Helper converters
      const bufferToHex = (arrayBuffer) => {
        const bytes = new Uint8Array(arrayBuffer)
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      }
      const bufferToBase64 = (arrayBuffer) => {
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
        return btoa(binary)
      }

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, selectedFile.size)
        const chunkBlob = selectedFile.slice(start, end)
        const chunkBuffer = await chunkBlob.arrayBuffer()
        const hashBuffer = await crypto.subtle.digest('SHA-256', chunkBuffer)
        const chunkHash = bufferToHex(hashBuffer)
        const chunkData = bufferToBase64(chunkBuffer)

        const resp = await fetch(`${API_URL}/transfer/chunk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId,
            chunkIndex: i,
            chunkData,
            chunkHash
          })
        })
        if (!resp.ok) throw new Error(`Chunk ${i + 1} failed`)
        setUploadProgress(((i + 1) / totalChunks) * 100)
        addLog(`Sent chunk ${i + 1}/${totalChunks} for ${selectedFile.name}`, 'chunk')
        // Small delay for visualization aesthetics
        await new Promise(r => setTimeout(r, 60))
      }

      addLog(`All chunks sent: ${selectedFile.name}`, 'success')
      setSelectedFile(null)
    } catch (e) {
      addLog(`Execute error: ${e.message}`, 'error')
    } finally {
      setExecuting(false)
      setUploadProgress(0)
    }
  }
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <Card className="gradient-primary text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Radio className="w-8 h-8" />
                  Smart File Transfer System
                </h1>
                <p className="text-white/90">
                  Real-time Chunked File Transfer with SHA-256 Verification
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge 
                  variant={wsConnected ? 'success' : 'destructive'}
                  className="px-3 py-1"
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${wsConnected ? 'bg-white animate-pulse' : 'bg-red-200'}`} />
                  {wsConnected ? 'Connected' : 'Disconnected'}
                </Badge>
                <Badge variant="secondary" className="px-3 py-1">
                  <ActivityIcon className="w-3 h-3 mr-2" />
                  Active: {transfers.length}
                </Badge>
                <Badge variant="secondary" className="px-3 py-1">
                  <FolderOpen className="w-3 h-3 mr-2" />
                  Files: {files.length}
                </Badge>
                <div className="flex items-center gap-2 bg-white/10 rounded-md p-2">
                  <input
                    type="file"
                    className="text-xs text-white max-w-40"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                  <Button
                    variant="secondary"
                    disabled={!selectedFile || executing}
                    onClick={handleExecute}
                    className="text-xs"
                  >
                    {executing ? 'Executing...' : 'Execute'}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={resetting}
                    onClick={handleReset}
                    className="text-xs"
                  >
                    {resetting ? 'Resetting...' : 'Reset'}
                  </Button>
                </div>
              </div>
            </div>
            {executing && (
              <div className="mt-4 text-xs">
                <div className="flex justify-between mb-1">
                  <span>Uploading: {selectedFile?.name}</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded">
                  <div
                    className="h-2 bg-green-400 rounded"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActiveTransfers transfers={transfers} />
          <ChunkVisualizer transfer={activeTransfer} />
        </div>

        {/* Activity Log */}
        <ActivityLog logs={logs} />

        {/* File List */}
        <FileList files={files} onDownload={handleDownload} />
      </div>
    </div>
  )
}

export default App
