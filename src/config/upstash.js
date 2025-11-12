import { Redis } from '@upstash/redis';
import {Ratelimit} from "@upstash/ratelimit";
//npm i @upstash/redis@1.34.9 @upstash/ratelimit@2.0.5 
import "dotenv/config";

const ratelimiter = new Ratelimit({
  redis: Redis.fromEnv(), 
  limiter: Ratelimit.slidingWindow(100, "60 s"),
});

export default ratelimiter

