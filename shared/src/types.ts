import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  created_at: z.number(),
  updated_at: z.number(),
});

export type User = z.infer<typeof UserSchema>;

// Project schemas
export const ProjectSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.number(),
  updated_at: z.number(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export type CreateProject = z.infer<typeof CreateProjectSchema>;

// Track schemas
export const TrackStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);

export type TrackStatus = z.infer<typeof TrackStatusSchema>;

export const TrackSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  user_id: z.string(),
  suno_id: z.string().nullable(),
  title: z.string(),
  prompt: z.string(),
  style: z.string().nullable(),
  lyrics: z.string().nullable(),
  audio_url: z.string().nullable(),
  image_url: z.string().nullable(),
  duration: z.number().nullable(),
  status: TrackStatusSchema,
  error_message: z.string().nullable(),
  created_at: z.number(),
  updated_at: z.number(),
});

export type Track = z.infer<typeof TrackSchema>;

export const CreateTrackSchema = z.object({
  project_id: z.string(),
  title: z.string().min(1).max(100),
  prompt: z.string().min(1).max(3000),
  style: z.string().max(100).optional(),
  lyrics: z.string().max(3000).optional(),
  custom_mode: z.boolean().default(false),
});

export type CreateTrack = z.infer<typeof CreateTrackSchema>;

// Favorite schemas
export const FavoriteSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  track_id: z.string(),
  created_at: z.number(),
});

export type Favorite = z.infer<typeof FavoriteSchema>;

// API Response types
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  status: z.number(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ApiSuccessSchema = z.object({
  success: z.boolean(),
  data: z.any(),
});

export type ApiSuccess = z.infer<typeof ApiSuccessSchema>;
