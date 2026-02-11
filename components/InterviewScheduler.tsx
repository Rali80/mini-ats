'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/hooks'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Loader2, Video, MapPin, Link as LinkIcon, Plus, Calendar, Clock, Users } from 'lucide-react'
import { Interview, Candidate } from '@/types/enhanced'
import { generateMeetingLink, isValidMeetUrl } from '@/lib/google/google-meet'

interface InterviewSchedulerProps {
    isOpen: boolean
    onClose: () => void
    onScheduled?: (interview: Interview) => void
    initialDate?: Date
    candidateId?: string
    jobId?: string
}

export function InterviewScheduler({
    isOpen,
    onClose,
    onScheduled,
    initialDate,
    candidateId,
    jobId
}: InterviewSchedulerProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [generatingLink, setGeneratingLink] = useState(false)
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([])
    const supabase = createClient()


    const [formData, setFormData] = useState({
        candidate_id: candidateId || '',
        scheduled_date: initialDate?.toISOString().split('T')[0] || '',
        scheduled_time: '10:00',
        duration_minutes: '60',
        type: 'video' as 'phone' | 'video' | 'onsite' | 'technical',
        location: '',
        meeting_link: '',
        notes: '',
    })

    // Fetch candidates for dropdown
    useEffect(() => {
        const fetchCandidates = async () => {
            if (!user) return

            let query = supabase
                .from('candidates')
                .select('*, job:jobs(title)')
                .eq('customer_id', user.id)
                .in('stage', ['screening', 'interview'])
                .order('full_name')

            if (jobId) {
                query = query.eq('job_id', jobId)
            }

            const { data } = await query
            if (data) {
                setCandidates(data as unknown as Candidate[])
            }
        }

        if (isOpen) {
            fetchCandidates()
        }
    }, [user, isOpen, jobId, supabase])

    // Fetch available time slots when date changes
    useEffect(() => {
        if (formData.scheduled_date) {
            fetchAvailableSlots(formData.scheduled_date)
        }
    }, [formData.scheduled_date, user])


    const fetchAvailableSlots = async (date: string) => {
        // Generate sample slots
        const slots: { time: string; available: boolean }[] = []

        for (let hour = 9; hour <= 17; hour++) {
            if (hour === 12) continue

            slots.push({
                time: `${hour.toString().padStart(2, '0')}:00`,
                available: Math.random() > 0.3,
            })
            slots.push({
                time: `${hour.toString().padStart(2, '0')}:30`,
                available: Math.random() > 0.5,
            })
        }

        setAvailableSlots(slots)
    }

    // Generate Google Meet link
    const handleGenerateMeetLink = async () => {
        setGeneratingLink(true)
        try {
            // In production, this would call the Google Calendar API
            // For now, we generate a placeholder link
            const meetLink = generateMeetingLink('meet')
            setFormData({ ...formData, meeting_link: meetLink })
        } catch (error: any) {
            alert('Failed to generate Google Meet link: ' + error.message)
        } finally {
            setGeneratingLink(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)

        try {
            // Validate Google Meet URL if provided
            if (formData.meeting_link && !isValidMeetUrl(formData.meeting_link)) {
                // Allow manual links, just validate format
                if (!formData.meeting_link.startsWith('http')) {
                    alert('Please enter a valid URL starting with http:// or https://')
                    setLoading(false)
                    return
                }
            }

            const scheduledAt = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`).toISOString()
            const endTime = new Date(scheduledAt)
            endTime.setMinutes(endTime.getMinutes() + parseInt(formData.duration_minutes))

            const { data: interview, error } = await supabase
                .from('interviews')
                .insert({
                    candidate_id: formData.candidate_id,
                    job_id: candidates.find(c => c.id === formData.candidate_id)?.job_id || jobId,
                    customer_id: user.id,
                    scheduled_at: scheduledAt,
                    duration_minutes: parseInt(formData.duration_minutes),
                    type: formData.type,
                    location: formData.type === 'onsite' ? formData.location : null,
                    meeting_link: formData.type === 'video' ? formData.meeting_link : null,
                    interviewers: [user.id],
                    notes: formData.notes || null,
                    status: 'scheduled',
                })
                .select()
                .single()

            if (error) throw error

            // Create notification
            const candidate = candidates.find(c => c.id === formData.candidate_id)
            if (candidate) {
                await supabase.from('notifications').insert({
                    user_id: user.id,
                    type: 'interview_scheduled',
                    title: 'Interview Scheduled',
                    message: `Interview with ${candidate.full_name} scheduled for ${scheduledAt}${formData.meeting_link ? '\nMeeting Link: ' + formData.meeting_link : ''}`,
                    data: { candidate_id: candidate.id, interview_id: interview.id },
                })

                // Send email notification (via Supabase Edge Function in production)
                console.log('Email would be sent to:', candidate.email)
            }

            // Update candidate stage
            await supabase
                .from('candidates')
                .update({ stage: 'interview' })
                .eq('id', formData.candidate_id)

            onScheduled?.(interview as unknown as Interview)
            onClose()
            setFormData({
                candidate_id: candidateId || '',
                scheduled_date: '',
                scheduled_time: '10:00',
                duration_minutes: '60',
                type: 'video',
                location: '',
                meeting_link: '',
                notes: '',
            })
        } catch (error: any) {
            console.error('Error scheduling interview:', error)
            alert('Failed to schedule interview: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const selectedCandidateData = candidates.find(c => c.id === formData.candidate_id)

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Schedule Interview"
            description="Schedule an interview with a candidate"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Candidate Selection */}
                <div className="space-y-2">
                    <Label htmlFor="candidate_id">Candidate *</Label>
                    <Select
                        id="candidate_id"
                        value={formData.candidate_id}
                        onChange={(e) => setFormData({ ...formData, candidate_id: e.target.value })}
                    >
                        <option value="">Select a candidate...</option>
                        {candidates.map(candidate => (
                            <option key={candidate.id} value={candidate.id}>
                                {candidate.full_name} - {(candidate.job as any)?.title || 'No job'}
                            </option>
                        ))}
                    </Select>
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="scheduled_date">Date *</Label>
                        <div className="relative">
                            <Input
                                id="scheduled_date"
                                type="date"
                                value={formData.scheduled_date}
                                onChange={(e) => {
                                    const newDate = e.target.value
                                    setFormData({ ...formData, scheduled_date: newDate })
                                }}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>


                    <div className="space-y-2">
                        <Label htmlFor="scheduled_time">Time *</Label>
                        <Select
                            id="scheduled_time"
                            value={formData.scheduled_time}
                            onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                        >
                            <option value="">Select time...</option>
                            {availableSlots.map(slot => (
                                <option
                                    key={slot.time}
                                    value={slot.time}
                                    disabled={!slot.available}
                                >
                                    {slot.time} {!slot.available ? '(Busy)' : ''}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* Duration and Type */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="duration_minutes">Duration *</Label>
                        <Select
                            id="duration_minutes"
                            value={formData.duration_minutes}
                            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                        >
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="45">45 minutes</option>
                            <option value="60">1 hour</option>
                            <option value="90">1.5 hours</option>
                            <option value="120">2 hours</option>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Interview Type *</Label>
                        <Select
                            id="type"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        >
                            <option value="phone">📞 Phone Call</option>
                            <option value="video">📹 Video Call</option>
                            <option value="onsite">🏢 On-site</option>
                            <option value="technical">💻 Technical</option>
                        </Select>
                    </div>
                </div>

                {/* Meeting Link - Google Meet Integration */}
                {formData.type === 'video' && (
                    <div className="space-y-2">
                        <Label htmlFor="meeting_link">Meeting Link</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    id="meeting_link"
                                    placeholder="https://meet.google.com/..."
                                    value={formData.meeting_link}
                                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                                />
                                <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGenerateMeetLink}
                                disabled={generatingLink}
                                className="shrink-0"
                            >
                                {generatingLink ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Video className="h-4 w-4 mr-2 text-red-500" />
                                        Google Meet
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Click "Google Meet" to auto-generate a meeting link, or paste your own
                        </p>
                    </div>
                )}

                {/* Location for onsite */}
                {formData.type === 'onsite' && (
                    <div className="space-y-2">
                        <Label htmlFor="location">Location *</Label>
                        <Input
                            id="location"
                            placeholder="Office address or room number"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                    <Label htmlFor="notes">Interview Notes</Label>
                    <Textarea
                        id="notes"
                        placeholder="Topics to discuss, questions to ask..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                {/* Meeting Summary */}
                {formData.scheduled_date && formData.scheduled_time && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <h4 className="font-medium text-sm">Interview Summary</h4>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(formData.scheduled_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formData.scheduled_time} ({formData.duration_minutes} min)
                            </div>
                            {selectedCandidateData && (
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {selectedCandidateData.full_name}
                                </div>
                            )}
                            {formData.meeting_link && (
                                <div className="flex items-center gap-1 text-primary">
                                    <Video className="h-4 w-4" />
                                    Meeting link included
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Schedule Interview
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
