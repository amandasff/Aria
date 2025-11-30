# Music Practice Platform 🎵

An AI-powered music practice tracking platform for teachers and students, built for the YC application.

## Features

### For Teachers
- Create teacher account and manage multiple students
- Send student invitations via email/link
- View all students' practice sessions
- Access AI-powered analysis of student practice
- Track student progress over time

### For Students
- Accept teacher invitation and create account
- Record practice sessions directly in the browser
- Upload recordings automatically with metadata
- Get instant AI feedback on practice sessions
- Track personal practice history and progress

### AI Analysis (powered by Claude)
- Identifies pieces and exercises practiced
- Provides time breakdown by activity
- Analyzes technique, tone, and rhythm
- Offers specific, actionable suggestions
- Gives overall performance score (1-10)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Anthropic Claude API (Sonnet 3.5)
- **Auth**: JWT with bcrypt password hashing
- **Audio**: Web Audio API / MediaRecorder
- **Deployment**: Vercel (frontend), Railway/Supabase (database)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or hosted)
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   cd music-practice-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your values:
   ```env
   # Database - Get from Railway, Supabase, or local PostgreSQL
   DATABASE_URL="postgresql://user:password@localhost:5432/music_practice"

   # JWT Secret - Generate a random string
   JWT_SECRET="your-super-secret-jwt-key-min-32-characters"

   # Claude API - Get from https://console.anthropic.com/
   ANTHROPIC_API_KEY="sk-ant-api03-..."

   # App URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # Audio Storage
   AUDIO_STORAGE_PATH="./uploads/audio"
   ```

4. **Set up the database**

   Run Prisma migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

   Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup Options

### Option 1: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a database: `createdb music_practice`
3. Update `DATABASE_URL` in `.env`

### Option 2: Railway (Recommended for deployment)

1. Go to [Railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the DATABASE_URL from Railway
4. Paste into your `.env`

### Option 3: Supabase

1. Go to [Supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database → Connection String
4. Copy the URI and paste into `.env`

## Getting Your Anthropic API Key

1. Visit [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Go to API Keys
4. Create a new API key
5. Copy and paste into `.env` as `ANTHROPIC_API_KEY`

**Note**: Claude API charges per token. Each analysis costs approximately $0.01-0.05 depending on audio length.

## Project Structure

```
music-practice-platform/
├── src/
│   ├── app/                      # Next.js app directory (routes)
│   │   ├── api/                  # API routes
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   ├── students/        # Student management
│   │   │   ├── practice/        # Practice session endpoints
│   │   │   └── analysis/        # AI analysis endpoints
│   │   ├── dashboard/           # Dashboard pages
│   │   │   ├── teacher/         # Teacher dashboard
│   │   │   └── student/         # Student dashboard
│   │   ├── login/               # Login page
│   │   ├── signup/              # Signup page
│   │   ├── invite/              # Student invitation acceptance
│   │   └── page.tsx             # Landing page
│   ├── components/              # Reusable React components
│   │   ├── AudioRecorder.tsx    # Audio recording component
│   │   └── AudioPlayer.tsx      # Audio playback component
│   ├── lib/                     # Utility libraries
│   │   ├── prisma.ts           # Prisma client
│   │   ├── auth.ts             # JWT & password utilities
│   │   └── claude.ts           # Claude API integration
│   └── types/                   # TypeScript type definitions
├── prisma/
│   └── schema.prisma            # Database schema
├── uploads/                     # Audio file storage
├── public/                      # Static assets
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Teacher registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Student Management
- `POST /api/students/invite` - Invite student
- `POST /api/students/accept-invite` - Accept invitation
- `GET /api/students` - Get all students (teacher)
- `DELETE /api/students?id={id}` - Remove student

### Practice Sessions
- `POST /api/practice/sessions` - Create session with audio
- `GET /api/practice/sessions` - Get all sessions
- `GET /api/practice/sessions/[id]` - Get specific session
- `GET /api/practice/sessions/[id]/audio` - Stream audio file
- `DELETE /api/practice/sessions/[id]` - Delete session

### AI Analysis
- `POST /api/analysis/[sessionId]` - Trigger analysis
- `GET /api/analysis/[sessionId]` - Get analysis results

## Usage Guide

### For Teachers

1. **Sign Up**
   - Visit the homepage and click "Get Started"
   - Enter your name, email, and password
   - You'll be redirected to your teacher dashboard

2. **Invite Students**
   - Click "Invite Student" on your dashboard
   - Enter student name and email
   - Copy the invitation link
   - Share the link with your student (via email, text, etc.)

3. **Review Student Practice**
   - View all student sessions in the dashboard
   - Click on a session to play the recording
   - Click "Analyze" to get AI feedback
   - View analysis results including scores and suggestions

### For Students

1. **Accept Invitation**
   - Click the invitation link from your teacher
   - Create a password to activate your account
   - You'll be redirected to your student dashboard

2. **Record Practice Session**
   - Click "Start New Practice Session"
   - Enter a title (e.g., "Bach Prelude Practice")
   - Click "Start Recording" (grant microphone permission)
   - Practice as normal
   - Click "Stop" when finished
   - Click "Save Session"

3. **Get AI Feedback**
   - Find your session in Practice History
   - Click "Get AI Feedback"
   - Wait for analysis (30-60 seconds)
   - Click "View Analysis" to see results

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `ANTHROPIC_API_KEY`
     - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
   - Click "Deploy"

3. **Run Database Migrations**

   After deployment, run migrations from your local machine:
   ```bash
   DATABASE_URL="your-production-db-url" npx prisma migrate deploy
   ```

### Alternative: Deploy to Railway

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add PostgreSQL: `railway add`
5. Set environment variables: `railway variables`
6. Deploy: `railway up`

## Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

**Solution**:
- Verify `DATABASE_URL` is correct
- Check database is running
- Ensure IP is whitelisted (for hosted databases)

### Microphone Permission Denied

**Error**: `Unable to access microphone`

**Solution**:
- Browsers require HTTPS for microphone access (except localhost)
- In production, ensure your site uses HTTPS
- Check browser permissions for microphone

### Claude API Errors

**Error**: `Failed to analyze session`

**Solution**:
- Verify `ANTHROPIC_API_KEY` is valid
- Check you have API credits
- Audio file might be too large (max ~50MB)

### Build Errors

**Error**: `Module not found: Can't resolve '@/...'`

**Solution**:
```bash
npm install
npx prisma generate
npm run build
```

## Development Tips

### Testing Locally

1. Create a teacher account
2. Invite a student (use a different email)
3. Open invite link in incognito/private window
4. Create student account
5. Record a short test session (10-30 seconds)
6. Trigger AI analysis
7. Review results

### Database Management

View database in browser:
```bash
npx prisma studio
```

Reset database:
```bash
npx prisma migrate reset
```

### Viewing Logs

Development logs appear in terminal where `npm run dev` is running.

Production logs (Vercel):
- Go to your project dashboard
- Click "Deployments"
- Click latest deployment
- View "Functions" tab for API logs

## Future Enhancements

### Phase 2 Features
- [ ] Email notifications for students
- [ ] Practice scheduling and reminders
- [ ] Advanced progress charts and analytics
- [ ] Export practice data (PDF/CSV)
- [ ] Mobile app (React Native)

### Phase 3 Features
- [ ] AWS S3 integration for audio storage
- [ ] Real-time practice tracking
- [ ] Video recording support
- [ ] Assignment system (teachers assign pieces)
- [ ] Stripe payment integration
- [ ] Multi-instrument support

## Tech Debt / TODOs

- [ ] Add rate limiting to API endpoints
- [ ] Implement audio compression before upload
- [ ] Add caching layer (Redis)
- [ ] Set up automated testing (Jest, Playwright)
- [ ] Add error monitoring (Sentry)
- [ ] Implement background job queue for AI analysis
- [ ] Add email service (SendGrid/Resend)

## Cost Breakdown (Monthly Estimates)

### MVP Phase (0-100 users)
- **Vercel**: Free tier → $0
- **Railway PostgreSQL**: $5
- **Claude API**: ~$10-20 (based on usage)
- **Total**: ~$15-25/month

### Growth Phase (100-1000 users)
- **Vercel Pro**: $20
- **Database**: $20-50
- **Claude API**: ~$100-200
- **Storage (S3)**: ~$10
- **Total**: ~$150-280/month

## YC Application Highlights

### Problem
Music teachers can't effectively monitor student practice between lessons. Students practice incorrectly without real-time feedback.

### Solution
AI-powered practice tracking that gives teachers full visibility and provides instant, actionable feedback to students.

### Market Size
- 10M+ music students in the US
- $1.5B private music lesson market
- Growing demand for remote/hybrid teaching tools

### Traction Plan
1. Beta with 10-20 music teachers
2. Iterate based on feedback
3. Launch in music teacher Facebook groups
4. Partner with music schools
5. Scale to 1,000+ teachers in first year

### Moat
- First mover in AI + music practice tracking
- Teacher/student workflow specifically designed for music
- High-quality AI analysis using Claude
- Network effects (teachers refer teachers)

## License

MIT License - See LICENSE file for details

## Contributing

This is a YC application project. Contributions welcome after initial submission.

## Support

For issues or questions:
- Create an issue on GitHub
- Email: [your-email@example.com]

## Acknowledgments

- Built with Next.js, React, and TypeScript
- AI analysis powered by Anthropic Claude
- Database by Prisma and PostgreSQL
- Deployed on Vercel

---

**Built for Y Combinator Application 2024**

Good luck with your YC application! 🚀
