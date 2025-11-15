import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { cn } from '@/lib/utils'
import { Puzzle, Grid3x3, Box } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ThreeDChunkVisualizer from './ThreeDChunkVisualizer'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip'

export default function ChunkVisualizer({ transfer }) {
  const [hoveredChunk, setHoveredChunk] = useState(null)
  const [view3D, setView3D] = useState(false)

  if (!transfer) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="w-5 h-5" />
            Live Chunk Reception
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Puzzle className="w-16 h-16 mb-4 opacity-20" />
            <p>Chunks will appear here as they're received</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chunks = Array.from({ length: transfer.totalChunks }, (_, i) => i)
  const receivedSet = new Set(transfer.receivedChunks || [])

  return (
    <TooltipProvider>
      <Card className="h-full backdrop-blur-sm bg-gray-900/80 border-gray-700/40 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-purple-400" />
              <span className="bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Live Chunk Reception
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-normal text-gray-500">
                {transfer.fileName}
              </span>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setView3D(false)}
                        className={cn(
                          "p-1.5 rounded transition-all",
                          !view3D ? "bg-white shadow-sm text-purple-600" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>2D Grid View</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setView3D(true)}
                        className={cn(
                          "p-1.5 rounded transition-all",
                          view3D ? "bg-white shadow-sm text-purple-600" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        <Box className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>3D Cube View</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="mb-4 text-sm text-gray-600 font-medium"
            key={receivedSet.size}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-purple-600 text-lg font-bold">{receivedSet.size}</span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-600">{transfer.totalChunks}</span>
            <span className="text-gray-500 ml-2">chunks received</span>
          </motion.div>
          
          <AnimatePresence mode="wait">
            {view3D ? (
              <motion.div
                key="3d"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ThreeDChunkVisualizer transfer={transfer} />
              </motion.div>
            ) : (
              <motion.div
                key="2d"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2 max-h-[400px] overflow-y-auto p-2 bg-linear-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700"
              >
                {chunks.map((chunkIndex) => {
                  const isReceived = receivedSet.has(chunkIndex)
                  return (
                    <motion.div
                      key={chunkIndex}
                      data-chunk-id={`${transfer.fileId}-${chunkIndex}`}
                      className={cn(
                        "w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold transition-all duration-300 cursor-pointer relative group",
                        isReceived
                          ? "bg-linear-to-br from-green-400 to-emerald-500 text-white shadow-lg scale-110"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600 shadow-sm border border-gray-600"
                      )}
                      onMouseEnter={() => setHoveredChunk(chunkIndex)}
                      onMouseLeave={() => setHoveredChunk(null)}
                      initial={isReceived ? { scale: 0, rotate: -180 } : {}}
                      animate={isReceived ? { scale: 1.1, rotate: 0 } : {}}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                      {chunkIndex + 1}
                      {hoveredChunk === chunkIndex && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg border z-10"
                        >
                          Chunk #{chunkIndex + 1}
                          {isReceived && <span className="ml-2 text-green-400">✓</span>}
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
