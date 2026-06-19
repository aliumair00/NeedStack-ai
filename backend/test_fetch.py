import urllib.request
import json
import urllib.error

url = "http://localhost:8000/api/auth/register"
data = {
    "email": "test_again@example.com",
    "password": "password123",
    "full_name": "Test Again",
    "role": "user"
}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})

print("Sending request to backend...")
try:
    response = urllib.request.urlopen(req, timeout=40)
    print("Success:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print("Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Other Error:", e)
