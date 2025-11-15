import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Activity, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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
    <Card className="backdrop-blur-sm bg-gray-900/80 border-gray-700/40 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-purple-400" />
          <span className="bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Activity Log
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-950 text-slate-200 rounded-lg p-4 font-mono text-xs max-h-[300px] overflow-y-auto relative">
          {/* Terminal scanline effect */}
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-green-500/5 to-transparent pointer-events-none animate-pulse"></div>
          
          {logs.length === 0 ? (
            <motion.div 
              className="text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-green-400">$</span> [{new Date().toLocaleTimeString()}] System initialized. Waiting for connections...
              <motion.span
                animate={{ opacity: [0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                _
              </motion.span>
            </motion.div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-b border-slate-800 pb-1 last:border-0"
                  >
                    <span className="text-green-400">$</span>{' '}
                    <span className="text-slate-500">[{log.timestamp}]</span>{' '}
                    <span className={cn(getLogColor(log.type), "font-semibold")}>{log.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
