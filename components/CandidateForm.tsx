"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/Textarea"
import { Select } from "@/components/ui/Select"
import { Tabs, TabsContent, TabsList, TabsTrigger, TabsContainer } from "@/components/ui/Tabs"
import { Rating } from "@/components/ui/Rating"
import { Loader2, Upload, FileText, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth/hooks"
import { Job, Candidate } from "@/types"

const candidateSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    linkedin_url: z.string().url("Invalid URL").optional().or(z.literal("")),
    portfolio_url: z.string().url("Invalid URL").optional().or(z.literal("")),

    current_company: z.string().optional(),
    current_title: z.string().optional(),
    location: z.string().optional(),
    years_of_experience: z.coerce.number().min(0).optional(),
    skills: z.string().optional(), // Comma separated string for input
    job_id: z.string().min(1, "Please select a job"),

    notes: z.string().optional(),
    rating: z.coerce.number().min(0).max(5).default(0),
})

type CandidateFormValues = z.infer<typeof candidateSchema>

interface CandidateFormProps {
    onSuccess?: () => void
    initialData?: Candidate | null
}

export function CandidateForm({ onSuccess, initialData }: CandidateFormProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [jobs, setJobs] = useState<Job[]>([])
    const [resumeFile, setResumeFile] = useState<File | null>(null)

    const supabase = createClient()

    const form = useForm<CandidateFormValues>({
        resolver: zodResolver(candidateSchema) as any,
        defaultValues: {
            full_name: initialData?.full_name || "",
            email: initialData?.email || "",
            phone: initialData?.phone || "",
            linkedin_url: initialData?.linkedin_url || "",
            portfolio_url: initialData?.portfolio_url || "",
            current_company: initialData?.current_company || "",
            current_title: initialData?.current_title || "",
            location: initialData?.location || "",
            years_of_experience: initialData?.years_of_experience || 0,
            skills: initialData?.skills ? initialData.skills.join(", ") : "",
            job_id: initialData?.job_id || "",
            notes: initialData?.notes || "",
            rating: initialData?.rating || 1,
        },
        shouldUnregister: false,
    })

    // Update form when initialData changes (for modals/navigation)
    useEffect(() => {
        if (initialData) {
            form.reset({
                full_name: initialData.full_name,
                email: initialData.email,
                phone: initialData.phone || "",
                linkedin_url: initialData.linkedin_url || "",
                portfolio_url: initialData.portfolio_url || "",
                current_company: initialData.current_company || "",
                current_title: initialData.current_title || "",
                location: initialData.location || "",
                years_of_experience: initialData.years_of_experience || 0,
                skills: initialData.skills ? initialData.skills.join(", ") : "",
                job_id: initialData.job_id,
                notes: initialData.notes || "",
                rating: initialData.rating || 1,
            })
        }
    }, [initialData, form])

    useEffect(() => {
        async function fetchJobs() {
            if (!user) return

            try {
                console.log("Fetching active jobs for user:", user.id)
                const { data, error } = await supabase
                    .from("jobs")
                    .select("*")
                    .eq("status", "active")
                    .order("created_at", { ascending: false })

                if (error) {
                    console.error("Error fetching jobs:", error)
                    return
                }

                console.log(`Found ${data?.length || 0} active jobs`)
                if (data) setJobs(data as Job[])
            } catch (err) {
                console.error("Unexpected error fetching jobs:", err)
            }
        }

        if (!loading) {
            fetchJobs()
        }
    }, [user, loading, supabase])

    // Debugging: Watch form values
    const watchedValues = form.watch()
    useEffect(() => {
        console.log("Form values changed:", watchedValues)
    }, [watchedValues])

    const onSubmit = async (data: CandidateFormValues) => {
        console.log("onSubmit triggered with data:", JSON.stringify(data, null, 2))
        if (!user) {
            alert("You must be logged in to add a candidate.")
            return
        }
        setLoading(true)

        try {
            console.log("Submitting candidate data to Supabase...")
            let resumeUrl = null

            // Upload Resume if exists
            if (resumeFile) {
                try {
                    const fileExt = resumeFile.name.split('.').pop()
                    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
                    const filePath = `${user.id}/${fileName}`

                    const { error: uploadError } = await supabase.storage
                        .from('resumes')
                        .upload(filePath, resumeFile)

                    if (uploadError) {
                        console.error("Storage error:", uploadError)
                        throw new Error(`Resume upload failed: ${uploadError.message}. Make sure the 'resumes' bucket exists in Supabase.`)
                    }
                    resumeUrl = filePath
                } catch (uploadErr: any) {
                    throw uploadErr
                }
            }

            const payload = {
                customer_id: user.id,
                job_id: data.job_id,
                full_name: data.full_name,
                name: data.full_name, // Support legacy column temporarily
                email: data.email,
                phone: data.phone || null,
                linkedin_url: data.linkedin_url || null,
                portfolio_url: data.portfolio_url || null,
                resume_url: resumeUrl || initialData?.resume_url, // Keep old resume if no new one

                current_company: data.current_company || null,
                current_title: data.current_title || null,
                location: data.location || null,
                years_of_experience: data.years_of_experience || 0,
                skills: data.skills ? data.skills.split(',').map(s => s.trim()) : [],

                notes: data.notes || null,
                rating: data.rating || 1,
            }

            if (initialData?.id) {
                // Update
                const { error: updateError } = await supabase
                    .from("candidates")
                    .update(payload)
                    .eq('id', initialData.id)

                if (updateError) {
                    console.error("Update error:", updateError)
                    throw updateError
                }
                alert("Candidate updated successfully!")
            } else {
                // Create
                const { error: insertError } = await supabase.from("candidates").insert({
                    ...payload,
                    stage: 'applied'
                })

                if (insertError) {
                    console.error("Insert error:", insertError)
                    throw insertError
                }
                alert("Candidate added successfully!")
            }

            if (!initialData) {
                form.reset()
                setResumeFile(null)
            }
            onSuccess?.()

        } catch (error: any) {
            console.error("Error submitting form:", error)
            alert("Failed to add candidate: " + (error.message || "Unknown error"))
        } finally {
            setLoading(false)
        }
    }

    const onInvalid = (errors: any) => {
        console.error("onInvalid triggered. Errors object:", JSON.stringify(errors, null, 2))
        const errorMessages = Object.entries(errors)
            .map(([field, error]: [string, any]) => `${field}: ${error.message}`)
            .join("\n")
        alert("Please fix the following errors:\n" + (errorMessages || "Check console for details"))
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
            <TabsContainer defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="professional">Professional</TabsTrigger>
                    <TabsTrigger value="additional">Additional</TabsTrigger>
                </TabsList>

                {/* BASIC TAB */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="job_id">Assign to Job *</Label>
                            {jobs.length === 0 ? (
                                <div className="p-3 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-900/50 rounded-md">
                                    <p className="text-sm text-amber-800 dark:text-amber-400">
                                        No active jobs found. You must <a href="/jobs" className="underline font-bold">create a job</a> first.
                                    </p>
                                </div>
                            ) : (
                                <Select id="job_id" {...form.register("job_id")}>
                                    <option value="">Select a job...</option>
                                    {jobs.map(job => (
                                        <option key={job.id} value={job.id}>{job.title}</option>
                                    ))}
                                </Select>
                            )}
                            {form.formState.errors.job_id && (
                                <p className="text-xs text-red-500 font-medium">{form.formState.errors.job_id.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name *</Label>
                            <Input id="full_name" {...form.register("full_name")} placeholder="Jane Doe" />
                            {form.formState.errors.full_name && (
                                <p className="text-xs text-red-500 font-medium">{form.formState.errors.full_name.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input id="email" type="email" {...form.register("email")} placeholder="jane@example.com" />
                                {form.formState.errors.email && (
                                    <p className="text-xs text-red-500 font-medium">{form.formState.errors.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" {...form.register("phone")} placeholder="+1 (555) 000-0000" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="linkedin">LinkedIn URL</Label>
                            <div className="relative">
                                <Input id="linkedin" {...form.register("linkedin_url")} placeholder="https://linkedin.com/in/jane-doe" className="pl-8" />
                                <div className="absolute left-2.5 top-2.5 text-slate-400">
                                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                </div>
                            </div>
                            {form.formState.errors.linkedin_url && (
                                <p className="text-xs text-red-500 font-medium">{form.formState.errors.linkedin_url.message}</p>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* PROFESSIONAL TAB */}
                <TabsContent value="professional" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="company">Current Company</Label>
                            <Input id="company" {...form.register("current_company")} placeholder="Acme Inc" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Current Title</Label>
                            <Input id="title" {...form.register("current_title")} placeholder="Senior Designer" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" {...form.register("location")} placeholder="New York, NY" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="experience">Years of Exp</Label>
                            <Input id="experience" type="number" {...form.register("years_of_experience")} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="skills">Skills (comma separated)</Label>
                        <Input id="skills" {...form.register("skills")} placeholder="React, TypeScript, Node.js" />
                    </div>
                </TabsContent>

                {/* ADDITIONAL TAB */}
                <TabsContent value="additional" className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="rating">Rating</Label>
                        <div className="border rounded-md p-3 bg-slate-50 dark:bg-slate-900/50 flex justify-center">
                            <Rating
                                value={(form.watch("rating") as number) || 0}
                                onChange={(val) => form.setValue("rating", val)}
                                size="lg"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Resume Upload</Label>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setResumeFile(e.target.files[0])
                                    }
                                }}
                            />
                            <div className="flex flex-col items-center gap-2">
                                {resumeFile ? (
                                    <>
                                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                            {resumeFile.name}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                            Drag and drop or click to upload
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            PDF, DOC, DOCX up to 5MB
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            {...form.register("notes")}
                            placeholder="Internal notes about the candidate..."
                            className="min-h-[120px]"
                        />
                    </div>
                </TabsContent>
            </TabsContainer>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Update Candidate" : "Add Candidate"}
                </Button>
            </div>
        </form>
    )
}
