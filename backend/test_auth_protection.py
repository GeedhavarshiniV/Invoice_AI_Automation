"""
test_auth_protection.py
Run this with: python test_auth_protection.py
It logs in, gets a token, then tests the /clients/ endpoint
both WITHOUT and WITH the token to prove protection works.
"""

import requests

BASE_URL = "http://127.0.0.1:8000"

print("=" * 50)
print("TEST 1: Calling /clients/ WITHOUT a token")
print("=" * 50)
r = requests.get(f"{BASE_URL}/clients/")
print(f"Status code: {r.status_code}")
print(f"Response: {r.text}")
print()

print("=" * 50)
print("TEST 2: Logging in to get a token")
print("=" * 50)
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "test@example.com", "password": "test1234"}
)
print(f"Status code: {login_response.status_code}")
print(f"Response: {login_response.text}")

if login_response.status_code != 200:
    print("\nLogin failed - cannot continue to Test 3.")
    exit()

token = login_response.json()["access_token"]
print(f"\nToken obtained: {token[:30]}...")
print()

print("=" * 50)
print("TEST 3: Calling /clients/ WITH the token")
print("=" * 50)
r = requests.get(
    f"{BASE_URL}/clients/",
    headers={"Authorization": f"Bearer {token}"}
)
print(f"Status code: {r.status_code}")
print(f"Response: {r.text}")