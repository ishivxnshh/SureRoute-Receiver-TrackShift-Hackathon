import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ActivityLog({ logs }) {
  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      case 'chunk':
        return 'text-blue-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-950 text-slate-200 rounded-lg p-4 font-mono text-xs max-h-[300px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-slate-500">
              [{new Date().toLocaleTimeString()}] System initialized. Waiting for connections...
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="border-b border-slate-800 pb-1 last:border-0">
                  <span className="text-slate-500">[{log.timestamp}]</span>{' '}
                  <span className={cn(getLogColor(log.type))}>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
