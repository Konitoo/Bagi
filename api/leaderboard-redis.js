// Vercel serverless function for global leaderboard using Upstash Redis
// More reliable than file storage for production

import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const LEADERBOARD_KEY = 'bagjump:leaderboard';

// Sanitize input
function sanitizeName(name) {
  return String(name || 'Player').slice(0, 18).replace(/[<>]/g, '');
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    // Submit new score
    try {
      const { name, score } = req.body;
      
             // Check if this is a reset request
       if (name === 'RESET' && score === 999999999) {
         await redis.del(LEADERBOARD_KEY);
         console.log('Redis leaderboard reset successfully');
         res.status(200).json({ success: true, message: 'Leaderboard reset' });
         return;
       }
       
       // Also check for any existing RESET entries and remove them
       if (name === 'RESET') {
         // Remove any existing RESET entries from the leaderboard
         const scores = await redis.zrevrange(LEADERBOARD_KEY, 0, -1, { withScores: true });
         for (const [data, score] of scores) {
           try {
             const parsed = JSON.parse(data);
             if (parsed.name === 'RESET') {
               await redis.zrem(LEADERBOARD_KEY, data);
             }
           } catch (e) {
             // ignore parsing errors
           }
         }
         res.status(200).json({ success: true, message: 'RESET entries removed' });
         return;
       }
       
       // Don't allow RESET as a real player name
       if (name === 'RESET') {
         return res.status(400).json({ error: 'Invalid name' });
       }
      
      if (!name || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ error: 'Invalid data' });
      }

      const sanitizedName = sanitizeName(name);
      const scoreData = {
        name: sanitizedName,
        score: Math.floor(score),
        timestamp: Date.now()
      };

      // Add to Redis sorted set (score as key, JSON data as value)
      await redis.zadd(LEADERBOARD_KEY, { score: scoreData.score, member: JSON.stringify(scoreData) });
      
      // Keep only top 100 scores
      await redis.zremrangebyrank(LEADERBOARD_KEY, 0, -101);
      
      // Get rank
      const rank = await redis.zrevrank(LEADERBOARD_KEY, JSON.stringify(scoreData));
      
      console.log(`New score submitted: ${sanitizedName} - ${score} (rank: ${rank + 1})`);
      res.status(200).json({ success: true, rank: rank + 1 });
      
    } catch (error) {
      console.error('Error submitting score:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'GET') {
    // Get leaderboard
    try {
      // Get top 50 scores in descending order
      const scores = await redis.zrevrange(LEADERBOARD_KEY, 0, 49, { withScores: true });
      
      const leaderboard = scores.map(([data, score]) => {
        try {
          return JSON.parse(data);
        } catch {
          return { name: 'Player', score: score, timestamp: Date.now() };
        }
      });
      
      console.log(`Leaderboard requested, returning ${leaderboard.length} scores`);
      res.status(200).json(leaderboard);
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
