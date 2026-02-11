import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
    it('renders correctly', () => {
        render(<Input placeholder="Enter email" />)
        expect(screen.getByPlaceholderText(/enter email/i)).toBeInTheDocument()
    })

    it('handles value changes', () => {
        render(<Input placeholder="test" />)
        const input = screen.getByPlaceholderText('test') as HTMLInputElement
        fireEvent.change(input, { target: { value: 'hello' } })
        expect(input.value).toBe('hello')
    })

    it('can be disabled', () => {
        render(<Input disabled placeholder="disabled" />)
        expect(screen.getByPlaceholderText('disabled')).toBeDisabled()
    })
})
