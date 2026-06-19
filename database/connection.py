import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
client = None
db = None

def get_database():
    global client, db
    if db is None:
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
        db_name = MONGODB_URI.split('/')[-1].split('?')[0] or 'needstack'
        db = client[db_name]
    return db

async def connect_to_mongo():
    global client, db
    if not MONGODB_URI:
        print("\n[ERROR] MONGODB_URI is not set in .env file!")
        raise Exception("MONGODB_URI not configured")
    print("\n[INFO] Connecting to MongoDB Atlas...")
    try:
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
        await client.admin.command('ping')
        db_name = MONGODB_URI.split('/')[-1].split('?')[0] or 'needstack'
        db = client[db_name]
        print(f"[SUCCESS] MongoDB Connected! --> Database: '{db_name}'")
    except Exception as e:
        print("\n[ERROR] MongoDB Connection FAILED!")
        print(f"        Reason: {e}")
        print("        --> Check your MONGODB_URI in the .env file\n")
        raise e

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("\n[INFO] MongoDB connection closed.")
