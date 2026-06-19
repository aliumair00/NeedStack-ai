import requests, json

url = "http://localhost:8000/api/analytics/export"
try:
    res = requests.get(url, timeout=5)
    print('Status:', res.status_code)
    print('Headers:', res.headers)
    print('Response:', res.text[:200])
except Exception as e:
    print('Error:', e)
