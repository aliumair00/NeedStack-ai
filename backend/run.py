import sys
import asyncio

                                              
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn
import os

if __name__ == "__main__":
    print("Starting Needstack Backend...")
    is_development = os.getenv("ENVIRONMENT", "production") == "development"
    config = uvicorn.Config("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8002")), reload=is_development, loop="asyncio")
    server = uvicorn.Server(config)
    asyncio.run(server.serve())
