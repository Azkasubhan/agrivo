import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000/api/v1"

def api_request(url, method="GET", payload=None, headers=None):
    if headers is None:
        headers = {}
    headers["Content-Type"] = "application/json"
    
    data = None
    if payload:
        data = json.dumps(payload).encode("utf-8")
        
    req = urllib.request.Request(url, method=method, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return json.loads(body)
        except Exception:
            return {"detail": body, "status_code": e.code}

def main():
    phone_number = "+62899999999"
    password = "securePassword123"
    
    print("\n--- 1. LOGIN USER ---")
    login_payload = {
        "phone_number": phone_number,
        "password": password,
    }
    login_res = api_request(f"{BASE_URL}/auth/login", "POST", login_payload)
    print("Login Response Status:", login_res.get("success"))
    
    token = login_res.get("data", {}).get("access_token")
    if not token:
        print("Failed to login, exiting.")
        return
        
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    print("\n--- 2. GET USER NOTIFICATIONS ---")
    notif_res = api_request(f"{BASE_URL}/notifications", "GET", headers=auth_headers)
    print("GET /notifications Status:", notif_res.get("success"))
    
    notifications = notif_res.get("data", {}).get("items", [])
    print(f"Total notifications retrieved: {len(notifications)}")
    
    if not notifications:
        print("No notifications found, cannot test mark-as-read. Please run scratch/test_notification_scheduler.py first.")
        return
        
    target_notif = notifications[0]
    notif_id = target_notif.get("id")
    print(f"Target Notification ID: {notif_id}")
    print(f"Is Read before PATCH: {target_notif.get('is_read')}")
    
    print("\n--- 3. MARK NOTIFICATION AS READ ---")
    patch_res = api_request(f"{BASE_URL}/notifications/{notif_id}/read", "PATCH", headers=auth_headers)
    print("PATCH /notifications/{id}/read Status:", patch_res.get("success"))
    print("Is Read after PATCH:", patch_res.get("data", {}).get("is_read"))
    print("Read At timestamp:", patch_res.get("data", {}).get("read_at"))

    print("\n--- 4. VERIFY READ STATUS IN THE LIST ---")
    notif_res_verify = api_request(f"{BASE_URL}/notifications", "GET", headers=auth_headers)
    verified_items = notif_res_verify.get("data", {}).get("items", [])
    for item in verified_items:
        if item.get("id") == notif_id:
            print(f"Verified is_read in list: {item.get('is_read')}")

if __name__ == "__main__":
    main()
