# BagJump - Global Leaderboard Setup

## 🎮 Game Features
- DoodleJump-style gameplay
- Local and Global Highscores
- Matrix background effect
- Rocket power-ups
- Enemy shooting mechanics

## 🌐 Global Leaderboard Setup

### Option 1: File-based Storage (Simple)
The current setup uses file-based storage in `api/leaderboard.js`. This works but resets when Vercel restarts.

### Option 2: Redis Storage (Recommended)
For persistent global leaderboards, use Upstash Redis:

1. **Create Upstash Redis Database:**
   - Go to [upstash.com](https://upstash.com)
   - Create free account
   - Create new Redis database
   - Copy the REST URL and Token

2. **Set Environment Variables:**
   ```bash
   vercel env add UPSTASH_REDIS_REST_URL
   vercel env add UPSTASH_REDIS_REST_TOKEN
   ```

3. **Switch to Redis API:**
   - Change the API endpoint in `index.html` from `/api/leaderboard` to `/api/leaderboard-redis`

## 🚀 Deployment
```bash
git add .
git commit -m "add: global leaderboard with Redis support"
git push origin main
```

## 📁 File Structure
```
├── index.html              # Main game file
├── api/
│   ├── leaderboard.js      # File-based leaderboard
│   └── leaderboard-redis.js # Redis-based leaderboard
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies
└── README.md             # This file
```

## 🎯 How it Works
- Scores are submitted via POST to `/api/leaderboard`
- Global scores are fetched via GET from `/api/leaderboard`
- Top 50 scores are displayed globally
- Local scores are stored in browser localStorage
