import requests

try:
    print("Sending POST request to localhost:8000...")
    r = requests.post("http://localhost:8000/api/auth/register", json={
        "email": "def@ghi.com",
        "password": "pass",
        "full_name": "Test",
        "role": "user"
    }, timeout=15)
    with open("post_result.txt", "w") as f:
        f.write(f"Status: {r.status_code}\n")
        f.write(f"Response: {r.text}\n")
except Exception as e:
    with open("post_result.txt", "w") as f:
        f.write(f"Error: {e}\n")
