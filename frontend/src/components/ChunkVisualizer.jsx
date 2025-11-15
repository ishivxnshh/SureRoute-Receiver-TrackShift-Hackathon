import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { cn } from '@/lib/utils'
import { Puzzle } from 'lucide-react'
import { useState } from 'react'

export default function ChunkVisualizer({ transfer }) {
  const [hoveredChunk, setHoveredChunk] = useState(null)

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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Puzzle className="w-5 h-5" />
            Live Chunk Reception
          </div>
          <span className="text-sm font-normal text-gray-500">
            {transfer.fileName}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-gray-500">
          {transfer.receivedChunks} / {transfer.totalChunks} chunks received
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2 max-h-[400px] overflow-y-auto p-2 bg-gray-50 rounded-lg">
          {chunks.map((chunkIndex) => {
            const isReceived = receivedSet.has(chunkIndex)
            return (
              <div
                key={chunkIndex}
                data-chunk-id={`${transfer.fileId}-${chunkIndex}`}
                className={cn(
                  "w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold transition-all duration-300 cursor-pointer relative group",
                  isReceived
                  ? "gradient-success text-white shadow-lg scale-110 animate-pulse-success"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                )}
                onMouseEnter={() => setHoveredChunk(chunkIndex)}
                onMouseLeave={() => setHoveredChunk(null)}
              >
                {chunkIndex + 1}
                {hoveredChunk === chunkIndex && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg border z-10">
                    Chunk #{chunkIndex + 1}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
