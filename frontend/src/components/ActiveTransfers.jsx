import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { formatBytes } from '@/lib/utils'
import { Package, Layers, Wifi, Bluetooth, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ActiveTransfers({ transfers }) {
  if (transfers.length === 0) {
    return (
      <Card className="h-full backdrop-blur-sm bg-gray-900/80 border-gray-700/40 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            <span className="bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Active Transfers
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Layers className="w-16 h-16 mb-4 opacity-20" />
            </motion.div>
            <p className="text-sm">Waiting for file transfers...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full backdrop-blur-sm bg-white/80 border-white/40 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          <span className="bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Active Transfers
          </span>
          <Badge variant="secondary" className="ml-auto">
            {transfers.length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="popLayout">
          {transfers.map((transfer, idx) => {
            const progress = (transfer.receivedChunks / transfer.totalChunks) * 100
            const TransferIcon = transfer.transferMethod === 'bluetooth' ? Bluetooth : Wifi
            const methodColor = transfer.transferMethod === 'bluetooth' ? 'text-blue-500' : 'text-green-500'
            
            return (
              <motion.div
                key={transfer.fileId}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="p-4 rounded-xl bg-linear-to-br from-gray-800 to-gray-900 border border-gray-700 space-y-3 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden group"
              >
                {/* Animated shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
                      <p className="font-semibold text-sm truncate">{transfer.fileName}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatBytes(transfer.fileSize || 0)}
                    </p>
                  </div>
                  <Badge 
                    variant={transfer.status === 'completed' ? 'success' : 'warning'}
                    className="shadow-sm"
                  >
                    {transfer.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between text-xs text-gray-600 font-medium">
                    <span>{transfer.receivedChunks} / {transfer.totalChunks} chunks</span>
                    <motion.span
                      key={progress}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-purple-600 font-bold"
                    >
                      {Math.round(progress)}%
                    </motion.span>
                  </div>
                  <Progress value={progress} className="h-2 bg-gray-200" />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 relative z-10">
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {transfer.totalChunks} chunks
                  </span>
                  <span className={`flex items-center gap-1 font-semibold ${methodColor}`}>
                    <TransferIcon className="w-3 h-3" />
                    {transfer.transferMethod?.toUpperCase() || 'WIFI'}
                    {transfer.methodSwitches && transfer.methodSwitches.length > 0 && (
                      <span className="text-orange-500 ml-1">
                        ({transfer.methodSwitches.length} switches)
                      </span>
                    )}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
