// Temporary API to clear all old leaderboard keys
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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
      // Clear all possible old leaderboard keys
      const keysToDelete = [
        'bagjump:leaderboard',
        'bagjump:leaderboard-redis',
        'bagjump:simple:leaderboard',
        'bagjump:test:leaderboard'
      ];
      
      for (const key of keysToDelete) {
        await redis.del(key);
        console.log(`Deleted key: ${key}`);
      }
      
      res.status(200).json({ 
        success: true, 
        message: 'All old leaderboards cleared',
        deletedKeys: keysToDelete
      });
      
    } catch (error) {
      console.error('Error clearing leaderboards:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
