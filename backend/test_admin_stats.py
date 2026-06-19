import requests

url = "http://localhost:8000/api/admin/stats"
# we need an admin token
login_url = "http://localhost:8000/api/auth/login"
payload = {"email": "admin@needstack.ai", "password": "hanan123"}
try:
    res = requests.post(login_url, json=payload, timeout=5)
    token = res.json()["access_token"]
    
    stats_res = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=5)
    print("Status:", stats_res.status_code)
    print("Response:", stats_res.text)
except Exception as e:
    print("Error:", e)
