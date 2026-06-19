import requests

url = "http://localhost:8000/api/auth/login"
payload = {"email": "admin@needstack.ai", "password": "hanan123"}
try:
    res = requests.post(url, json=payload, timeout=5)
    print("Status:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    print("Error:", e)
