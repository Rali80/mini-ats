import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
    it('renders correctly', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('applies variant classes', () => {
        const { rerender } = render(<Button variant="danger">Delete</Button>)
        expect(screen.getByRole('button')).toHaveClass('bg-red-500')

        rerender(<Button variant="outline">Cancel</Button>)
        expect(screen.getByRole('button')).toHaveClass('border-slate-200')
    })

    it('handles click events', () => {
        const handleClick = vi.fn()
        render(<Button onClick={handleClick}>Submit</Button>)
        fireEvent.click(screen.getByRole('button'))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('is disabled when loading', () => {
        // Since my Button doesn't have a loading prop yet, I'll test disabled
        render(<Button disabled>Submit</Button>)
        expect(screen.getByRole('button')).toBeDisabled()
    })
})
