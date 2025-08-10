// Clear Redis using Upstash REST API
const UPSTASH_URL = 'https://relieved-sawfly-48443.upstash.io';
const UPSTASH_TOKEN = 'Ar07AAIgcDGI-Jte6LTdPN_mCC2f0dUNDpW_AYlYfNgNEBrG-KZUYg';

async function clearLeaderboard() {
  try {
    console.log('Clearing leaderboard via REST API...');
    
    // Use ZREMRANGEBYRANK to remove all scores from the leaderboard
    const keysToClear = [
      'bagjump:leaderboard',
      'bagjump:leaderboard-redis',
      'bagjump:simple:leaderboard', 
      'bagjump:test:leaderboard',
      'bagjump:clean:leaderboard'
    ];
    
    for (const key of keysToClear) {
      console.log(`Clearing key: ${key}`);
      
      // Remove all scores from the sorted set (rank 0 to -1 means all)
      const response = await fetch(`${UPSTASH_URL}/zremrangebyrank/${encodeURIComponent(key)}/0/-1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${UPSTASH_TOKEN}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Cleared ${key}: ${result.result} items removed`);
      } else {
        console.log(`❌ Failed to clear ${key}: ${response.status}`);
      }
    }
    
    console.log('\n✅ All leaderboards cleared!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearLeaderboard();
