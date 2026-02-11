"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/hooks"
import { Candidate, Job } from "@/types"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Modal } from "@/components/ui/Modal"
import { CandidateForm } from "@/components/CandidateForm"
import { Loader2, ArrowLeft, Mail, Phone, Globe, Linkedin, Calendar, Briefcase, MapPin, Trash2, Edit } from "lucide-react"
import Link from "next/link"

export default function CandidateDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const [candidate, setCandidate] = useState<Candidate | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const supabase = createClient()

    const loadCandidate = async () => {
        if (!id) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('candidates')
                .select('*, job:jobs(*)')
                .eq('id', id)
                .single()

            if (error) throw error
            if (data) setCandidate(data as unknown as Candidate)
        } catch (error) {
            console.error("Error loading candidate:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user && id) {
            loadCandidate()
        }
    }, [user, id])

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this candidate?")) return

        try {
            const { error } = await supabase.from('candidates').delete().eq('id', id)
            if (error) throw error
            router.push('/candidates')
        } catch (error) {
            console.error("Error deleting candidate:", error)
            alert("Failed to delete candidate")
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
    if (!candidate) return <div className="p-8 text-center uppercase tracking-widest text-muted-foreground">Candidate not found</div>

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-4">
                <Link href="/candidates" className="text-sm text-muted-foreground hover:text-blue-500 flex items-center gap-1 w-fit transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Candidates
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-blue-50 flex items-center justify-center text-xl text-blue-600 font-bold border border-blue-100">
                            {candidate.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{candidate.full_name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize border
                                    ${candidate.stage === 'hired' ? 'bg-green-50 text-green-700 border-green-200' :
                                        candidate.stage === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    {candidate.stage}
                                </span>
                                {candidate.job && (
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Briefcase className="h-3.5 w-3.5" />
                                        {candidate.job.title}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(true)} className="gap-2">
                            <Edit className="h-4 w-4" /> Edit
                        </Button>
                        <Button variant="danger" onClick={handleDelete} className="gap-2">
                            <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Contact & Metadata */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contact Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 rounded-md bg-muted">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className="truncate">{candidate.email}</span>
                            </div>
                            {candidate.phone && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 rounded-md bg-muted">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <span>{candidate.phone}</span>
                                </div>
                            )}
                            {candidate.linkedin_url && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 rounded-md bg-muted">
                                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                                        LinkedIn Profile
                                    </a>
                                </div>
                            )}
                            {candidate.portfolio_url && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 rounded-md bg-muted">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                                        Portfolio Site
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Application Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Applied on</span>
                                <span className="font-medium">{new Date(candidate.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Rating</span>
                                <span className="text-yellow-600 font-bold">★ {candidate.rating || 0}</span>
                            </div>
                            {candidate.years_of_experience !== undefined && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Experience</span>
                                    <span className="font-medium">{candidate.years_of_experience} years</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Professional Info & Notes */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Professional Background</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Current Role</label>
                                    <p className="font-medium">{candidate.current_title || 'No title provided'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Current Company</label>
                                    <p className="font-medium">{candidate.current_company || 'No company provided'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Location</label>
                                    <p className="font-medium flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                        {candidate.location || 'Unknown'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Skills</label>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.skills && candidate.skills.length > 0 ? (
                                        candidate.skills.map(skill => (
                                            <span key={skill} className="px-3 py-1 bg-muted border border-border rounded-md text-sm font-medium">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground italic">No skills listed</span>
                                    )}
                                </div>
                            </div>

                            {candidate.resume_url && (
                                <div className="pt-4 border-t border-slate-100">
                                    <Button variant="outline" className="w-full sm:w-auto" asChild>
                                        <a
                                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/${candidate.resume_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            View Attached Resume
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notes & Remarks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted p-4 rounded-lg border border-border whitespace-pre-wrap text-sm leading-relaxed min-h-[100px]">
                                {candidate.notes || 'No notes added for this candidate yet.'}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Candidate Profile"
                description="Update candidate information and current hiring stage."
            >
                <div>
                    <CandidateForm
                        initialData={candidate}
                        onSuccess={() => {
                            setIsEditModalOpen(false)
                            loadCandidate()
                        }}
                    />
                </div>
            </Modal>
        </div>
    )
}
