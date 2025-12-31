#!/usr/bin/env python
"""
Test login with sunshinebar credentials
"""
import requests
import json

def test_login(base_url, username, password):
    """Test login endpoint"""
    url = f"{base_url}/api/auth/login/"
    data = {
        "username": username,
        "password": password
    }
    
    print(f"\n{'='*60}")
    print(f"Testing Login: {username}")
    print(f"URL: {url}")
    print(f"{'='*60}\n")
    
    try:
        response = requests.post(url, json=data, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}\n")
        
        try:
            result = response.json()
            print(f"Response Body:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        except:
            print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            print(f"\n✓ Login SUCCESSFUL!")
            access_token = result.get('access', '')[:50] if 'access' in result else ''
            refresh_token = result.get('refresh', '')[:50] if 'refresh' in result else ''
            print(f"  - Access Token: {access_token}...")
            print(f"  - Refresh Token: {refresh_token}...")
            
            # Test /auth/me/ endpoint
            if 'access' in result:
                print(f"\n  Testing /auth/me/ endpoint...")
                me_url = f"{base_url}/api/auth/me/"
                me_response = requests.get(
                    me_url,
                    headers={"Authorization": f"Bearer {result['access']}"},
                    timeout=10
                )
                
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    print(f"  ✓ /auth/me/ SUCCESSFUL!")
                    print(f"    - Username: {me_data.get('username')}")
                    print(f"    - Role: {me_data.get('role')}")
                    print(f"    - Operation Type: {me_data.get('operation_type')}")
                    print(f"    - Is Superuser: {me_data.get('is_superuser')}")
                else:
                    print(f"  ✗ /auth/me/ FAILED! Status: {me_response.status_code}")
                    print(f"    Response: {me_response.text}")
            
            return True
        else:
            print(f"\n✗ Login FAILED!")
            if 'detail' in result:
                print(f"  Error: {result['detail']}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"✗ Cannot connect to {base_url}")
        print(f"  Make sure the server is running!")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    username = "sunshinebar"
    password = "Maitland@2025"
    
    # Test local
    print("\n" + "="*60)
    print("TEST 1: Local Server (http://localhost:8000)")
    print("="*60)
    local_test = test_login("http://localhost:8000", username, password)
    
    # Test production
    print("\n" + "="*60)
    print("TEST 2: Production Server (https://sunshinebar.pythonanywhere.com)")
    print("="*60)
    prod_test = test_login("https://sunshinebar.pythonanywhere.com", username, password)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Local Test: {'✓ PASS' if local_test else '✗ FAIL'}")
    print(f"Production Test: {'✓ PASS' if prod_test else '✗ FAIL'}")
    print("="*60)

