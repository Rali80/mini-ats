'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/hooks'
import { LogOut, Menu, Settings, Shield, UserIcon } from 'lucide-react'
import { useState } from 'react'
import { ModeToggle } from './ModeToggle'

interface TopNavProps {
    onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
    const { user, profile } = useAuth()
    const supabase = createClient()
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    const handleSignOut = async () => {
        setIsProfileOpen(false)
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border h-16 flex items-center px-4 sm:px-6 lg:px-8 justify-between">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    className="md:hidden -ml-2 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open sidebar</span>
                </button>
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
                        <span className="text-primary-foreground font-bold text-lg">M</span>
                    </div>
                    <span className="text-lg font-bold text-foreground hidden sm:block">
                        Mini <span className="text-primary">ATS</span>
                    </span>
                </Link>
            </div>

            <div className="flex items-center gap-2">
                {user ? (
                    <>
                        {profile?.role === 'admin' && (
                            <div className="hidden md:flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border border-primary/20">
                                <Shield className="h-3 w-3" />
                                Admin
                            </div>
                        )}
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                            <Settings className="h-4 w-4" />
                        </Button>
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 pl-2 focus:outline-none"
                            >
                                <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold ring-2 ring-background hover:ring-primary/50 transition-all overflow-hidden">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        user.email?.[0].toUpperCase()
                                    )}
                                </div>
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-popover rounded-xl shadow-xl shadow-black/20 border border-border py-1 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-3 border-b border-border">
                                        <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || user.email?.split('@')[0]}</p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                                {profile?.role || 'User'} Account
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-1">
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg flex items-center gap-2 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <Link href="/login">
                        <Button variant="default" size="sm" className="gap-2 rounded-lg px-4">
                            <UserIcon className="h-4 w-4" />
                            Sign in
                        </Button>
                    </Link>
                )}
            </div>
        </header>
    )
}
