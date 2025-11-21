// backend/src/middleware/auth.js

// ⚠️ We MUST use the official Clerk SDK for secure JWT verification.
import { clerkClient } from '@clerk/clerk-sdk-node'; 
// NOTE: Ensure your main server file runs import 'dotenv/config' BEFORE this file is imported.

const authMiddleware = async (req, res, next) => {
    // 🚨 DEBUG CHECK (FOR YOU): Check if the key is available
    // console.log('CLERK_SECRET_KEY status:', process.env.CLERK_SECRET_KEY ? 'LOADED' : 'MISSING');

    const authHeader = req.headers.authorization;
    const tokenPresent = authHeader && authHeader.startsWith('Bearer ');
    const token = tokenPresent ? authHeader.replace('Bearer ', '') : null;

    try {
        // 1. Handle missing token: Allow public access
        if (!token) {
            req.auth = null;
            return next(); 
        }

        // 2. VERIFY AND DECODE the token
        const jwtPayload = await clerkClient.verifyToken(token);
        const userId = jwtPayload.sub; 

        // 3. Final check for userId
        if (!userId) {
            console.warn('Verification failed: No userId found in verified token payload.');
            req.auth = null;
            return next(); 
        }

        // 4. Set req.auth
        req.auth = { userId };
        console.log('Auth successful (Verified JWT) for userId:', userId);
        next();
        
    } catch (error) {
        // This block runs if verifyToken fails (e.g., expired, bad signature)
        console.error('CRITICAL: Token verification failed:', error);
        console.log('Received token:', req.headers.authorization);
        
        // 🛡️ ENHANCEMENT: If a token was provided but failed verification, 
        // we immediately reject the request with 401.
        req.auth = null;
        
        // This sends the 401 response here, preventing the request from reaching the controller
        return res.status(401).json({ 
            message: "Unauthorized: Invalid or expired token.",
            error: error.message 
        });
    }
};

// If you are using 'export default' in your file structure:
export default authMiddleware;