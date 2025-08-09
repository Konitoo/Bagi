// Vercel serverless function for global leaderboard
// Simple in-memory storage for demo (resets on server restart)
// For production, use Upstash Redis or similar

let leaderboard = [];

// Simple in-memory functions
function loadLeaderboard() {
  return leaderboard;
}

function saveLeaderboard(scores) {
  leaderboard = scores;
  return true;
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
