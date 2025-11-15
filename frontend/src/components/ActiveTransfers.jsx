import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { formatBytes } from '@/lib/utils'
import { Package, Layers, Wifi, Bluetooth } from 'lucide-react'

export default function ActiveTransfers({ transfers }) {
  if (transfers.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Active Transfers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Layers className="w-16 h-16 mb-4 opacity-20" />
            <p>Waiting for file transfers...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Active Transfers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transfers.map((transfer) => {
          const progress = (transfer.receivedChunks / transfer.totalChunks) * 100
          const TransferIcon = transfer.transferMethod === 'bluetooth' ? Bluetooth : Wifi
          const methodColor = transfer.transferMethod === 'bluetooth' ? 'text-blue-500' : 'text-green-500'
          
          return (
            <div 
              key={transfer.fileId} 
              className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-3 animate-slide-in"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{transfer.fileName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatBytes(transfer.fileSize || 0)}
                  </p>
                </div>
                <Badge variant={transfer.status === 'completed' ? 'success' : 'warning'}>
                  {transfer.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{transfer.receivedChunks} / {transfer.totalChunks} chunks</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
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
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
