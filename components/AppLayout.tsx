'use client'

import { useState } from 'react'
import { TopNav } from './TopNav'
import { AppSidebar } from './AppSidebar'
import { usePathname } from 'next/navigation'

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()

    // Don't show layout on login page
    if (pathname === '/login') {
        return <>{children}</>
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

            <div className="flex flex-1 pt-16">
                {/* Sidebar - Desktop */}
                <AppSidebar />

                {/* Sidebar - Mobile Overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-40 md:hidden">
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-card shadow-2xl border-r border-border">
                            <div className="px-5 py-5 border-b border-border">
                                <span className="text-lg font-bold text-foreground">Menu</span>
                            </div>
                            <AppSidebar />
                        </div>
                    </div>
                )}

                <main className="flex-1">
                    <div className={`${(pathname === '/board' || pathname === '/dashboard') ? 'w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8 py-8 h-full`}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
