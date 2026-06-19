import requests

url = "http://localhost:8000/api/auth/register"
data = {
    "email": "httptest@example.com",
    "password": "password123",
    "full_name": "HTTP Test",
    "role": "user"
}

print("Testing HTTP POST to localhost:8000...")
try:
    r = requests.post(url, json=data, timeout=35)
    print("Status code:", r.status_code)
    print("Response body:", r.text)
except Exception as e:
    print("Error:", e)
