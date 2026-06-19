import requests, json, os

api_url = os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:8000')
url = f"{api_url}/api/auth/register"
payload = {
    "email": "test_user@example.com",
    "password": "Password123",
    "full_name": "Test User",
    "role": "user",
    "bio": "",
    "skills": []
}
try:
    res = requests.post(url, json=payload, timeout=5)
    print('Status:', res.status_code)
    print('Response:', res.text)
except Exception as e:
    print('Error:', e)
