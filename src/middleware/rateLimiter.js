import ratelimit from "../config/upstash.js";

const rateLimiter = async (req, res, next) => {
  try {
    const { success } = await ratelimit.limit("my-rate-limit");

    if (!success) {
      return res.status(429).json({
        message: "Too many requests, please try again later.",
      });
    }

    next();
  } catch (error) {
    console.log("Rate limit error", error);
    next(error);
  }
};

export default rateLimiter;

//import ratelimit from "../config/upstash.js"; // Assuming this imports an Upstash Redis/RateLimit client

/**
 * Middleware to enforce rate limiting based on a dynamic key (User ID or IP Address).
 *
 * NOTE: Choose ONE method (User ID or IP) by commenting out the other.
 */
//const rateLimiter = async (req, res, next) => {
    //let identifierKey;

    // ====================================================================
    // OPTION 1: Rate Limit Per Authenticated User ID (RECOMMENDED)
    // This is the best approach for protecting application-specific actions
    // as it prevents abuse even if users share an IP (like in an office).
    // Requires an authentication middleware to run BEFORE this one.
    // ====================================================================
    //if (req.user && req.user.id) {
        // Assuming your authentication middleware places user data at req.user
    //    identifierKey = `user_${req.user.id}`;
   // }

    // ====================================================================
    // OPTION 2: Rate Limit Per IP Address
    // Use this if the route is public (unauthenticated).
    // ====================================================================
   // if (!identifierKey) { // Only use IP if a user ID wasn't found (for public routes)
        // In a production environment behind a proxy or load balancer (like Nginx, AWS ELB, etc.),
        // the client IP is often found in the 'x-forwarded-for' header.
        // It's best practice to use a reliable utility to extract the IP address.
    //    const clientIp = req.headers['x-forwarded-for'] || req.ip;
   //     identifierKey = `ip_${clientIp}`;
   // }

    // Fallback in case neither is available (shouldn't happen)
    //if (!identifierKey) {
   //     console.warn("Rate Limiter could not find a key. Using fallback.");
   //     identifierKey = "unknown_client";
   // }

   // try {
        // Use the dynamic key for the limit check
    //    const { success, limit, remaining, reset } = await ratelimit.limit(identifierKey);

        // It is good practice to send rate limit headers back to the client
      //  res.setHeader('X-RateLimit-Limit', limit);
    //    res.setHeader('X-RateLimit-Remaining', remaining);
    //    res.setHeader('X-RateLimit-Reset', reset); // Time when the limit resets (usually a Unix timestamp)

   //     if (!success) {
    //        return res.status(429).json({
   //             message: "Too many requests. Please slow down and try again later.",
   //         });
   //     }

        // If successful, continue to the next middleware/route handler
   //     next();
   // } catch (error) {
  //      console.error(`Rate limit service error for key ${identifierKey}:`, error);
        // Do not return 429 on service error, as it might block legitimate requests
        // if the rate limit service is down. Just log and proceed to next handler.
 //       next();
//    }
//};

//export default rateLimiter;