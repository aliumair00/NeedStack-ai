import sys
import asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from database.connection import connect_to_mongo
from models.user import UserCreate
from routers.auth import register

async def test():
    await connect_to_mongo()
    user = UserCreate(email="test100@example.com", password="password", full_name="Test", role="user")
    res = await register(user)
    print("Result:", res)

if __name__ == "__main__":
    asyncio.run(test())
