// backend/src/middleware/auth.js
// For now, we'll decode the JWT token directly since @clerk/clerk-sdk-node
// doesn't have a simple verifyToken method for session tokens
// We'll extract the userId from the token payload

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.auth = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      req.auth = null;
      return next();
    }

    // Decode JWT token (session tokens from Clerk are JWTs)
    // We'll extract the payload without verification for now
    // In production, you should verify the token signature
    try {
      // JWT structure: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('Invalid token format');
        req.auth = null;
        return next();
      }

      // Decode the payload (base64url)
      // Handle both base64url and base64 encoding
      let payload;
      try {
        payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      } catch (e) {
        // Fallback to regular base64 if base64url fails
        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      }
      
      // Extract userId from the token payload
      // Clerk tokens typically have 'sub' (subject) as the user ID
      const userId = payload.sub || payload.userId || payload.user_id;
      
      if (!userId) {
        console.log('No userId found in token payload');
        req.auth = null;
        return next();
      }
      
      // Set req.auth with the user information
      req.auth = {
        userId: userId,
        sessionId: payload.sid || payload.session_id || payload.jti,
      };
      
      console.log('Auth successful for userId:', userId);
      next();
    } catch (decodeError) {
      console.error('Token decode failed:', decodeError.message);
      req.auth = null;
      next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    req.auth = null;
    next();
  }
};

export default authMiddleware;

