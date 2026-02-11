// Security utilities for the Mini ATS application

/**
 * Validate file upload configuration
 */
export interface FileValidationResult {
    valid: boolean
    error?: string
}

export interface FileValidationConfig {
    maxSizeMB: number
    allowedTypes: string[]
    bucketName: string
}

// Default configuration - can be overridden per upload
const defaultConfig: FileValidationConfig = {
    maxSizeMB: 5,
    allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp',
    ],
    bucketName: 'resumes',
}

// Validate file before upload
export function validateFile(
    file: File,
    config: Partial<FileValidationConfig> = {}
): FileValidationResult {
    const mergedConfig = { ...defaultConfig, ...config }

    // Check file size
    const maxSizeBytes = mergedConfig.maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
        return {
            valid: false,
            error: `File size exceeds maximum allowed size of ${mergedConfig.maxSizeMB}MB`
        }
    }

    // Check file type
    if (!mergedConfig.allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type "${file.type}" is not allowed. Allowed types: ${mergedConfig.allowedTypes.join(', ')}`
        }
    }

    return { valid: true }
}

// Validate file extension
export function validateFileExtension(
    fileName: string,
    allowedExtensions: string[] = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp']
): FileValidationResult {
    const extension = fileName.split('.').pop()?.toLowerCase()

    if (!extension || !allowedExtensions.includes(extension)) {
        return {
            valid: false,
            error: `File extension ".${extension}" is not allowed. Allowed: ${allowedExtensions.join(', ')}`
        }
    }

    return { valid: true }
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize HTML content (for notes, descriptions)
 */
export function sanitizeHtml(html: string): string {
    // Basic HTML sanitization - remove script tags and event handlers
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
    windowMs: number
    maxRequests: number
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const record = rateLimitStore.get(identifier)

    if (!record || now > record.resetTime) {
        // New window
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + config.windowMs
        })
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime: now + config.windowMs
        }
    }

    if (record.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: record.resetTime
        }
    }

    // Increment counter
    record.count++
    rateLimitStore.set(identifier, record)

    return {
        allowed: true,
        remaining: config.maxRequests - record.count,
        resetTime: record.resetTime
    }
}

/**
 * CSRF protection utilities
 */
export function generateCsrfToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function validateCsrfToken(token: string, storedToken: string): boolean {
    if (!token || !storedToken || token.length !== storedToken.length) return false
    // Simple comparison for non-Node environments
    return token === storedToken
}

/**
 * Password strength validation
 */
export interface PasswordStrengthResult {
    score: number // 0-4
    feedback: string[]
    isValid: boolean
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) score++
    else feedback.push('Password should be at least 8 characters')

    if (password.length >= 12) score++

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    else feedback.push('Password should contain both uppercase and lowercase letters')

    if (/\d/.test(password)) score++
    else feedback.push('Password should contain at least one number')

    if (/[^a-zA-Z0-9]/.test(password)) score++
    else feedback.push('Password should contain at least one special character')

    return {
        score,
        feedback,
        isValid: score >= 3
    }
}

/**
 * Role-based access control (RBAC)
 */
export type Permission =
    | 'candidates:read'
    | 'candidates:write'
    | 'candidates:delete'
    | 'jobs:read'
    | 'jobs:write'
    | 'jobs:delete'
    | 'interviews:read'
    | 'interviews:write'
    | 'interviews:delete'
    | 'admin:read'
    | 'admin:write'
    | 'users:manage'

export type Role = 'admin' | 'customer'

const rolePermissions: Record<Role, Permission[]> = {
    admin: [
        'candidates:read', 'candidates:write', 'candidates:delete',
        'jobs:read', 'jobs:write', 'jobs:delete',
        'interviews:read', 'interviews:write', 'interviews:delete',
        'admin:read', 'admin:write', 'users:manage'
    ],
    customer: [
        'candidates:read', 'candidates:write',
        'jobs:read', 'jobs:write',
        'interviews:read', 'interviews:write'
    ]
}

export function hasPermission(role: Role, permission: Permission): boolean {
    return rolePermissions[role]?.includes(permission) || false
}

export function getRolePermissions(role: Role): Permission[] {
    return rolePermissions[role] || []
}

/**
 * Data access control - ensure users can only access their own data
 */
export interface DataAccessControl {
    canAccess: boolean
    reason?: string
}

export function checkDataOwnership(
    userId: string,
    resourceOwnerId: string,
    isAdmin: boolean = false
): DataAccessControl {
    if (isAdmin) {
        return { canAccess: true }
    }

    if (userId === resourceOwnerId) {
        return { canAccess: true }
    }

    return {
        canAccess: false,
        reason: 'You do not have permission to access this resource'
    }
}

/**
 * Supabase RLS policy helper - generates policy conditions
 */
export function generateRlsConditions(
    userId: string,
    isAdmin: boolean
): string {
    if (isAdmin) {
        return 'true' // Admins can access all records
    }
    return `customer_id = '${userId}'`
}

/**
 * Audit logging helper
 */
export interface AuditLogEntry {
    userId: string
    action: string
    resource: string
    resourceId?: string
    details?: Record<string, any>
    ipAddress?: string
    userAgent?: string
}

export function createAuditLog(
    supabase: any,
    entry: AuditLogEntry
): Promise<void> {
    return supabase
        .from('audit_logs')
        .insert({
            user_id: entry.userId,
            action: entry.action,
            resource: entry.resource,
            resource_id: entry.resourceId,
            details: entry.details ? JSON.stringify(entry.details) : null,
            ip_address: entry.ipAddress,
            user_agent: entry.userAgent,
        })
        .then()
}
