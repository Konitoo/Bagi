// Clear leaderboard by setting it to empty array
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const LEADERBOARD_KEY = 'bagjump:leaderboard';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      // Clear by setting to empty array
      await redis.set(LEADERBOARD_KEY, []);
      console.log('Leaderboard cleared successfully');
      res.status(200).json({ success: true, message: 'Leaderboard cleared' });
    } catch (error) {
      console.error('Error clearing leaderboard:', error);
      res.status(500).json({ error: 'Failed to clear leaderboard' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
