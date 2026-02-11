"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth, useRequireAuth } from "@/lib/auth/hooks"
import { Candidate, Job } from "@/types"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import { Card, CardContent } from "@/components/ui/Card"
import { CandidateForm } from "@/components/CandidateForm"
import { InterviewScheduler } from "@/components/InterviewScheduler"
import { Loader2, Search, Filter, ChevronRight, Mail, Star, UserPlus, Video } from "lucide-react"
import Link from "next/link"

interface CandidateWithJob extends Candidate {
    job?: Job
}

export default function CandidatesPage() {
    useRequireAuth()
    const { user } = useAuth()
    const [candidates, setCandidates] = useState<CandidateWithJob[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false)
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
    const [jobs, setJobs] = useState<Job[]>([])

    // Filters
    const [searchTerm, setSearchTerm] = useState("")
    const [jobFilter, setJobFilter] = useState("all")

    const supabase = createClient()

    const fetchCandidates = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('candidates')
                .select('*, job:jobs(*)')
                .order('created_at', { ascending: false })

            if (jobFilter !== "all") {
                query = query.eq('job_id', jobFilter)
            }

            const { data, error } = await query
            if (error) throw error

            if (data) {
                let filtered = data as unknown as CandidateWithJob[]
                if (searchTerm) {
                    const lower = searchTerm.toLowerCase()
                    filtered = filtered.filter(c =>
                        c.full_name.toLowerCase().includes(lower) ||
                        c.email.toLowerCase().includes(lower) ||
                        c.job?.title.toLowerCase().includes(lower)
                    )
                }
                setCandidates(filtered)
            }
        } catch (error) {
            console.error("Error fetching candidates:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const loadJobs = async () => {
            const { data } = await supabase.from('jobs').select('*')
            if (data) setJobs(data as Job[])
        }
        if (user) loadJobs()
    }, [user])

    useEffect(() => {
        if (user) fetchCandidates()
    }, [user, jobFilter, searchTerm])

    const handleScheduleInterview = (candidateId: string) => {
        setSelectedCandidateId(candidateId)
        setIsInterviewModalOpen(true)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Talent <span className="text-gradient">Acquisition</span>
                    </h1>
                    <p className="text-slate-500 mt-1.5">
                        Review, track and manage your growing candidate pool.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="rounded-lg px-5 py-2.5 h-auto text-sm font-medium shadow-sm bg-blue-600 hover:bg-blue-700 transition-all gap-2"
                    >
                        <UserPlus className="h-4 w-4" />
                        New Candidate
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="glass-card rounded-xl overflow-visible">
                <CardContent className="p-3">
                    <div className="flex flex-col md:flex-row gap-3 items-center">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Search by name, email or position..."
                                className="pl-10 py-5 rounded-lg border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-64">
                            <div className="relative flex items-center">
                                <Filter className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={jobFilter}
                                    onChange={(e) => setJobFilter(e.target.value)}
                                    className="w-full pl-10 pr-4 h-11 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                >
                                    <option value="all">All Jobs</option>
                                    {jobs.map(job => (
                                        <option key={job.id} value={job.id}>{job.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center p-24"><Loader2 className="animate-spin h-8 w-8 text-blue-500/40" /></div>
                ) : candidates.length === 0 ? (
                    <Card className="border-2 border-dashed border-slate-200 bg-white py-20">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-slate-100">
                                <Search className="h-7 w-7 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No matches found</h3>
                            <p className="text-slate-500 max-w-xs text-sm">We could not find any candidates matching your current filters.</p>
                            <Button variant="ghost" onClick={() => { setSearchTerm(""); setJobFilter("all"); }} className="text-blue-600 font-medium">
                                Clear Filters
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {candidates.map(candidate => (
                            <div key={candidate.id} className="group">
                                <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <Link href={`/candidates/${candidate.id}`} className="flex items-center gap-4 flex-1">
                                            <div className="h-11 w-11 rounded-lg bg-slate-100 flex items-center justify-center text-blue-600 font-bold text-sm border border-slate-200 group-hover:scale-105 transition-transform">
                                                {candidate.full_name.substring(0, 1).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                                    {candidate.full_name}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Mail className="h-3 w-3" />
                                                    {candidate.email}
                                                </div>
                                            </div>
                                        </Link>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                        {candidate.job && (
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span className="text-xs font-medium text-slate-600">
                                                    {candidate.job.title}
                                                </span>
                                            </div>
                                        )}

                                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${candidate.stage === 'hired' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                candidate.stage === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                    candidate.stage === 'offer' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                            {candidate.stage}
                                        </div>

                                        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                            <span className="text-xs font-bold text-amber-700">{candidate.rating || 0}</span>
                                        </div>

                                        {/* Schedule Interview Button */}
                                        {(candidate.stage === 'screening' || candidate.stage === 'interview') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleScheduleInterview(candidate.id)}
                                                className="text-green-600 border-green-200 hover:bg-green-50"
                                            >
                                                <Video className="h-3 w-3 mr-1" />
                                                Schedule Interview
                                            </Button>
                                        )}

                                        <div className="hidden md:block">
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Candidate Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Register New Candidate"
                description="Manually add a candidate to your recruitment pipeline."
            >
                <div className="pt-4">
                    <CandidateForm onSuccess={() => {
                        setIsModalOpen(false)
                        fetchCandidates()
                    }} />
                </div>
            </Modal>

            {/* Schedule Interview Modal */}
            <InterviewScheduler
                isOpen={isInterviewModalOpen}
                onClose={() => {
                    setIsInterviewModalOpen(false)
                    setSelectedCandidateId(null)
                }}
                candidateId={selectedCandidateId || undefined}
                onScheduled={() => {
                    fetchCandidates()
                }}
            />
        </div>
    )
}
