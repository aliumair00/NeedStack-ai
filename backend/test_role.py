import asyncio
from database.connection import get_database
from dotenv import load_dotenv

load_dotenv()

async def main():
    db = get_database()
    user = await db.users.find_one({'email': 'hananyadikay@gmail.com'})
    print("User found:", bool(user))
    if user:
        print("Role:", user.get('role'))
        print("Status:", user.get('status'))

asyncio.run(main())
