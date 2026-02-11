'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Users, Kanban, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/hooks'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Candidates', href: '/candidates', icon: Users },
    { name: 'Kanban Board', href: '/board', icon: Kanban },
    { name: 'Admin', href: '/admin', icon: Settings },
]

export function AppSidebar() {
    const { profile } = useAuth()
    const pathname = usePathname()

    const filteredNavigation = navigation.filter(item => {
        if (item.name === 'Admin') return profile?.role === 'admin'
        return true
    })

    return (
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 pt-16 bg-card border-r border-border z-30 transition-all duration-300 ease-in-out transform -translate-x-[calc(100%-6px)] hover:translate-x-0 group">
            {/* Hover Trigger Handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-border group-hover:bg-primary rounded-l-full transition-all duration-300" />

            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                <nav className="flex-1 px-3 py-6 space-y-1">
                    {filteredNavigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    isActive
                                        ? 'bg-primary/10 text-primary border-primary/20'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent',
                                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors border'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                                        'mr-3 flex-shrink-0 h-4 w-4'
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}
