# Music Practice Platform - System Architecture

## Overview
A comprehensive music practice tracking platform that enables teachers to monitor student progress through AI-powered analysis of practice recordings.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Audio Recording**: Web Audio API / MediaRecorder API

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Language**: TypeScript

### Database
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Migration Tool**: Prisma Migrate

### AI & Analysis
- **Provider**: Anthropic Claude API
- **Model**: Claude Sonnet 3.5+
- **Capabilities**: Audio transcription, music analysis, feedback generation

### Authentication
- **Method**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Session Management**: HTTP-only cookies

### File Storage
- **Audio Files**: Local file system (uploads/ directory)
- **Production Ready**: Easily upgradeable to AWS S3/CloudFlare R2

## Database Schema

### User Model
```
User {
  id: UUID (primary key)
  email: String (unique)
  password: String (hashed with bcrypt)
  name: String
  role: Enum (TEACHER | STUDENT)
  teacherId: UUID (foreign key, nullable)
  teacher: User (relation)
  students: User[] (relation)
  inviteToken: String (unique, nullable)
  inviteExpiresAt: DateTime (nullable)
  practiceSessions: PracticeSession[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

### PracticeSession Model
```
PracticeSession {
  id: UUID (primary key)
  studentId: UUID (foreign key)
  student: User (relation)
  title: String
  description: String (nullable)
  duration: Int (seconds)
  audioFilePath: String
  audioFileSize: Int (bytes)
  status: Enum (RECORDING | COMPLETED | ANALYZED)
  analysis: PracticeAnalysis (relation)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### PracticeAnalysis Model
```
PracticeAnalysis {
  id: UUID (primary key)
  sessionId: UUID (foreign key, unique)
  session: PracticeSession (relation)
  overallFeedback: String
  piecesIdentified: JSON
  timeBreakdown: JSON
  suggestions: JSON
  strengths: JSON
  areasForImprovement: JSON
  overallScore: Int (1-10)
  createdAt: DateTime
  updatedAt: DateTime
}
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Teacher registration
- `POST /api/auth/login` - User login (teachers and students)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Student Management
- `POST /api/students/invite` - Teacher invites student
- `POST /api/students/accept-invite` - Student accepts invitation
- `GET /api/students` - Teacher gets all their students
- `DELETE /api/students/:id` - Teacher removes student

### Practice Sessions
- `POST /api/practice/sessions` - Create new practice session
- `POST /api/practice/sessions/:id/upload` - Upload audio file
- `GET /api/practice/sessions` - Get sessions (filtered by user role)
- `GET /api/practice/sessions/:id` - Get specific session
- `DELETE /api/practice/sessions/:id` - Delete session
- `GET /api/practice/sessions/:id/audio` - Stream audio file

### AI Analysis
- `POST /api/analysis/:sessionId` - Trigger AI analysis
- `GET /api/analysis/:sessionId` - Get analysis results

## Frontend Routes

### Public Routes
- `/` - Landing page
- `/login` - Login page
- `/signup` - Teacher signup page
- `/invite/:token` - Student invitation acceptance

### Teacher Routes (Protected)
- `/dashboard/teacher` - Teacher dashboard
- `/dashboard/teacher/students` - Student management
- `/dashboard/teacher/students/:id` - Individual student view
- `/dashboard/teacher/invite` - Invite new student

### Student Routes (Protected)
- `/dashboard/student` - Student dashboard
- `/dashboard/student/practice` - Practice recording interface
- `/dashboard/student/sessions` - View past sessions
- `/dashboard/student/sessions/:id` - Session details and playback

## Component Architecture

### Shared Components
- `AudioPlayer` - Audio playback with waveform visualization
- `AudioRecorder` - Recording interface with real-time visualization
- `SessionCard` - Practice session display card
- `AnalysisDisplay` - AI analysis results display
- `Navigation` - App navigation bar
- `ProtectedRoute` - Auth guard wrapper

### Teacher Components
- `TeacherDashboard` - Main dashboard view
- `StudentList` - List of students
- `StudentCard` - Individual student card
- `InviteStudentForm` - Student invitation form
- `StudentSessionsList` - Student's practice sessions

### Student Components
- `StudentDashboard` - Main dashboard view
- `PracticeRecorder` - Main recording interface
- `SessionHistory` - Past practice sessions
- `SessionDetail` - Individual session view
- `AIFeedback` - Display AI analysis

## Authentication Flow

### Teacher Registration
1. Teacher signs up with email/password
2. Account created with role=TEACHER
3. JWT token issued
4. Redirected to dashboard

### Student Invitation
1. Teacher enters student email
2. System generates unique invite token
3. Invitation email sent (or link copied)
4. Student clicks link with token
5. Student creates account with token
6. Account linked to teacher

### Login Flow
1. User submits credentials
2. Password verified with bcrypt
3. JWT token issued (httpOnly cookie)
4. Redirected to role-specific dashboard

## Audio Recording Flow

### Recording
1. Student clicks "Start Practice"
2. Browser requests microphone permission
3. MediaRecorder API captures audio
4. Real-time duration tracking
5. Student clicks "Stop" when finished

### Upload
1. Audio converted to WAV/MP3
2. File uploaded to server
3. Saved to file system
4. Database record created
5. Redirected to session view

## AI Analysis Flow

### Trigger Analysis
1. Teacher or student requests analysis
2. Audio file read from storage
3. File sent to Claude API
4. Claude analyzes:
   - Identifies pieces/exercises
   - Detects timing/rhythm issues
   - Provides technique feedback
   - Suggests improvements
5. Results saved to database
6. UI updated with analysis

### Claude Prompt Strategy
```
You are analyzing a music practice session recording. Please provide:

1. PIECES IDENTIFIED: List all musical pieces, exercises, or scales practiced
2. TIME BREAKDOWN: Estimate time spent on each piece/activity
3. TECHNICAL FEEDBACK: Comment on tone, rhythm, pitch accuracy, technique
4. STRENGTHS: What the student did well
5. AREAS FOR IMPROVEMENT: Specific issues to work on
6. SUGGESTIONS: Actionable practice recommendations
7. OVERALL SCORE: Rate the practice session 1-10

Format your response as structured JSON.
```

## File Storage Structure

```
uploads/
  audio/
    {userId}/
      {sessionId}/
        recording.mp3
```

## Security Considerations

1. **Password Security**: bcrypt with 12 rounds
2. **JWT Security**: HTTP-only cookies, secure in production
3. **File Access**: Authenticated endpoints only
4. **SQL Injection**: Prisma ORM prevents
5. **XSS Protection**: React auto-escaping
6. **CSRF Protection**: SameSite cookies
7. **File Upload Limits**: 50MB max
8. **Rate Limiting**: Implement for API routes

## Deployment Strategy

### Development
```bash
npm install
npx prisma migrate dev
npm run dev
```

### Production (Vercel)
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy
5. Configure PostgreSQL (Railway/Supabase)

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Token signing key
- `ANTHROPIC_API_KEY` - Claude API key
- `NEXT_PUBLIC_APP_URL` - App URL
- `AUDIO_STORAGE_PATH` - File storage path

## Scalability Considerations

### Current MVP
- Local file storage
- Single server
- PostgreSQL database

### Future Scaling
- Move audio to S3/R2
- Add CDN for audio delivery
- Implement Redis caching
- Add background job queue
- Horizontal scaling with load balancer

## Cost Estimates (Monthly)

### MVP Phase
- Vercel: Free tier (then $20/month)
- Railway PostgreSQL: $5/month
- Claude API: ~$0.01-0.05 per analysis
- Total: ~$25-50/month for 100 users

### Growth Phase
- Vercel Pro: $20/month
- Database: $20-50/month
- S3 Storage: ~$0.023/GB
- Claude API: Volume discounts
- Total: Scales with usage

## Development Roadmap

### Phase 1 (MVP - 2 weeks)
- [x] Architecture design
- [x] Database schema
- [ ] Authentication system
- [ ] Teacher/student dashboards
- [ ] Audio recording
- [ ] File storage
- [ ] Basic Claude integration

### Phase 2 (Beta - 4 weeks)
- [ ] Advanced AI analysis
- [ ] Email notifications
- [ ] Practice scheduling
- [ ] Progress tracking
- [ ] Mobile responsive design
- [ ] User testing

### Phase 3 (Launch - 8 weeks)
- [ ] S3 integration
- [ ] Advanced analytics
- [ ] Export functionality
- [ ] Payment integration
- [ ] Marketing site
- [ ] Beta launch

## YC Application Highlights

### Problem
Music teachers struggle to monitor student practice effectively between lessons. Students often practice incorrectly without feedback.

### Solution
AI-powered practice tracking that gives teachers visibility into student practice and provides instant AI feedback to students.

### Market
- 10M+ music students in US
- $1.5B private music lesson market
- Growing demand for remote teaching tools

### Traction Plan
1. Beta with 10-20 music teachers
2. Gather feedback and iterate
3. Launch in music teacher communities
4. Partner with music schools
5. Scale to 1000+ teachers

### Competitive Advantage
- First to combine practice tracking + AI analysis
- Teacher-student workflow focus
- Modern, intuitive UX
- Affordable pricing

### Business Model
- Freemium: Free for 1-5 students
- Pro: $15/month for unlimited students
- School: $50/month for up to 50 students
