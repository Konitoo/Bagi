// Vercel serverless function for global leaderboard
// Option 1: Simple JSON file storage (for demo)
// Option 2: Upstash Redis (recommended for production)

import fs from 'fs';
import path from 'path';

const LEADERBOARD_FILE = path.join(process.cwd(), 'data', 'leaderboard.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(LEADERBOARD_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load leaderboard data
function loadLeaderboard() {
  try {
    ensureDataDir();
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
  return [];
}

// Save leaderboard data
function saveLeaderboard(scores) {
  try {
    ensureDataDir();
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(scores, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving leaderboard:', error);
    return false;
  }
}

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
      
      if (!name || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ error: 'Invalid data' });
      }

      const scores = loadLeaderboard();
      const sanitizedName = sanitizeName(name);
      
      // Add new score
      scores.push({
        name: sanitizedName,
        score: Math.floor(score),
        timestamp: Date.now()
      });

      // Sort by score (highest first) and keep top 100
      scores.sort((a, b) => b.score - a.score);
      const topScores = scores.slice(0, 100);

      // Save to file
      if (saveLeaderboard(topScores)) {
        res.status(200).json({ success: true, rank: topScores.findIndex(s => s.name === sanitizedName && s.score === Math.floor(score)) + 1 });
      } else {
        res.status(500).json({ error: 'Failed to save score' });
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'GET') {
    // Get leaderboard
    try {
      const scores = loadLeaderboard();
      res.status(200).json(scores.slice(0, 50)); // Return top 50
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
