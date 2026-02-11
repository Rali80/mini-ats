import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'

describe('Card', () => {
    it('renders all sub-components correctly', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Test Title</CardTitle>
                </CardHeader>
                <CardContent>
                    Test Content
                </CardContent>
                <CardFooter>
                    Test Footer
                </CardFooter>
            </Card>
        )

        expect(screen.getByText('Test Title')).toBeInTheDocument()
        expect(screen.getByText('Test Content')).toBeInTheDocument()
        expect(screen.getByText('Test Footer')).toBeInTheDocument()
    })

    it('applies custom className', () => {
        render(<Card className="custom-card">Content</Card>)
        expect(screen.getByText('Content').closest('.custom-card')).toBeInTheDocument()
    })
})
