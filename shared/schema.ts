import { z } from "zod";

// Event schema for validation
export const insertEventSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다"),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다"), // YYYY-MM-DD format
  time: z.string().regex(/^\d{2}:\d{2}$/, "시간 형식이 올바르지 않습니다"), // HH:MM format
  duration: z.number().min(1, "지속시간은 1분 이상이어야 합니다").default(30), // minutes
  category: z.string().min(1, "카테고리는 필수입니다").default("업무 미팅"),
  location: z.string().optional(),
  isCompleted: z.boolean().default(false),
});

export const updateEventSchema = insertEventSchema.partial();

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;

// Event interface (matches MongoDB document structure)
export interface Event {
  _id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  duration: number; // minutes
  category: string;
  location?: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Activity schema
export const activitySchema = z.object({
  applicationId: z.string().optional(),
  name: z.string(),
  timestamps: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
  }).optional(),
  createdTimestamp: z.date().optional(),
  type: z.number().min(0).max(5),
  emoji: z.object({
    animated: z.boolean().optional(),
    name: z.string(),
    id: z.string().optional(),
  }).optional(),
  state: z.string().optional(),
  details: z.string().optional(),
});

// Presence schema
export const presenceSchema = z.object({
  status: z.number().min(0).max(63), // 6-bit status: web(2bit) desktop(2bit) mobile(2bit)
  activities: z.array(activitySchema).optional(),
  timestamp: z.date(),
  userId: z.string(),
});

export const insertPresenceSchema = presenceSchema;
export const updatePresenceSchema = presenceSchema.partial().omit({ userId: true });

export type Activity = z.infer<typeof activitySchema>;
export type InsertPresence = z.infer<typeof insertPresenceSchema>;
export type UpdatePresence = z.infer<typeof updatePresenceSchema>;

// Timeline entry interface (combines events and presence changes)
export interface TimelineEntry {
  id: string;
  type: 'event' | 'status_change' | 'activity_change';
  timestamp: Date;
  userId?: string;
  // For events
  title?: string;
  description?: string;
  duration?: number;
  category?: string;
  location?: string;
  isCompleted?: number;
  // For presence changes
  oldStatus?: number;
  newStatus?: number;
  statusChange?: {
    web: { old: string; new: string } | null;
    desktop: { old: string; new: string } | null;
    mobile: { old: string; new: string } | null;
  };
  // For activity changes
  activityChange?: {
    type: 'added' | 'removed';
    activity: Activity;
  };
}

// For backward compatibility with frontend
export interface EventResponse {
  id: string; // mapped from _id
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: number;
  category: string;
  location?: string;
  isCompleted: number; // 0 or 1 for compatibility
  createdAt: Date;
}

// Presence response interface
export interface PresenceResponse {
  id: string;
  status: number;
  activities?: Activity[];
  timestamp: Date;
  userId: string;
}
