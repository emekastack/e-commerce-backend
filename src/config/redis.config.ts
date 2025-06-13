import Redis from "ioredis";

const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxLoadingRetryTime: 100
})

redis.on("connect", () => {
    console.log("✅ Connected to Redis");
});

redis.on("error", (err) => {
    console.error("❌ Redis connection error:", err);
});

export default redis;