import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from './components/ui/card'
import { Badge } from './components/ui/badge'
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
              receivedChunks: [...(t.receivedChunks || []), data.chunkIndex]
            }
            setActiveTransfer(updated)
            return updated
          }
          return t
        }))
        addLog(`Chunk ${data.chunkIndex + 1}/${data.totalChunks} received for ${data.fileName} [${data.chunkHash}...]`, 'chunk')
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
              </div>
            </div>
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
