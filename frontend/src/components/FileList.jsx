import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { formatBytes, formatTime, base64ToBlob } from '@/lib/utils'
import { FileText, Download, Eye, EyeOff, Clock, Hash } from 'lucide-react'
import { useState } from 'react'

export default function FileList({ files, onDownload }) {
  const [expandedFile, setExpandedFile] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)

  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Reconstructed Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <p>No files received yet</p>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Reconstructed Files
          <Badge variant="secondary">{files.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {files.map((file) => {
          const isExpanded = expandedFile === file.fileId
          const isPreview = previewFile === file.fileId
          const isImage = file.mimeType?.startsWith('image/')

          return (
            <div
              key={file.fileId}
              className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors animate-slide-in"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg truncate flex items-center gap-2">
                    <FileText className="w-4 h-4 shrink-0" />
                    {file.fileName}
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                  <p className="text-gray-500 text-xs">Received</p>
                  <p className="font-semibold">
                    {new Date(file.reconstructedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-gray-50 p-3 rounded-md animate-slide-in">
                  <div className="flex items-start gap-2 text-xs">
                    <Hash className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-500 mb-1">SHA-256 Hash</p>
                      <p className="font-mono break-all text-[10px]">{file.fileHash}</p>
                    </div>
                  </div>
                </div>
              )}

              {isPreview && isImage && file.data && (
                <div className="border rounded-lg overflow-hidden animate-slide-in">
                  <img
                    src={URL.createObjectURL(base64ToBlob(file.data, file.mimeType))}
                    alt={file.fileName}
                    className="w-full h-auto max-h-96 object-contain bg-gray-100"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => onDownload(file)}
                  className="flex-1"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {isImage && (
                  <Button
                    onClick={() => togglePreview(file)}
                    variant="outline"
                    className="flex-1"
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
                )}
                <Button
                  onClick={() => setExpandedFile(isExpanded ? null : file.fileId)}
                  variant="outline"
                  size="sm"
                >
                  <Hash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
