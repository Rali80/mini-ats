 'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth, useRequireAuth } from '@/lib/auth/hooks'
import { Search, Calendar, ChevronRight, Star, MapPin, Phone, MoreHorizontal, User, Briefcase, FileText, CheckCircle, XCircle, Clock, Video } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Interview {
    id: string
    scheduled_at: string
    duration_minutes: number
    meeting_link: string | null
    type: string
    candidate_id?: string
    candidate: {
        id: string
        full_name: string
        job?: { id: string; title: string }[] | null
    }
}



export default function DashboardPage() {
    useRequireAuth()
    const { user } = useAuth()
    const [stats, setStats] = useState({ jobs: 0, candidates: 0, hired: 0 })
    const [recentCandidates, setRecentCandidates] = useState<any[]>([])
    const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([])
    const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>([])
    const [loading, setLoading] = useState(true)
    const [debugInfo, setDebugInfo] = useState<string>('')
    
    // Filters
    const [jobFilter, setJobFilter] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [dateFilter, setDateFilter] = useState<string>('all') // all, today, week, month
    const [jobs, setJobs] = useState<any[]>([])
    
    const supabase = createClient()


    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                setLoading(true)
                try {
                    // First, let's check what interviews exist (debug)
                    const { data: allInterviews, error: debugError } = await supabase
                        .from('interviews')
                        .select('id, customer_id, scheduled_at')
                        .gte('scheduled_at', new Date().toISOString())
                    
                    console.log('All future interviews:', allInterviews)
                    console.log('Current user ID:', user.id)
                    console.log('Debug error:', debugError)
                    
                    setDebugInfo(`Found ${allInterviews?.length || 0} total future interviews. User: ${user.id}`)

                    // First get all columns to see what's available
                    const { data: rawInterviews, error: interviewError } = await supabase
                        .from('interviews')
                        .select('*')
                        .eq('customer_id', user.id)
                        .gte('scheduled_at', new Date().toISOString())
                        .order('scheduled_at', { ascending: true })
                    
                    console.log('Raw interviews:', rawInterviews)
                    console.log('Interview error:', interviewError)
                    console.log('Interview columns:', rawInterviews?.[0] ? Object.keys(rawInterviews[0]) : 'no data')


                    // Get candidates and jobs data
                    const [{ count: jobsCount }, { count: candCount }, { count: hiredCount }, { data: recent }, { data: jobsData }, { data: candidatesData }] = await Promise.all([
                        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('customer_id', user.id),
                        supabase.from('candidates').select('*', { count: 'exact', head: true }).eq('customer_id', user.id),
                        supabase.from('candidates').select('*', { count: 'exact', head: true }).eq('customer_id', user.id).eq('stage', 'hired'),
                        supabase.from('candidates').select('*, job:jobs(title)').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(5),
                        supabase.from('jobs').select('id, title').eq('customer_id', user.id),
                        supabase.from('candidates').select('id, full_name, job:jobs(id, title)').eq('customer_id', user.id)
                    ])

                    // Map interviews with candidate data
                    const interviews = rawInterviews?.map(interview => {
                        const candidate = candidatesData?.find(c => c.id === interview.candidate_id)
                        return {
                            ...interview,
                            candidate: candidate || { id: interview.candidate_id, full_name: 'Unknown', job: null }
                        }
                    }) as Interview[] || []



                    setStats({
                        jobs: jobsCount || 0,
                        candidates: candCount || 0,
                        hired: hiredCount || 0
                    })
                    setRecentCandidates(recent || [])
                    setJobs(jobsData || [])
                    setUpcomingInterviews(interviews)
                    setFilteredInterviews(interviews)



                } catch (error) {
                    console.error('Error fetching dashboard data:', error)
                    setDebugInfo(`Error: ${error}`)
                } finally {
                    setLoading(false)
                }
            }
            fetchData()
        }
    }, [user])

    // Apply filters
    useEffect(() => {
        let filtered = [...upcomingInterviews]

        // Filter by job
        if (jobFilter !== 'all') {
            filtered = filtered.filter(i => (i.candidate as any)?.job?.id === jobFilter)
        }

        // Filter by search term (candidate name)
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(i => 
                i.candidate.full_name.toLowerCase().includes(term)
            )
        }

        // Filter by date
        const now = new Date()
        if (dateFilter === 'today') {
            const today = now.toISOString().split('T')[0]
            filtered = filtered.filter(i => i.scheduled_at.startsWith(today))
        } else if (dateFilter === 'week') {
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            filtered = filtered.filter(i => i.scheduled_at <= weekFromNow)
        } else if (dateFilter === 'month') {
            const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
            filtered = filtered.filter(i => i.scheduled_at <= monthFromNow)
        }

        setFilteredInterviews(filtered)
    }, [upcomingInterviews, jobFilter, searchTerm, dateFilter])


    const formatInterviewTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        let dayText = date.toLocaleDateString('en-US', { weekday: 'long' })
        if (date.toDateString() === now.toDateString()) {
            dayText = 'Today'
        } else if (date.toDateString() === tomorrow.toDateString()) {
            dayText = 'Tomorrow'
        }
        
        const timeText = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        return `${dayText}, ${timeText}`
    }

    const handleJoinMeeting = (interview: Interview) => {
        if (interview?.meeting_link) {
            window.open(interview.meeting_link, '_blank')
        }
    }

    const handleViewCandidate = (interview: Interview) => {
        if (interview) {
            window.location.href = `/candidates/${interview.candidate.id}`
        }
    }



    const QuickActionFunc = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
        <div className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all cursor-pointer whitespace-nowrap ${active ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-blue-900/20' : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-muted'}`}>
            <Icon className={`w-5 h-5 ${active ? 'text-primary-foreground' : 'text-primary'}`} />
            <span className="font-medium">{label}</span>
        </div>
    )

    const StageCircle = ({ icon: Icon, label, color }: { icon: any, label: string, color: string }) => (
        <div className="flex flex-col items-center gap-3 group cursor-pointer">
            <div className={`w-16 h-16 rounded-full ${color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border border-border/50`}>
                <Icon className="w-7 h-7 text-white" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
    )

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {/* Header / Search */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Hello, {user?.email?.split('@')[0]} 👋</h1>
                        <p className="text-muted-foreground text-sm">Welcome back to your dashboard</p>
                    </div>
                    <div className="w-10 h-10 bg-muted rounded-full overflow-hidden border-2 border-background shadow-sm">


                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search candidates, jobs..."
                        className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
                    />
                </div>
            </div>

            {/* Services / Actions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold text-foreground">Quick Actions</h2>
                    <span className="text-sm font-medium text-primary cursor-pointer hover:underline">See All</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    <Link href="/candidates">
                        <QuickActionFunc icon={User} label="Candidates" active />
                    </Link>
                    <Link href="/jobs">
                        <QuickActionFunc icon={Briefcase} label="Jobs" />
                    </Link>
                    <Link href="/board">
                        <QuickActionFunc icon={FileText} label="Board" />
                    </Link>
                    <Link href="/dashboard">
                        <QuickActionFunc icon={Clock} label="History" />
                    </Link>
                </div>
            </div>

            {/* Info message */}
            <div className="text-sm text-muted-foreground">
                Hemos encontrado {upcomingInterviews.length} {upcomingInterviews.length === 1 ? 'reunión' : 'reuniones'}
            </div>


            {/* Upcoming Interviews */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold text-foreground">Upcoming Interviews ({filteredInterviews.length})</h2>
                    <Link href="/candidates">
                        <span className="text-sm font-medium text-primary cursor-pointer hover:underline">Schedule New</span>
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-card rounded-xl p-4 border border-border space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Search by name */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search candidate..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* Filter by job */}
                        <select
                            value={jobFilter}
                            onChange={(e) => setJobFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">All Jobs</option>
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>

                        {/* Filter by date */}
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">All Dates</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                    </div>
                </div>

                {filteredInterviews.length > 0 ? (

                    <div className="space-y-3">
                        {filteredInterviews.map((interview, index) => (

                            <div key={interview.id} className={`rounded-2xl p-5 text-white shadow-lg relative overflow-hidden ${index === 0 ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-900/20' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                
                                <div className="flex items-start justify-between relative z-10 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center overflow-hidden backdrop-blur-sm ${index === 0 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}>
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{interview.candidate.full_name}</h3>
                                        <p className="text-white/70 text-sm">{(interview.candidate as any).job?.[0]?.title || 'Candidate'}</p>

                                        </div>
                                    </div>
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm border ${index === 0 ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/5'}`}>
                                        {interview.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                                    </div>
                                </div>

                                <div className={`rounded-xl p-3 flex items-center justify-between mb-4 backdrop-blur-md border ${index === 0 ? 'bg-black/20 border-white/10' : 'bg-black/10 border-white/5'}`}>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-white/70" />
                                        <span className="text-sm font-medium text-white">{formatInterviewTime(interview.scheduled_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-white/70" />
                                        <span className="text-sm font-medium text-white">{interview.duration_minutes} min</span>

                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleJoinMeeting(interview)}
                                        disabled={!interview.meeting_link}
                                        className="flex-1 bg-white text-slate-700 py-2.5 rounded-lg font-bold text-sm hover:bg-white/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {interview.meeting_link ? 'Join' : 'No Link'}
                                    </button>
                                    <button 
                                        onClick={() => handleViewCandidate(interview)}
                                        className="flex-1 bg-white/10 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-white/20 transition-colors border border-white/20 backdrop-blur-sm"
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* No Interviews Card */
                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 text-slate-600 dark:text-slate-400 shadow-lg relative overflow-hidden">
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-4">
                                <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-2">No Upcoming Interviews</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Schedule an interview with a candidate to see it here</p>
                            <Link href="/candidates">
                                <button className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg">
                                    View Candidates
                                </button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>



            {/* Specialties (Stages) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold text-foreground">Pipeline Stages</h2>
                    <span className="text-sm font-medium text-primary cursor-pointer hover:underline">See All</span>
                </div>
                <div className="flex justify-between px-2">
                    <StageCircle icon={FileText} label="Applied" color="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-800" />
                    <StageCircle icon={CheckCircle} label="Screening" color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 dark:border-indigo-800" />
                    <StageCircle icon={User} label="Interview" color="bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400 dark:border-violet-800" />
                    <StageCircle icon={Star} label="Offer" color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800" />
                </div>
            </div>

            {/* Top Doctors (Recent Candidates) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold text-foreground">Recent Applications</h2>
                    <span className="text-sm font-medium text-primary cursor-pointer hover:underline">See All</span>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-card p-4 rounded-2xl border border-border animate-pulse h-24"></div>
                        ))
                    ) : recentCandidates.length === 0 ? (
                        <div className="bg-muted/30 rounded-2xl p-8 text-center text-muted-foreground">No applications yet</div>
                    ) : (
                        recentCandidates.map((cand) => (
                            <div key={cand.id} className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group hover:border-primary/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-muted relative overflow-hidden flex-shrink-0">
                                            {/* Placeholder for avatar */}
                                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-bold text-xl">
                                                {cand.full_name.charAt(0)}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground text-lg">{cand.full_name}</h3>
                                            <p className="text-muted-foreground text-sm">{(cand.job as any)?.title || 'General Pool'}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                <span className="text-xs font-bold text-foreground">New</span>
                                                <span className="text-xs text-muted-foreground">| 0 Reviews</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Link href={`/candidates/${cand.id}`}>
                                            <button className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-blue-500/20">
                                                View
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
