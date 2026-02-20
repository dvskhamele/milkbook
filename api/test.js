// Test API endpoint
module.exports = async (req, res) => {
  res.status(200).json({ 
    message: 'API is working!',
    method: req.method,
    path: req.url,
    timestamp: new Date().toISOString()
  });
};
