import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import ActiveTransfers from './components/ActiveTransfers'
import ChunkVisualizer from './components/ChunkVisualizer'
import ActivityLog from './components/ActivityLog'
import FileList from './components/FileList'
import AnimatedBackground from './components/ui/animated-background'
import { base64ToBlob } from './lib/utils'
import { Radio, FolderOpen, Activity as ActivityIcon, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5050'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api'

function App() {
  const [wsConnected, setWsConnected] = useState(false)
  const [transfers, setTransfers] = useState([])
  const [files, setFiles] = useState([])
  const [logs, setLogs] = useState([])
  const [activeTransfer, setActiveTransfer] = useState(null)
  const [ws, setWs] = useState(null)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Clear only file/chunk data, preserve logs
      setTransfers([])
      setFiles([])
      setActiveTransfer(null)
      const resp = await fetch(`${API_URL}/reset`, { method: 'POST' })
      if (!resp.ok) throw new Error('Reset failed')
      addLog('Reset completed: cleared files and chunks', 'success')
    } catch (e) {
      addLog(`Reset error: ${e.message}`, 'error')
    } finally {
      setResetting(false)
    }
  }



  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="container mx-auto p-6 space-y-6 max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="backdrop-blur-md bg-linear-to-r from-purple-700 via-violet-700 to-blue-700 text-white border border-purple-500/20 shadow-2xl overflow-hidden relative">
            {/* Animated gradient overlay */}
            <motion.div
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
            />
            
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Radio className="w-8 h-8" />
                    </motion.div>
                    <span className="flex items-center gap-2">
                      Smart File Transfer System
                      <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                    </span>
                  </h1>
                  <p className="text-white/90 text-sm">
                    Real-time Chunked File Transfer with SHA-256 Verification
                  </p>
                </motion.div>
                <motion.div 
                  className="flex flex-wrap gap-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Badge 
                    variant={wsConnected ? 'success' : 'destructive'}
                    className="px-3 py-1 shadow-lg"
                  >
                    <motion.div 
                      className={`w-2 h-2 rounded-full mr-2 ${wsConnected ? 'bg-white' : 'bg-red-200'}`}
                      animate={wsConnected ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    {wsConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm">
                    <ActivityIcon className="w-3 h-3 mr-2" />
                    Active: {transfers.length}
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm">
                    <FolderOpen className="w-3 h-3 mr-2" />
                    Files: {files.length}
                  </Badge>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="destructive"
                      disabled={resetting}
                      onClick={handleReset}
                      className="text-xs shadow-lg"
                    >
                      {resetting ? 'Resetting...' : 'Reset'}
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Grid */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ActiveTransfers transfers={transfers} />
          <ChunkVisualizer transfer={activeTransfer} />
        </motion.div>

        {/* Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ActivityLog logs={logs} />
        </motion.div>

        {/* File List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <FileList files={files} onDownload={handleDownload} />
        </motion.div>
      </div>
    </div>
  )
}

export default App
