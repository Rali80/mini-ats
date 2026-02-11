'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Loader2, Plus, Briefcase, ChevronRight, MapPin, Clock, Users } from 'lucide-react'
import { useAuth, useRequireAuth } from '@/lib/auth/hooks'
import { Job } from '@/types'
import Link from 'next/link'

interface JobWithCount extends Job {
    candidates: { count: number }[]
}

export default function JobsPage() {
    useRequireAuth()
    const { user } = useAuth()
    const [jobs, setJobs] = useState<JobWithCount[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form State
    const [newJobTitle, setNewJobTitle] = useState('')
    const [newJobDescription, setNewJobDescription] = useState('')
    const [newJobLocation, setNewJobLocation] = useState('')
    const [newJobType, setNewJobType] = useState('full_time')
    const [creating, setCreating] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        if (user) {
            fetchJobs()
        }
    }, [user])

    const fetchJobs = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('jobs')
                .select('*, candidates(count)')
                .order('created_at', { ascending: false })

            if (error) throw error
            if (data) setJobs(data as unknown as JobWithCount[])
        } catch (error) {
            console.error('Error fetching jobs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setCreating(true)
        try {
            const { error } = await supabase
                .from('jobs')
                .insert([{
                    title: newJobTitle,
                    description: newJobDescription,
                    location: newJobLocation,
                    employment_type: newJobType,
                    customer_id: user.id,
                    status: 'active'
                }])
            if (error) throw error
            setNewJobTitle('')
            setNewJobDescription('')
            setNewJobLocation('')
            setIsModalOpen(false)
            fetchJobs()
        } catch (error) {
            console.error('Error creating job:', error)
            alert('Failed to create job')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Open <span className="text-gradient">Positions</span>
                    </h1>
                    <p className="text-slate-500 mt-1.5">
                        Manage and monitor your active job listings.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="rounded-lg px-5 py-2.5 h-auto text-sm font-medium shadow-sm shadow-blue-600/20 bg-blue-600 hover:bg-blue-700 transition-all gap-2">
                    <Plus className="h-4 w-4" />
                    Post New Job
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-24"><Loader2 className="animate-spin h-8 w-8 text-blue-500/40" /></div>
            ) : jobs.length === 0 ? (
                <Card className="border-2 border-dashed border-slate-200 bg-white">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-5">
                        <div className="p-5 rounded-2xl bg-blue-50">
                            <Briefcase className="h-10 w-10 text-blue-500" />
                        </div>
                        <div className="max-w-sm">
                            <h3 className="text-xl font-bold text-slate-900">No jobs posted yet</h3>
                            <p className="text-slate-500 mt-1.5 text-sm">Create your first job posting to start attracting top talent.</p>
                        </div>
                        <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-lg px-6 border-slate-300">
                            Get Started
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.map((job) => (
                        <Link href={`/jobs/${job.id}`} key={job.id} className="group">
                            <Card className="glass-card h-full flex flex-col rounded-xl overflow-hidden hover:-translate-y-0.5 duration-200">
                                <CardHeader className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${job.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                                            }`}>
                                            {job.status}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                            {new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors leading-tight">
                                        {job.title}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 text-slate-500 leading-relaxed text-sm">
                                        {job.description || 'No description provided for this role.'}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="mt-auto pt-0 space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {job.location && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-[11px] font-medium text-slate-600 border border-slate-100">
                                                <MapPin className="h-3 w-3 text-blue-500" />
                                                {job.location}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-[11px] font-medium text-slate-600 border border-slate-100">
                                            <Clock className="h-3 w-3 text-blue-500" />
                                            {job.employment_type?.replace('_', ' ') || 'Full Time'}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div className="text-xs font-medium text-slate-500">
                                            <span className="font-bold text-slate-800">{job.candidates?.[0]?.count || 0}</span> candidates
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Post New Job"
                description="Expand your team by creating a new job listing."
            >
                <form id="create-job-form" onSubmit={handleCreateJob} className="space-y-5 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Job Title</label>
                        <Input
                            required
                            placeholder="e.g. Principal Product Designer"
                            className="rounded-lg py-5 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                            value={newJobTitle}
                            onChange={(e) => setNewJobTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</label>
                            <Input
                                placeholder="e.g. Remote, Madrid"
                                className="rounded-lg py-5 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                                value={newJobLocation}
                                onChange={(e) => setNewJobLocation(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</label>
                            <select
                                className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newJobType}
                                onChange={(e) => setNewJobType(e.target.value)}
                            >
                                <option value="full_time">Full Time</option>
                                <option value="part_time">Part Time</option>
                                <option value="contract">Contract</option>
                                <option value="internship">Internship</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                        <textarea
                            className="flex min-h-[100px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Tell us about the role, requirements and what makes it special..."
                            value={newJobDescription}
                            onChange={(e) => setNewJobDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-lg">Cancel</Button>
                        <Button type="submit" disabled={creating} className="rounded-lg px-6 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20">
                            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Job
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
