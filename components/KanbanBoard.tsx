"use client"

import { useState, useEffect } from "react"
import {
    DndContext,
    DragOverlay,
    useSensors,
    useSensor,
    PointerSensor,
    closestCorners,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { createClient } from "@/lib/supabase/client"
import { Candidate, CandidateStage } from "@/types"
import { Card } from "@/components/ui/Card"
import { Loader2, Search, Filter, Star, Briefcase, MoreHorizontal } from "lucide-react"

const STAGES: CandidateStage[] = ['applied', 'screening', 'interview', 'offer', 'hired']

const STAGE_LABELS: Record<CandidateStage, string> = {
    applied: 'New Applied',
    screening: 'Screening',
    interview: 'Interviews',
    offer: 'Offer Phase',
    hired: 'Onboarded',
    rejected: 'Archived'
}

const STAGE_COLORS: Record<CandidateStage, string> = {
    applied: 'bg-blue-500',
    screening: 'bg-purple-500',
    interview: 'bg-amber-500',
    offer: 'bg-pink-500',
    hired: 'bg-emerald-500',
    rejected: 'bg-rose-500'
}

interface KanbanBoardProps {
    minWidth?: boolean
}

export function KanbanBoard({ minWidth = true }: KanbanBoardProps) {
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [jobs, setJobs] = useState<{ id: string, title: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [jobFilter, setJobFilter] = useState("all")

    const supabase = createClient()

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    )

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            const candQuery = supabase.from('candidates').select('*').order('created_at', { ascending: false })
            const jobQuery = supabase.from('jobs').select('id, title').eq('status', 'active')
            const [candRes, jobRes] = await Promise.all([candQuery, jobQuery])

            if (candRes.data) setCandidates((candRes.data as unknown) as Candidate[])
            if (jobRes.data) setJobs(jobRes.data)
            setLoading(false)
        }
        loadData()
    }, [])

    const updateCandidateStage = async (id: string, newStage: CandidateStage) => {
        setCandidates(prev => prev.map(c =>
            c.id === id ? { ...c, stage: newStage } : c
        ))

        const { error } = await supabase
            .from('candidates')
            .update({ stage: newStage })
            .eq('id', id)

        if (error) {
            console.error("Failed to update stage:", error.message)
            const { data } = await supabase.from('candidates').select('*').order('created_at', { ascending: false })
            if (data) setCandidates((data as unknown) as Candidate[])
        }
    }

    const onDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)
        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        const activeCandidate = candidates.find(c => c.id === activeId)
        if (!activeCandidate) return

        if (STAGES.includes(overId as CandidateStage)) {
            const newStage = overId as CandidateStage
            if (activeCandidate.stage !== newStage) {
                updateCandidateStage(activeId, newStage)
            }
            return
        }

        const overCandidate = candidates.find(c => c.id === overId)
        if (overCandidate && activeCandidate.stage !== overCandidate.stage) {
            updateCandidateStage(activeId, overCandidate.stage)
        }
    }

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesJob = jobFilter === 'all' || c.job_id === jobFilter
        return matchesSearch && matchesJob
    })

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500/40" />
            <p className="text-slate-400 font-medium text-sm">Loading board...</p>
        </div>
    )

    const activeCandidate = candidates.find(c => c.id === activeId)

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        className="w-full pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Search candidates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <div className="relative flex items-center">
                        <Filter className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <select
                            className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                            value={jobFilter}
                            onChange={(e) => setJobFilter(e.target.value)}
                        >
                            <option value="all">All Positions</option>
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm shadow-blue-600/20 whitespace-nowrap">
                    {filteredCandidates.length} Candidates
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                >
                    <div className={`flex h-full gap-4 overflow-x-auto pb-6 ${minWidth ? 'min-w-[1400px]' : ''}`}>
                        {STAGES.map(stage => (
                            <KanbanColumn
                                key={stage}
                                stage={stage}
                                candidates={filteredCandidates.filter(c => c.stage === stage)}
                                jobTitles={Object.fromEntries(jobs.map(j => [j.id, j.title]))}
                            />
                        ))}
                    </div>

                    <DragOverlay dropAnimation={null}>
                        {activeCandidate ? (
                            <div className="rotate-1 cursor-grabbing w-[300px] shadow-2xl z-50">
                                <KanbanCard
                                    candidate={activeCandidate}
                                    jobTitle={jobs.find(j => j.id === activeCandidate.job_id)?.title}
                                />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    )
}

function KanbanColumn({ stage, candidates, jobTitles }: { stage: CandidateStage, candidates: Candidate[], jobTitles: Record<string, string> }) {
    const { setNodeRef } = useSortable({
        id: stage,
        data: { type: "Column", stage },
        disabled: true
    })

    return (
        <div
            ref={setNodeRef}
            className="flex-1 min-w-[280px] bg-slate-50 rounded-xl flex flex-col border border-slate-200/60 overflow-hidden"
        >
            <div className={`h-1 w-full ${STAGE_COLORS[stage]}`} />

            <div className="px-4 py-4 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">{candidates.length} profiles</span>
                    <span className="text-sm font-bold text-slate-800">
                        {STAGE_LABELS[stage]}
                    </span>
                </div>
                <button className="p-1.5 rounded-md hover:bg-slate-200 text-slate-400 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            <SortableContext items={candidates.map(c => c.id)}>
                <div className="flex-1 px-3 pb-3 space-y-2.5 overflow-y-auto min-h-[400px]">
                    {candidates.map(candidate => (
                        <SortableCard key={candidate.id} candidate={candidate} jobTitle={jobTitles[candidate.job_id || '']} />
                    ))}
                    {candidates.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                            <Briefcase className="h-6 w-6 mb-2 text-slate-300" />
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Drop here</span>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    )
}

function SortableCard({ candidate, jobTitle }: { candidate: Candidate, jobTitle?: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: candidate.id,
        data: { type: "Candidate", candidate }
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    }

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-0 scale-95 h-[140px] rounded-xl border-2 border-blue-500 border-dashed bg-blue-50/50"
            />
        )
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="outline-none focus:ring-0">
            <KanbanCard candidate={candidate} jobTitle={jobTitle} />
        </div>
    )
}

function KanbanCard({ candidate, jobTitle }: { candidate: Candidate, jobTitle?: string }) {
    return (
        <Card className="bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-md duration-200 transition-all rounded-xl group cursor-grab active:cursor-grabbing">
            <div className="p-3.5">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200/60">
                            {candidate.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-800 truncate">{candidate.full_name}</div>
                            <div className="text-[10px] font-medium text-blue-600 truncate max-w-[120px]">
                                {candidate.current_title || 'Application'}
                            </div>
                        </div>
                    </div>
                </div>

                {jobTitle && (
                    <div className="mb-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 group-hover:border-blue-100 transition-colors">
                        <Briefcase className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-medium text-slate-500 truncate">{jobTitle}</span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`h-3 w-3 ${i < (candidate.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                            />
                        ))}
                    </div>
                    <div className="px-2 py-0.5 rounded-md bg-slate-50 text-[9px] font-medium text-slate-400">
                        {new Date(candidate.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>
        </Card>
    )
}
