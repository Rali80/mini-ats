'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from './Button'
import { validateFile, FileValidationResult } from '@/lib/security/security'

interface FileUploadProps {
    onFileSelect: (file: File | null) => void
    accept?: string
    maxSizeMB?: number
    label?: string
    className?: string
}

export function FileUpload({
    onFileSelect,
    accept = '.pdf,.doc,.docx',
    maxSizeMB = 5,
    label = 'Upload File',
    className = ''
}: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const validateAndSetFile = useCallback((f: File) => {
        const result: FileValidationResult = validateFile(f, {
            maxSizeMB,
            allowedTypes: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ]
        })

        if (!result.valid) {
            setError(result.error || 'Invalid file')
            setFile(null)
            setSuccess(false)
            onFileSelect(null)
            return false
        }

        setFile(f)
        setError(null)
        setSuccess(true)
        onFileSelect(f)
        return true
    }, [maxSizeMB, onFileSelect])

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0])
        }
    }, [validateAndSetFile])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0])
        }
    }, [validateAndSetFile])

    const handleRemove = useCallback(() => {
        setFile(null)
        setError(null)
        setSuccess(false)
        onFileSelect(null)
    }, [onFileSelect])

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-muted-foreground">
                    {label}
                </label>
            )}
            {!file ? (
                <div
                    className={`
                        relative border-2 border-dashed rounded-lg p-6 text-center
                        transition-colors cursor-pointer
                        ${dragActive
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-primary/50'
                        }
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                >
                    <input
                        id="file-input"
                        type="file"
                        accept={accept}
                        onChange={handleChange}
                        className="hidden"
                    />
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        PDF, DOC, DOCX up to {maxSizeMB}MB
                    </p>
                </div>
            ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                    <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {success && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="p-1 hover:bg-muted rounded transition-colors"
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}
        </div>
    )
}
