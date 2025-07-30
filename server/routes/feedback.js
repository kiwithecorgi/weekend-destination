const express = require('express');
const router = express.Router();
const { validateRequest, feedbackSchema } = require('../middleware/validation');
const { getFirestore } = require('../config/firebase');

// POST /api/feedback
// Submit feedback for a recommendation pack
router.post('/', validateRequest(feedbackSchema), async (req, res, next) => {
  try {
    const { packId, rating, feedback } = req.body;

    console.log('Received feedback:', {
      packId,
      rating,
      hasFeedback: !!feedback
    });

    // Store feedback in Firestore
    const db = getFirestore();
    const feedbackRef = db.collection('feedback');
    
    await feedbackRef.add({
      packId,
      rating,
      feedback: feedback || null,
      timestamp: new Date(),
      // Store minimal metadata for analytics
      userAgent: req.get('User-Agent'),
      ipHash: hashIP(req.ip) // Hash IP for privacy
    });

    // Update pack statistics
    await updatePackStatistics(packId, rating);

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        packId,
        rating,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    next(error);
  }
});

// GET /api/feedback/stats
// Get feedback statistics (for admin/analytics)
router.get('/stats', async (req, res, next) => {
  try {
    const db = getFirestore();
    const feedbackRef = db.collection('feedback');
    
    // Get recent feedback
    const snapshot = await feedbackRef
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const feedbacks = [];
    snapshot.forEach(doc => {
      feedbacks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Calculate statistics
    const stats = calculateFeedbackStats(feedbacks);

    res.json({
      success: true,
      data: {
        stats,
        recentFeedback: feedbacks.slice(0, 10) // Last 10 feedbacks
      }
    });

  } catch (error) {
    console.error('Error getting feedback stats:', error);
    next(error);
  }
});

// GET /api/feedback/pack/:packId
// Get feedback for a specific pack
router.get('/pack/:packId', async (req, res, next) => {
  try {
    const { packId } = req.params;
    const db = getFirestore();
    const feedbackRef = db.collection('feedback');
    
    const snapshot = await feedbackRef
      .where('packId', '==', packId)
      .orderBy('timestamp', 'desc')
      .get();

    const feedbacks = [];
    snapshot.forEach(doc => {
      feedbacks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    const stats = calculateFeedbackStats(feedbacks);

    res.json({
      success: true,
      data: {
        packId,
        stats,
        feedbacks
      }
    });

  } catch (error) {
    console.error('Error getting pack feedback:', error);
    next(error);
  }
});

// Helper function to update pack statistics
async function updatePackStatistics(packId, rating) {
  try {
    const db = getFirestore();
    const statsRef = db.collection('packStats').doc(packId);
    
    // Use transaction to update stats atomically
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(statsRef);
      
      if (doc.exists) {
        const data = doc.data();
        const newTotalRating = data.totalRating + rating;
        const newCount = data.count + 1;
        const newAverageRating = newTotalRating / newCount;
        
        transaction.update(statsRef, {
          totalRating: newTotalRating,
          count: newCount,
          averageRating: newAverageRating,
          lastUpdated: new Date()
        });
      } else {
        transaction.set(statsRef, {
          packId,
          totalRating: rating,
          count: 1,
          averageRating: rating,
          created: new Date(),
          lastUpdated: new Date()
        });
      }
    });

  } catch (error) {
    console.error('Error updating pack statistics:', error);
    // Don't fail the request if stats update fails
  }
}

// Helper function to calculate feedback statistics
function calculateFeedbackStats(feedbacks) {
  if (feedbacks.length === 0) {
    return {
      total: 0,
      averageRating: 0,
      ratingDistribution: {},
      positiveRate: 0
    };
  }

  const total = feedbacks.length;
  const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
  const averageRating = totalRating / total;
  
  // Rating distribution
  const ratingDistribution = {};
  feedbacks.forEach(f => {
    ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
  });

  // Positive rate (4-5 stars)
  const positiveCount = feedbacks.filter(f => f.rating >= 4).length;
  const positiveRate = (positiveCount / total) * 100;

  return {
    total,
    averageRating: Math.round(averageRating * 100) / 100,
    ratingDistribution,
    positiveRate: Math.round(positiveRate * 100) / 100
  };
}

// Helper function to hash IP address for privacy
function hashIP(ip) {
  // Simple hash function for demo purposes
  // In production, use a proper cryptographic hash
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

module.exports = router; 