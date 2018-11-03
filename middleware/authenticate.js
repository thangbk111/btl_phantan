const jwt = require('jsonwebtoken');
function isAuthenticated(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
      // verifies secret and checks exp
        jwt.verify(token, 'btl_phantan', function(err, decoded) {
            if (err) {
                return res.json({ "error": true, "message": 'Failed to authenticate token.' });
            }
            else {
                req.decoded = decoded;
                next();
            }
        });
  
    } else {
        return res.status(403).send({ 
            "error": true, 
            "message": 'No token provided.' 
        });
    }
};

module.exports = isAuthenticated;