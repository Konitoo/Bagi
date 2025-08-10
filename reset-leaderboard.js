// Direct leaderboard reset script
import fs from 'fs';
import path from 'path';

const LEADERBOARD_FILE = path.join(process.cwd(), 'leaderboard.json');

function resetLeaderboard() {
  try {
    console.log('Resetting leaderboard.json...');
    
    // Write empty array to leaderboard.json
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([], null, 2));
    
    console.log('✅ Leaderboard reset successfully!');
    
    // Verify it's empty
    const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
    const leaderboard = JSON.parse(data);
    console.log(`📊 Scores in leaderboard: ${leaderboard.length}`);
    
  } catch (error) {
    console.error('❌ Error resetting leaderboard:', error);
  }
}

resetLeaderboard();
