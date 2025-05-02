router.post('/api/feedback', async (req, res) => {
    try {
      const {
       
        email = '',
        totalScore,
        maxScore,
        percentage,
        
        timestamp = new Date()
      } = req.body;
  
      const feedback = new Feedback({
      
        email,
        totalScore,
        maxScore,
        percentage,
        
        timestamp,
      });
  
      await feedback.save();
      res.status(201).json({ message: 'Feedback stored successfully' });
    } catch (error) {
      console.error('Error storing feedback:', error);
      res.status(500).json({ error: 'Failed to store feedback' });
    }
  });
  module.exports = router;
  