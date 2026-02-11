'use client'

import * as React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description?: string
    children: React.ReactNode
    footer?: React.ReactNode
}

export function Modal({ isOpen, onClose, title, description, children, footer }: ModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                <Card className="relative bg-white border-slate-200 shadow-xl">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 h-6 w-6 rounded-md opacity-70 transition-opacity hover:opacity-100"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                        {children}
                    </CardContent>
                    {footer && <CardFooter>{footer}</CardFooter>}
                </Card>
            </div>
        </div>
    )
}
