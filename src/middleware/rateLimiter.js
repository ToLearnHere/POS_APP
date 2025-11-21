// backend/src/middleware/rateLimiter.js

import ratelimit from "../config/upstash.js"; // Assuming this imports an Upstash Redis/RateLimit client

/**
 * Middleware to enforce rate limiting per authenticated User ID (Clerk ID).
 * This relies on the authMiddleware running BEFORE this one to populate req.auth.
 */
const rateLimiter = async (req, res, next) => {
    let identifierKey;
    const clerk_id = req.auth?.userId; // Extract Clerk User ID

    // 1. Rate Limit Per Authenticated User ID (Recommended)
    if (clerk_id) {
        identifierKey = `user_${clerk_id}`;
    } else {
        // 2. Fallback to IP for unauthenticated or public routes (if auth middleware skipped)
        const clientIp = req.headers['x-forwarded-for'] || req.ip;
        identifierKey = `ip_${clientIp}`;
        console.warn("Rate Limiter using IP fallback (Unauthenticated access).");
    }

    try {
        // Use the dynamic key for the limit check
        // You would define the limit configuration in your 'ratelimit' client setup
        const { success, limit, remaining, reset } = await ratelimit.limit(identifierKey);

        // Send rate limit headers back to the client
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', reset);

        if (!success) {
            console.warn(`Rate limit exceeded for key: ${identifierKey}`);
            return res.status(429).json({
                message: "Too many requests. Please slow down and try again later.",
            });
        }

        // If successful, continue to the next middleware/route handler
        next();
    } catch (error) {
        console.error(`Rate limit service error for key ${identifierKey}:`, error);
        // Log the error but proceed to the next handler if the service fails
        next(); 
    }
};

export default rateLimiter;