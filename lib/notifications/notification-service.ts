'use client'

import { createClient } from '@/lib/supabase/client'
import { Notification, NotificationType } from '@/types/enhanced'

export class NotificationService {
    private supabase = createClient()

    async createNotification(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        data?: Record<string, any>
    ): Promise<Notification | null> {
        const { data: notification, error } = await this.supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                data: data ? JSON.stringify(data) : null,
                read: false,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating notification:', error)
            return null
        }

        return notification
    }

    async getNotifications(userId: string, limit = 20): Promise<Notification[]> {
        const { data, error } = await this.supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching notifications:', error)
            return []
        }

        return data || []
    }

    async getUnreadCount(userId: string): Promise<number> {
        const { count, error } = await this.supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false)

        if (error) {
            console.error('Error counting notifications:', error)
            return 0
        }

        return count || 0
    }

    async markAsRead(notificationId: string): Promise<void> {
        const { error } = await this.supabase
            .from('notifications')
            .update({
                read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', notificationId)

        if (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    async markAllAsRead(userId: string): Promise<void> {
        const { error } = await this.supabase
            .from('notifications')
            .update({
                read: true,
                read_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('read', false)

        if (error) {
            console.error('Error marking all notifications as read:', error)
        }
    }

    async deleteNotification(notificationId: string): Promise<void> {
        const { error } = await this.supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)

        if (error) {
            console.error('Error deleting notification:', error)
        }
    }

    // Subscribe to real-time notifications
    subscribeToNotifications(
        userId: string,
        callback: (notification: Notification) => void
    ) {
        return this.supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    callback(payload.new as Notification)
                }
            )
            .subscribe()
    }

    // Create notification for candidate stage change
    async notifyStageChange(
        userId: string,
        candidateName: string,
        fromStage: string,
        toStage: string,
        candidateId: string
    ) {
        return this.createNotification(
            userId,
            'stage_changed',
            'Stage Updated',
            `${candidateName} moved from ${fromStage} to ${toStage}`,
            { candidate_id: candidateId, from_stage: fromStage, to_stage: toStage }
        )
    }

    // Create notification for new application
    async notifyNewApplication(
        userId: string,
        candidateName: string,
        jobTitle: string,
        candidateId: string,
        jobId: string
    ) {
        return this.createNotification(
            userId,
            'candidate_applied',
            'New Application',
            `${candidateName} applied for ${jobTitle}`,
            { candidate_id: candidateId, job_id: jobId }
        )
    }

    // Create notification for interview scheduled
    async notifyInterviewScheduled(
        userId: string,
        candidateName: string,
        interviewTime: string,
        candidateId: string,
        interviewId: string
    ) {
        return this.createNotification(
            userId,
            'interview_scheduled',
            'Interview Scheduled',
            `Interview with ${candidateName} scheduled for ${interviewTime}`,
            { candidate_id: candidateId, interview_id: interviewId }
        )
    }
}

export const notificationService = new NotificationService()
