import { User, PracticeSession, PracticeAnalysis } from '@prisma/client'

// Define role and status types manually since Prisma uses String instead of enums
export type UserRole = 'TEACHER' | 'STUDENT'
export type SessionStatus = 'RECORDING' | 'COMPLETED' | 'ANALYZED'

// Extended types with relations
export type UserWithStudents = User & {
  students: User[]
}

export type UserWithTeacher = User & {
  teacher: User | null
}

export type SessionWithAnalysis = PracticeSession & {
  analysis: PracticeAnalysis | null
  student: User
}

export type SessionWithStudent = PracticeSession & {
  student: User
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: UserRole
  }
  token: string
}

// Student invitation types
export interface InviteStudentRequest {
  email: string
  name: string
}

export interface AcceptInviteRequest {
  token: string
  password: string
}

// Practice session types
export interface CreateSessionRequest {
  title: string
  description?: string
  duration: number
}

export interface UploadAudioRequest {
  sessionId: string
  audioFile: File
}

// Dashboard stats types
export interface TeacherStats {
  totalStudents: number
  totalSessions: number
  totalPracticeTime: number
  recentSessions: SessionWithStudent[]
}

export interface StudentStats {
  totalSessions: number
  totalPracticeTime: number
  averageScore: number
  recentSessions: SessionWithAnalysis[]
  practiceSuggestions?: string
}

// UserRole and SessionStatus are defined above as string literal types
