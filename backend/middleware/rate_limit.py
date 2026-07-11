import os
import math
import time
from fastapi import Request
from fastapi.responses import JSONResponse
from limits import storage, strategies, parse

# Fallback to MemoryStorage if REDIS_URL is not set
redis_url = os.getenv("REDIS_URL")
if redis_url:
    try:
        store = storage.RedisStorage(redis_url)
    except Exception:
        store = storage.MemoryStorage()
else:
    store = storage.MemoryStorage()

# Using MovingWindow for accurate rate limiting (or FixedWindow if memory constrained, but limits handles this well)
limiter_strategy = strategies.MovingWindowRateLimiter(store)

# Define our rate limits
AUTH_LIMIT = parse("5/15minute")
DEFAULT_LIMIT = parse("100/minute")

def get_client_ip(request: Request) -> str:
    # Try to get the real IP if behind a proxy
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

def get_user_id(request: Request) -> str:
    # Attempt to extract user id from auth header to add to the key
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        token = auth.split(" ")[1]
        try:
            from jose import jwt
            SECRET_KEY = os.getenv("JWT_SECRET")
            if not SECRET_KEY:
                raise RuntimeError("JWT_SECRET is missing")
            ALGORITHM = "HS256"
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                return user_id
        except Exception:
            pass
    return ""

async def rate_limit_middleware(request: Request, call_next):
    # Only limit /api endpoints
    if not request.url.path.startswith("/api/"):
        return await call_next(request)

    client_ip = get_client_ip(request)
    user_id = get_user_id(request)
    
    # Create a unique identifier for the requester (combine IP and User ID if available)
    identifier = f"{client_ip}:{user_id}" if user_id else client_ip

    # Determine which limit applies
    if request.url.path.startswith("/api/auth/login") or request.url.path.startswith("/api/auth/register"):
        limit = AUTH_LIMIT
    else:
        limit = DEFAULT_LIMIT

    # Generate the key for limits
    key = f"ratelimit:{limit}:{identifier}:{request.url.path}"
    print(f">>> [RATE LIMIT] Path: {request.url.path}, Limit: {limit}, Key: {key}")

    # Check if the limit is exceeded
    if not limiter_strategy.hit(limit, key):
        print(">>> [RATE LIMIT] Exceeded!")
        # Calculate retry after
        stats = limiter_strategy.get_window_stats(limit, key)
        retry_after = math.ceil(stats[0]) # reset time in seconds from epoch
        now = time.time()
        wait_time = max(0, retry_after - int(now))

        return JSONResponse(
            status_code=429,
            content={"detail": "Too Many Requests"},
            headers={"Retry-After": str(wait_time)}
        )

    # Proceed with the request
    response = await call_next(request)
    return response
