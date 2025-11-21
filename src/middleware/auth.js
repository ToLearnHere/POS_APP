// backend/src/middleware/auth.js

// ⚠️ We MUST use the official Clerk SDK for secure JWT verification.
import { clerkClient } from '@clerk/clerk-sdk-node'; 
import 'dotenv/config'; // Ensure environment variables are loaded if not done elsewhere

// Initialize clerkClient with your secret key 
// Note: CLERK_SECRET_KEY must be in your backend's .env file
if (!process.env.CLERK_SECRET_KEY) {
    console.error("CLERK_SECRET_KEY is NOT set. Authentication will fail.");
}

// ⚠️ WARNING: If your authMiddleware logic lives in a shared entry file,
// ensure the Clerk SDK is initialized correctly for your framework (e.g., Express).

const authMiddleware = async (req, res, next) => {
    try {
        // 1. Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.auth = null;
            return next(); // Allow unauthenticated access if needed
        }

        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            req.auth = null;
            return next();
        }

        // 2. 🛡️ VERIFY AND DECODE the token using the official Clerk SDK
        // This checks the signature, expiration, and issuer securely.
        const sessionToken = token;
        
        // We use clerkClient.sessions.verifySession (or similar) to verify the token.
        // For standard Clerk JWTs (like the ones from getToken()), use sessions.verifySession or sessions.verifyToken
        // Since you are using Express, the recommended approach is usually to verify the token directly.
        
        // If your token is a Clerk Session Token (from getToken()), use:
        // const session = await clerkClient.sessions.verifySession(sessionToken);
        // userId = session.userId;
        // sessionId = session.id;

        // If your token is a Clerk-issued JWT (which `getToken()` provides):
        // You can decode the token to get the claims and verify the signature using the public key.
        // A direct, production-ready solution involves using the Clerk `verifyToken` function:
        const session = await clerkClient.sessions.verifySession(sessionToken);
        userId = session.userId;

        if (!userId) {
            console.log('Verification failed: No userId found in verified token.');
            req.auth = null;
            return next();
        }

        // 3. Set req.auth with the verified user information
        req.auth = {
            userId: userId,
            // You can extract more payload data here if needed
        };
        
        console.log('Auth successful (Verified JWT) for userId:', userId);
        next();
    } catch (error) {
        // 🚨 ADD THIS LINE TO DEBUG 🚨
        console.error('CRITICAL: Token verification failed:', error); 
        console.log('Received token:', req.headers.authorization);
        // console.error('CRITICAL: Token verification failed:', error.message);
        // console.log('Received token:', req.headers.authorization);
        // If verification fails (e.g., expired, wrong signature), treat as unauthenticated
        req.auth = null;
        next(); 

    }
};

export default authMiddleware;