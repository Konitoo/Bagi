import { Redis } from '@upstash/redis';

// Check if environment variables are set
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error('Missing Redis environment variables');
  console.error('UPSTASH_REDIS_REST_URL:', process.env.UPSTASH_REDIS_REST_URL ? 'SET' : 'MISSING');
  console.error('UPSTASH_REDIS_REST_TOKEN:', process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'MISSING');
}

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
    try {
      const { name, score } = req.body;

      // Check if this is a reset request
      if (name === 'RESET' && score === 999999999) {
        await redis.del(LEADERBOARD_KEY);
        console.log('Leaderboard reset successfully');
        res.status(200).json({ success: true, message: 'Leaderboard reset' });
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
      const scoreValue = Math.floor(score);

      // Add score to sorted set
      await redis.zadd(LEADERBOARD_KEY, { score: scoreValue, member: `${sanitizedName}:${Date.now()}` });

      // Keep only top 100 scores
      await redis.zremrangebyrank(LEADERBOARD_KEY, 0, -101);

      // Get rank of new score
      const rank = await redis.zrevrank(LEADERBOARD_KEY, `${sanitizedName}:${Date.now()}`);

      console.log(`New score submitted: ${sanitizedName} - ${scoreValue} (rank: ${rank + 1})`);
      res.status(200).json({ success: true, rank: rank + 1 });

    } catch (error) {
      console.error('Error submitting score:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'GET') {
    try {
      // Check if Redis is configured
      if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.error('Redis not configured - missing environment variables');
        return res.status(500).json({ 
          error: 'Redis not configured',
          message: 'Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel environment variables'
        });
      }

      // Get top 100 scores in descending order
      const scores = await redis.zrevrange(LEADERBOARD_KEY, 0, 99, { withScores: true });
      
      const leaderboard = scores.map((score, index) => {
        const [name] = score.member.split(':');
        return {
          rank: index + 1,
          name: name,
          score: score.score,
          timestamp: parseInt(score.member.split(':')[1]) || Date.now()
        };
      });

      console.log(`Leaderboard requested, returning ${leaderboard.length} scores`);
      res.status(200).json(leaderboard);

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      console.error('Error details:', error.message);
      res.status(500).json({ 
        error: 'Server error', 
        message: error.message,
        details: 'Check Vercel function logs for more information'
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
