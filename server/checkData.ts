import { Presence } from './mongodb';

export async function checkMongoData() {
  try {
    // Check total document count
    const totalCount = await Presence.countDocuments();
    console.log(`Total presence documents: ${totalCount}`);
    
    // Get unique user IDs
    const userIds = await Presence.distinct('userId');
    console.log(`Unique user IDs:`, userIds);
    
    // Get sample documents for each user
    for (const userId of userIds) {
      const count = await Presence.countDocuments({ userId });
      console.log(`User ${userId}: ${count} documents`);
      
      const sample = await Presence.findOne({ userId }).lean();
      if (sample) {
        console.log(`Sample for ${userId}:`, {
          status: sample.status,
          timestamp: sample.timestamp,
          activitiesCount: sample.activities?.length || 0
        });
      }
    }
    
    // Check for target user specifically
    const targetCount = await Presence.countDocuments({ userId: "532239959281893397" });
    console.log(`Target user 532239959281893397: ${targetCount} documents`);
    
    // Get recent data for target user
    const recentData = await Presence.find({ userId: "532239959281893397" })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();
    
    console.log('Recent data for target user:');
    recentData.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.timestamp} - Status: ${doc.status} - Activities: ${doc.activities?.length || 0}`);
    });
    
    // Get oldest data for target user
    const oldestData = await Presence.find({ userId: "532239959281893397" })
      .sort({ timestamp: 1 })
      .limit(3)
      .lean();
      
    console.log('Oldest data for target user:');
    oldestData.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.timestamp} - Status: ${doc.status} - Activities: ${doc.activities?.length || 0}`);
    });
    
  } catch (error) {
    console.error('Error checking data:', error);
  }
}