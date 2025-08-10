// Simple file-based leaderboard - reliable and works everywhere
import fs from 'fs';
import path from 'path';

const LEADERBOARD_FILE = path.join(process.cwd(), 'leaderboard.json');

// Ensure leaderboard file exists
function ensureLeaderboardFile() {
  if (!fs.existsSync(LEADERBOARD_FILE)) {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([]));
  }
}

// Load leaderboard
function loadLeaderboard() {
  try {
    ensureLeaderboardFile();
    const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return [];
  }
}

// Save leaderboard
function saveLeaderboard(leaderboard) {
  try {
    ensureLeaderboardFile();
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
  } catch (error) {
    console.error('Error saving leaderboard:', error);
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
    try {
      const { name, score } = req.body;
      
      // Check if this is a reset request
      if (name === 'RESET' && score === 999999999) {
        saveLeaderboard([]);
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
      const leaderboard = loadLeaderboard();
      
      // Add new score
      const newScore = {
        name: sanitizedName,
        score: Math.floor(score),
        timestamp: Date.now()
      };
      
      leaderboard.push(newScore);
      
      // Sort by score (highest first) and keep only top 100
      leaderboard.sort((a, b) => b.score - a.score);
      const topScores = leaderboard.slice(0, 100);
      
      saveLeaderboard(topScores);
      
      // Find rank
      const rank = topScores.findIndex(s => s.name === sanitizedName && s.score === newScore.score) + 1;
      
      console.log(`New score submitted: ${sanitizedName} - ${score} (rank: ${rank})`);
      res.status(200).json({ success: true, rank });
      
    } catch (error) {
      console.error('Error submitting score:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'GET') {
    try {
      const leaderboard = loadLeaderboard();
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
