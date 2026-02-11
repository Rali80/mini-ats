"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingProps {
    value: number
    max?: number
    readOnly?: boolean
    onChange?: (value: number) => void
    size?: "sm" | "md" | "lg"
    className?: string
}

export function Rating({ value, max = 5, readOnly = false, onChange, size = "md", className }: RatingProps) {
    const [hoverValue, setHoverValue] = React.useState<number | null>(null)

    const sizeClasses = {
        sm: "h-3 w-3",
        md: "h-5 w-5",
        lg: "h-8 w-8"
    }

    return (
        <div className={cn("flex items-center space-x-1", className)}>
            {Array.from({ length: max }).map((_, i) => {
                const index = i + 1
                const filled = (hoverValue !== null ? hoverValue : value) >= index

                return (
                    <button
                        key={index}
                        type="button"
                        className={cn(
                            "focus:outline-none transition-transform hover:scale-110",
                            readOnly && "cursor-default hover:scale-100"
                        )}
                        onClick={() => !readOnly && onChange?.(index)}
                        onMouseEnter={() => !readOnly && setHoverValue(index)}
                        onMouseLeave={() => !readOnly && setHoverValue(null)}
                        disabled={readOnly}
                    >
                        <Star
                            className={cn(
                                sizeClasses[size],
                                filled ? "fill-yellow-400 text-yellow-400" : "text-slate-300 dark:text-slate-600",
                                "transition-colors"
                            )}
                        />
                    </button>
                )
            })}
        </div>
    )
}
