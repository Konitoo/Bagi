// Simple leaderboard API without Redis for testing
let scores = [];

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
        scores = [];
        console.log('Leaderboard reset successfully');
        res.status(200).json({ success: true, message: 'Leaderboard reset' });
        return;
      }
      
      if (!name || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ error: 'Invalid data' });
      }

      const scoreData = {
        name: String(name).slice(0, 18),
        score: Math.floor(score),
        timestamp: Date.now()
      };

      scores.push(scoreData);
      scores.sort((a, b) => b.score - a.score);
      scores = scores.slice(0, 100); // Keep top 100
      
      console.log(`New score submitted: ${scoreData.name} - ${scoreData.score}`);
      res.status(200).json({ success: true, rank: scores.findIndex(s => s === scoreData) + 1 });
      
    } catch (error) {
      console.error('Error submitting score:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'GET') {
    try {
      console.log(`Leaderboard requested, returning ${scores.length} scores`);
      res.status(200).json(scores.slice(0, 50));
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
