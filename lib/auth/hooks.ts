import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from './context'

export { useAuth }

export function useRequireAuth(redirectUrl = '/login') {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push(redirectUrl)
        }
    }, [user, loading, router, redirectUrl])

    return { user, loading }
}
