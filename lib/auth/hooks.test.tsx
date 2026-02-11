import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '@/lib/auth/hooks'
import { createClient } from '@/lib/supabase/client'
import { AuthProvider } from '@/lib/auth/context'

// Deep mock of supabase client
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(),
}))

describe('useAuth', () => {
    let authCallback: any

    const mockUnsubscribe = vi.fn()
    const mockOnAuthStateChange = vi.fn((callback) => {
        authCallback = callback
        return {
            data: { subscription: { unsubscribe: mockUnsubscribe } }
        }
    })

    const mockSupabase = {
        auth: {
            onAuthStateChange: mockOnAuthStateChange,
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: { id: '1', email: 'test@example.com', role: 'customer' } }))
                }))
            }))
        }))
    }

    beforeEach(() => {
        vi.clearAllMocks()
        authCallback = undefined
        // @ts-ignore
        vi.mocked(createClient).mockReturnValue(mockSupabase)
    })

    it('initializes with loading state', () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider
        })
        expect(result.current.loading).toBe(true)
        expect(result.current.user).toBe(null)
    })

    it('updates user and profile on auth change', async () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider
        })

        // Wait for the hook to initialize and capture the callback
        await waitFor(() => {
            expect(mockOnAuthStateChange).toHaveBeenCalled()
        })

        // Get the captured callback
        const callback = mockOnAuthStateChange.mock.calls[0][0]

        // Trigger auth change using the captured callback
        await callback('SIGNED_IN', {
            user: { id: '1', email: 'test@example.com' }
        })

        await waitFor(() => {
            expect(result.current.loading).toBe(false)
            expect(result.current.user).toBeDefined()
            expect(result.current.profile?.role).toBe('customer')
        })
    })
})
