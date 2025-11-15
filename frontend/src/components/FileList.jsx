import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { formatBytes, formatTime, base64ToBlob } from '@/lib/utils'
import { FileText, Download, Eye, EyeOff, Clock, Hash, Wifi, Bluetooth, RefreshCw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FileList({ files, onDownload }) {
  const [expandedFile, setExpandedFile] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)

  if (files.length === 0) {
    return (
      <Card className="backdrop-blur-sm bg-gray-900/80 border-gray-700/40 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <span className="bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Reconstructed Files
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <FileText className="w-16 h-16 mb-4 opacity-20" />
            </motion.div>
            <p className="text-sm">No files received yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const togglePreview = async (file) => {
    if (previewFile === file.fileId) {
      setPreviewFile(null)
    } else {
      setPreviewFile(file.fileId)
    }
  }

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-white/40 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          <span className="bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Reconstructed Files
          </span>
          <Badge variant="secondary" className="ml-2 bg-purple-900/50 text-purple-300">
            <Sparkles className="w-3 h-3 mr-1" />
            {files.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="popLayout">
          {files.map((file, idx) => {
            const isExpanded = expandedFile === file.fileId
            const isPreview = previewFile === file.fileId
            const isImage = file.mimeType?.startsWith('image/')

            return (
              <motion.div
                key={file.fileId}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="border-2 border-gray-700 rounded-xl p-4 space-y-3 hover:border-purple-500 hover:shadow-lg transition-all bg-linear-to-br from-gray-800 to-gray-900 relative overflow-hidden group"
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-linear-to-r from-purple-500/0 via-purple-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg truncate flex items-center gap-2">
                      <FileText className="w-4 h-4 shrink-0" />
                      {file.fileName}
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm relative z-10">
                  <div>
                    <p className="text-gray-500 text-xs">Size</p>
                    <p className="font-semibold">{formatBytes(file.fileSize)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Chunks</p>
                    <p className="font-semibold">{file.totalChunks}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Transfer Time
                    </p>
                    <p className="font-semibold">{formatTime(file.transferTime)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Method</p>
                    <div className="flex items-center gap-1">
                      {file.transferMethod === 'bluetooth' ? (
                        <Bluetooth className="w-3 h-3 text-blue-500" />
                      ) : (
                        <Wifi className="w-3 h-3 text-green-500" />
                      )}
                      <p className="font-semibold">{(file.transferMethod || 'wifi').toUpperCase()}</p>
                      {file.methodSwitches && file.methodSwitches.length > 0 && (
                        <Badge variant="warning" className="ml-1 text-[10px] px-1 py-0">
                          <RefreshCw className="w-2 h-2 mr-0.5" />
                          {file.methodSwitches.length}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50 p-3 rounded-md relative z-10"
                  >
                    <div className="flex items-start gap-2 text-xs">
                      <Hash className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-500 mb-1">SHA-256 Hash</p>
                        <p className="font-mono break-all text-[10px]">{file.fileHash}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {isPreview && isImage && file.data && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="border rounded-lg overflow-hidden relative z-10"
                  >
                    <img
                      src={URL.createObjectURL(base64ToBlob(file.data, file.mimeType))}
                      alt={file.fileName}
                      className="w-full h-auto max-h-96 object-contain bg-gray-100"
                    />
                  </motion.div>
                )}

                <div className="flex gap-2 relative z-10">
                  <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => onDownload(file)}
                      className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </motion.div>
                  {isImage && (
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => togglePreview(file)}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        {isPreview ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Hide Preview
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => setExpandedFile(isExpanded ? null : file.fileId)}
                      variant="outline"
                      size="sm"
                    >
                      <Hash className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
