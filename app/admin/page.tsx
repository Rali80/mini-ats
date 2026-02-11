'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Loader2, Plus, Users, Shield, Settings, BarChart3, Trash2, Edit, Mail, Calendar, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth/hooks'
import { Profile, Role } from '@/types'
import { validatePasswordStrength } from '@/lib/security/security'

interface ExtendedProfile extends Profile {
    last_login?: string
    job_count?: number
    candidate_count?: number
}

interface SystemStats {
    totalUsers: number
    totalJobs: number
    totalCandidates: number
    totalInterviews: number
    activeToday: number
}

export default function AdminPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const [customers, setCustomers] = useState<ExtendedProfile[]>([])
    const [stats, setStats] = useState<SystemStats>({
        totalUsers: 0,
        totalJobs: 0,
        totalCandidates: 0,
        totalInterviews: 0,
        activeToday: 0
    })
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<ExtendedProfile | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Form state
    const [newEmail, setNewEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [newRole, setNewRole] = useState<Role>('customer')
    const [newFullName, setNewFullName] = useState('')
    const [creating, setCreating] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        if (user && profile?.role === 'admin') {
            fetchData()
        }
    }, [user, profile])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch all profiles
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('role', { ascending: true })
                .order('created_at', { ascending: false })

            if (profilesError) throw profilesError

            // Fetch stats
            const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
            const { count: jobsCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true })
            const { count: candidatesCount } = await supabase.from('candidates').select('*', { count: 'exact', head: true })
            const { count: interviewsCount } = await supabase.from('interviews').select('*', { count: 'exact', head: true })

            if (profilesData) {
                // Get job and candidate counts per user
                const extendedProfiles: ExtendedProfile[] = await Promise.all(
                    profilesData.map(async (profile) => {
                        const { count: jobCount } = await supabase
                            .from('jobs')
                            .select('*', { count: 'exact', head: true })
                            .eq('customer_id', profile.id)

                        const { count: candidateCount } = await supabase
                            .from('candidates')
                            .select('*', { count: 'exact', head: true })
                            .eq('customer_id', profile.id)

                        return {
                            ...profile,
                            job_count: jobCount || 0,
                            candidate_count: candidateCount || 0
                        }
                    })
                )
                setCustomers(extendedProfiles)
            }

            setStats({
                totalUsers: usersCount || 0,
                totalJobs: jobsCount || 0,
                totalCandidates: candidatesCount || 0,
                totalInterviews: interviewsCount || 0,
                activeToday: 0 // Would need a more complex query for this
            })
        } catch (error) {
            console.error('Error fetching admin data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        setMessage(null)

        // Validate password strength
        const passwordValidation = validatePasswordStrength(newPassword)
        if (!passwordValidation.isValid) {
            setMessage({
                type: 'error',
                text: `Password is too weak. ${passwordValidation.feedback.join(' ')}`
            })
            setCreating(false)
            return
        }

        try {
            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newEmail,
                    password: newPassword,
                    role: newRole,
                    full_name: newFullName,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create user')
            }

            setMessage({ type: 'success', text: `User created successfully!` })
            setNewEmail('')
            setNewPassword('')
            setNewFullName('')
            setNewRole('customer')
            setIsModalOpen(false)
            fetchData()
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return
        }

        try {
            // First delete the auth user using service role (via API)
            const response = await fetch('/api/admin/delete-user', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            })

            if (!response.ok) {
                throw new Error('Failed to delete user')
            }

            setMessage({ type: 'success', text: 'User deleted successfully' })
            fetchData()
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        }
    }

    const handleUpdateUserRole = async (userId: string, newRole: Role) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId)

            if (error) throw error

            setMessage({ type: 'success', text: 'User role updated' })
            fetchData()
            setIsEditModalOpen(false)
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        }
    }

    if (authLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
    }

    if (!profile || profile.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage users, roles, and monitor platform activity.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalJobs}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Candidates</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCandidates}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalInterviews}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeToday}</div>
                    </CardContent>
                </Card>
            </div>

            {/* User List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        All Users
                    </CardTitle>
                    <CardDescription>Manage user accounts and permissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-muted-foreground" />
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No users found. Create the first user to get started.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Jobs</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Candidates</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((person) => (
                                        <tr key={person.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${person.role === 'admin'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {person.email.substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{person.full_name || 'No name'}</div>
                                                        <div className="text-sm text-muted-foreground">{person.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${person.role === 'admin'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {person.role}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">{person.job_count || 0}</td>
                                            <td className="py-3 px-4">{person.candidate_count || 0}</td>
                                            <td className="py-3 px-4">
                                                {new Date(person.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUser(person)
                                                            setIsEditModalOpen(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    {person.id !== user?.id && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteUser(person.id)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create User Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New User"
                description="Create a new user account with role and permissions."
            >
                <form onSubmit={handleCreateUser} className="space-y-4">
                    {message && message.type === 'error' && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                            {message.text}
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input
                            placeholder="John Doe"
                            value={newFullName}
                            onChange={(e) => setNewFullName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            required
                            placeholder="user@example.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <Select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as Role)}
                        >
                            <option value="customer">Customer</option>
                            <option value="admin">Admin</option>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <Input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Must be at least 8 characters with uppercase, lowercase, number, and special character.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={creating}>
                            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit User Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit User"
                description="Update user role and permissions."
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                                {selectedUser.email.substring(0, 1).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium">{selectedUser.full_name || selectedUser.email}</div>
                                <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <Select
                                value={selectedUser.role}
                                onChange={(e) => handleUpdateUserRole(selectedUser.id, e.target.value as Role)}
                            >
                                <option value="customer">Customer</option>
                                <option value="admin">Admin</option>
                            </Select>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
