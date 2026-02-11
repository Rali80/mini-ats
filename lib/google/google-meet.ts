// Google Meet Integration for Mini ATS
// Note: Full Google Calendar API integration requires OAuth2 setup

/**
 * Generate a Google Meet link
 * Note: Creating actual Google Meet meetings requires Google Calendar API
 * This function creates placeholder/integration code
 */

export interface MeetConfig {
    clientId: string
    apiKey: string
    calendarId: string
}

export interface MeetEvent {
    id?: string
    summary: string
    description: string
    startTime: Date
    endTime: Date
    attendees: string[]
    meetingLink?: string
}

/**
 * Create a Google Calendar event with Google Meet
 * Requires Google OAuth2 setup
 */
export async function createGoogleMeetEvent(
    event: MeetEvent,
    accessToken: string
): Promise<{ success: boolean; meetingLink?: string; error?: string }> {
    try {
        // This would use the Google Calendar API
        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    summary: event.summary,
                    description: event.description,
                    start: {
                        dateTime: event.startTime.toISOString(),
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    },
                    end: {
                        dateTime: event.endTime.toISOString(),
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    },
                    attendees: event.attendees.map(email => ({ email })),
                    conferenceData: {
                        createRequest: {
                            requestId: crypto.randomUUID(),
                            conferenceSolutionKey: { type: 'hangoutsMeet' },
                        },
                    },
                }),
            }
        )

        const data = await response.json()

        if (data.conferenceData?.entryPoints) {
            const meetLink = data.conferenceData.entryPoints.find(
                (ep: any) => ep.entryPointType === 'video'
            )?.uri

            return { success: true, meetingLink: meetLink }
        }

        return { success: false, error: 'Failed to create Google Meet link' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Generate a simple meeting link for video type
 * In production, this would integrate with actual video conferencing APIs
 */
export function generateMeetingLink(type: 'meet' | 'zoom' | 'teams', meetingId?: string): string {
    const id = meetingId || crypto.randomUUID().slice(0, 10)

    switch (type) {
        case 'meet':
            return `https://meet.google.com/${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6, 10)}`
        case 'zoom':
            return `https://zoom.us/j/${id}`
        case 'teams':
            return `https://teams.microsoft.com/l/meetup-join/${id}`
        default:
            return ''
    }
}

/**
 * Validate Google Meet URL format
 */
export function isValidMeetUrl(url: string): boolean {
    const meetPattern = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{3}-[a-z]{3}$/
    return meetPattern.test(url)
}

/**
 * OAuth2 configuration for Google Calendar API
 */
export const googleOAuthConfig = {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ],
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
}
