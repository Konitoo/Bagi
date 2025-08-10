// Direct Redis script to clear all leaderboard keys
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: 'https://relieved-sawfly-48443.upstash.io',
  token: 'Ar07AAIgcDGI-Jte6LTdPN_mCC2f0dUNDpW_AYlYfNgNEBrG-KZUYg',
});

async function clearAllLeaderboards() {
  try {
    console.log('Connecting to Redis...');
    
    // List of all possible leaderboard keys to delete
    const keysToDelete = [
      'bagjump:leaderboard',
      'bagjump:leaderboard-redis', 
      'bagjump:simple:leaderboard',
      'bagjump:test:leaderboard',
      'bagjump:clean:leaderboard'
    ];
    
    console.log('Deleting keys:', keysToDelete);
    
    for (const key of keysToDelete) {
      const result = await redis.del(key);
      console.log(`Deleted key "${key}": ${result} items removed`);
    }
    
    // Also try to get all keys with pattern to make sure we don't miss any
    console.log('\nChecking for any remaining leaderboard keys...');
    
    // Note: Upstash Redis doesn't support KEYS command, so we'll just check our known keys
    for (const key of keysToDelete) {
      const exists = await redis.exists(key);
      console.log(`Key "${key}" still exists: ${exists ? 'YES' : 'NO'}`);
    }
    
    console.log('\n✅ All leaderboard keys cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing leaderboards:', error);
  }
  
  process.exit(0);
}

clearAllLeaderboards();
