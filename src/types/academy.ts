export interface AcademyPost {
    id: string
    created_at: string
    title: string
    description: string | null
    video_url: string | null
    attachment_url: string | null
    mission_text: string | null
    copyable_text: string | null
    level_badge: string | null
    order_index: number
    is_active: boolean
}

export interface AcademyProgress {
    id: string
    user_id: string
    post_id: string
    completed_at: string
}

export type AcademyPostWithProgress = AcademyPost & {
    is_completed: boolean
}
