# Quick Start Guide

Get your Music Practice Platform running in 5 minutes!

## 🚀 Super Quick Setup

### 1. Install Dependencies (1 minute)

```bash
npm install
```

### 2. Set Up Environment Variables (2 minutes)

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` and add:

```env
# Use this for local development (or get from Railway/Supabase)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/music_practice"

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="your-32-character-or-longer-secret-key"

# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"

# For local development
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set Up Database (1 minute)

**Option A: Use Railway (Recommended - Free)**

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. New Project → Add PostgreSQL
4. Copy the `DATABASE_URL` to your `.env`

**Option B: Local PostgreSQL**

```bash
# Install PostgreSQL first, then:
createdb music_practice
```

### 4. Run Migrations (30 seconds)

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start the App (10 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## ✅ Quick Test

1. **Create Teacher Account**
   - Click "Get Started"
   - Fill in name, email, password
   - You're in!

2. **Invite a Student**
   - Click "Invite Student"
   - Enter name and email
   - Copy the invite link

3. **Create Student Account**
   - Open invite link in new incognito window
   - Set password
   - You're a student now!

4. **Record Practice**
   - Click "Start New Practice Session"
   - Title: "Test Recording"
   - Click "Start Recording"
   - Say/play something for 10 seconds
   - Click "Stop" → "Save Session"

5. **Get AI Feedback**
   - Click "Get AI Feedback"
   - Wait 30 seconds
   - View your analysis!

## 🔑 Getting API Keys

### Anthropic API Key

1. Visit [console.anthropic.com](https://console.anthropic.com/)
2. Sign up / Log in
3. Click "Get API Key"
4. Copy the key starting with `sk-ant-api03-`
5. Paste into `.env`

**Free Credits**: New accounts get $5 free credits!

**Cost per analysis**: ~$0.01 - $0.05 per session

## 🐛 Common Issues

### "Can't reach database server"

**Fix**: Update `DATABASE_URL` in `.env`

```bash
# Railway: Copy from dashboard
# Local: Make sure PostgreSQL is running
```

### "ANTHROPIC_API_KEY not set"

**Fix**: Get API key from [console.anthropic.com](https://console.anthropic.com/)

### "Microphone permission denied"

**Fix**:
- Click lock icon in browser address bar
- Allow microphone access
- Refresh page

### Build errors

**Fix**:
```bash
rm -rf node_modules package-lock.json
npm install
npx prisma generate
npm run dev
```

## 📚 Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- See [README.md](./README.md) for deployment guide
- Check `/prisma/schema.prisma` for database schema

## 🚢 Deploy to Production

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push

# Deploy on Vercel
# 1. Go to vercel.com
# 2. Import GitHub repo
# 3. Add environment variables
# 4. Deploy!
```

## 💡 Pro Tips

1. **Test with short recordings** (10-30 sec) to save API costs
2. **Use Railway** for free PostgreSQL database
3. **Deploy to Vercel** for free hosting
4. **Monitor Claude API usage** at console.anthropic.com

---

**Need help?** Create an issue on GitHub!
