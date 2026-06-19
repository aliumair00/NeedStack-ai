import requests

url = "http://localhost:8000/api/auth/register"
data = {
    "email": "testuser99@example.com",
    "password": "password123",
    "full_name": "Test User",
    "role": "user"
}

print("--- POST register ---")
try:
    r = requests.post(url, json=data, timeout=10)
    print("Status:", r.status_code)
    print("Response:", r.text)
    print("Headers:", dict(r.headers))
except Exception as e:
    print("Error:", e)
