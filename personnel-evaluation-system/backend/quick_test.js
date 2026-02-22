// quick_test.js - Test topics route directly
const db = require('./db/knex');
const auth = require('./middlewares/auth');

async function testTopics() {
  console.log('Testing topics query directly...');
  try {
    console.log('1. Querying evaluation_topics...');
    const topics = await db('evaluation_topics')
      .select('*')
      .orderBy('id');
    console.log('2. Query done! Rows:', topics.length);
    console.log('3. First topic:', topics[0]);
    
    // Destroy the pool to end the script
    await db.destroy();
    console.log('4. Done!');
  } catch (err) {
    console.error('ERROR:', err);
  }
}

testTopics();
