'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Loader2, ArrowLeft, Plus, Linkedin, Trash2, Edit, ChevronRight, Briefcase, MapPin, Clock } from 'lucide-react'
import { useAuth } from '@/lib/auth/hooks'
import { Job, Candidate } from '@/types'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { CandidateForm } from '@/components/CandidateForm'
import { JobForm } from '@/components/JobForm'

export default function JobDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const [job, setJob] = useState<Job | null>(null)
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [loading, setLoading] = useState(true)

    // Modal State
    const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false)
    const [isEditJobOpen, setIsEditJobOpen] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        if (user && id) {
            loadData()
        }
    }, [user, id])

    const loadData = async () => {
        try {
            setLoading(true)

            // Fetch Job
            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', id)
                .single()

            if (jobError) throw jobError
            setJob(jobData as Job)

            // Fetch Candidates
            const { data: candData, error: candError } = await supabase
                .from('candidates')
                .select('*')
                .eq('job_id', id)
                .order('created_at', { ascending: false })

            if (candError) throw candError
            setCandidates(candData as Candidate[])

        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteJob = async () => {
        if (!confirm('Are you sure? This will delete the job and all its candidates.')) return

        try {
            const { error } = await supabase.from('jobs').delete().eq('id', id)
            if (error) throw error
            router.push('/jobs')
        } catch (err) {
            console.error(err)
            alert('Failed to delete job')
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
    if (!job) return <div className="p-8 text-center text-muted-foreground">Job not found</div>

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-4">
                <Link href="/jobs" className="text-sm text-muted-foreground hover:text-blue-500 flex items-center gap-1 w-fit transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Jobs
                </Link>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-4 flex-1">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize border
                                    ${job.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                    {job.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {job.location || 'Remote'}
                                </div>
                                <div className="flex items-center gap-1.5 capitalize">
                                    <Clock className="h-4 w-4" />
                                    {job.employment_type?.replace('_', ' ') || 'Full Time'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Briefcase className="h-4 w-4" />
                                    {candidates.length} candidates
                                </div>
                            </div>
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-w-3xl border-l-2 border-slate-100 dark:border-slate-800 pl-4 py-1">
                            {job.description || 'No description provided.'}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setIsEditJobOpen(true)} className="gap-2">
                            <Edit className="h-4 w-4" /> Edit Job
                        </Button>
                        <Button variant="danger" size="sm" onClick={handleDeleteJob} className="gap-2">
                            <Trash2 className="h-4 w-4" /> Delete Job
                        </Button>
                        <Link href={`/board`}>
                            <Button variant="secondary" size="sm">View Board</Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        Candidates
                        <span className="text-sm font-normal text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{candidates.length}</span>
                    </h2>
                    <Button onClick={() => setIsAddCandidateOpen(true)} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Candidate
                    </Button>
                </div>

                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                        {candidates.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground bg-slate-50/50 dark:bg-slate-900/10">
                                <p>No candidates have applied for this position yet.</p>
                                <Button variant="ghost" onClick={() => setIsAddCandidateOpen(true)} className="mt-2 text-blue-600 font-bold hover:bg-blue-50/10">
                                    Add the first one
                                </Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {candidates.map((cand) => (
                                    <Link key={cand.id} href={`/candidates/${cand.id}`} className="block group">
                                        <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold group-hover:bg-blue-100 transition-colors">
                                                    {cand.full_name?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium group-hover:text-blue-600 transition-colors">{cand.full_name}</div>
                                                    <div className="text-sm text-muted-foreground">{cand.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="hidden sm:flex items-center gap-2">
                                                    {cand.linkedin_url && (
                                                        <Linkedin className="h-4 w-4 text-slate-400" />
                                                    )}
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                                                        ${cand.stage === 'hired' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            cand.stage === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                        {cand.stage}
                                                    </span>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Job Modal */}
            <Modal
                isOpen={isEditJobOpen}
                onClose={() => setIsEditJobOpen(false)}
                title="Edit Job Posting"
                description="Update the details of this position."
            >
                <JobForm
                    initialData={job}
                    onSuccess={() => {
                        setIsEditJobOpen(false)
                        loadData()
                    }}
                />
            </Modal>

            {/* Add Candidate Modal */}
            <Modal
                isOpen={isAddCandidateOpen}
                onClose={() => setIsAddCandidateOpen(false)}
                title="Add Candidate"
                description="Enter candidate details for this position."
            >
                <div>
                    <CandidateForm
                        onSuccess={() => {
                            setIsAddCandidateOpen(false)
                            loadData()
                        }}
                    />
                </div>
            </Modal>
        </div>
    )
}
