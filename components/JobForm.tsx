"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/hooks"
import { Job } from "@/types"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"
import { Loader2 } from "lucide-react"

interface JobFormProps {
    onSuccess?: () => void
    initialData?: Job | null
}

export function JobForm({ onSuccess, initialData }: JobFormProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState(initialData?.title || "")
    const [description, setDescription] = useState(initialData?.description || "")
    const [location, setLocation] = useState(initialData?.location || "")
    const [type, setType] = useState(initialData?.employment_type || "full_time")
    const [status, setStatus] = useState(initialData?.status || "active")

    const supabase = createClient()

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title)
            setDescription(initialData.description || "")
            setLocation(initialData.location || "")
            setType(initialData.employment_type || "full_time")
            setStatus(initialData.status || "active")
        }
    }, [initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            const payload = {
                title,
                description,
                location,
                employment_type: type,
                customer_id: user.id,
                status
            }

            if (initialData?.id) {
                const { error } = await supabase
                    .from('jobs')
                    .update(payload)
                    .eq('id', initialData.id)
                if (error) throw error
                alert("Job updated successfully!")
            } else {
                const { error } = await supabase
                    .from('jobs')
                    .insert([payload])
                if (error) throw error
                alert("Job created successfully!")
            }

            onSuccess?.()
        } catch (error: any) {
            console.error("Error saving job:", error)
            alert("Failed to save job: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                    id="title"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        placeholder="e.g. Remote, NY"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Employment Type</Label>
                    <Select
                        id="type"
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                    >
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'closed')}
                >
                    <option value="active">Active</option>
                    <option value="closed">Closed / Internal</option>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    className="min-h-[120px]"
                    placeholder="Job requirements and details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Update Job" : "Post Job"}
                </Button>
            </div>
        </form>
    )
}
