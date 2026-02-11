"use client"

import { KanbanBoard } from "@/components/KanbanBoard"
import { useRequireAuth } from "@/lib/auth/hooks"

export default function BoardPage() {
    useRequireAuth()
    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] w-full">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Board</h1>
                <p className="text-muted-foreground mt-2">
                    Visual overview of your hiring pipeline.
                </p>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden w-full">
                <KanbanBoard />
            </div>
        </div>
    )
}
