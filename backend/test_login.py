#!/usr/bin/env python
"""
Test script to verify login functionality
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from shop.models import UserProfile

User = get_user_model()

def test_login(username, password):
    """Test login functionality"""
    print(f"\n{'='*60}")
    print(f"Testing Login for: {username}")
    print(f"{'='*60}\n")
    
    # 1. Check if user exists
    try:
        user = User.objects.get(username=username)
        print(f"✓ User '{username}' exists")
        print(f"  - ID: {user.id}")
        print(f"  - Email: {user.email}")
        print(f"  - Is Active: {user.is_active}")
        print(f"  - Is Superuser: {user.is_superuser}")
        print(f"  - Is Staff: {user.is_staff}")
    except User.DoesNotExist:
        print(f"✗ User '{username}' does NOT exist!")
        return False
    
    # 2. Check password
    if not user.is_active:
        print(f"✗ User is NOT active!")
        return False
    
    password_valid = user.check_password(password)
    print(f"  - Password Valid: {password_valid}")
    
    if not password_valid:
        print(f"✗ Password is INCORRECT!")
        return False
    
    # 3. Check UserProfile
    try:
        profile = user.profile
        print(f"✓ UserProfile exists")
        print(f"  - Operation Type: {profile.operation_type}")
    except UserProfile.DoesNotExist:
        print(f"⚠ UserProfile does NOT exist (will be created on first login)")
    
    # 4. Test JWT Token Generation
    try:
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        print(f"✓ JWT Tokens generated successfully")
        print(f"  - Access Token: {access_token[:50]}...")
        print(f"  - Refresh Token: {refresh_token[:50]}...")
        
        # Verify token
        from rest_framework_simplejwt.tokens import UntypedToken
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
        
        try:
            UntypedToken(access_token)
            print(f"✓ Access Token is VALID")
        except (InvalidToken, TokenError) as e:
            print(f"✗ Access Token is INVALID: {e}")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to generate JWT tokens: {e}")
        return False

def test_api_endpoint(base_url="http://localhost:8000"):
    """Test the actual API endpoint"""
    import requests
    
    print(f"\n{'='*60}")
    print(f"Testing API Endpoint: {base_url}/api/auth/login/")
    print(f"{'='*60}\n")
    
    url = f"{base_url}/api/auth/login/"
    data = {
        "username": "sunshine",
        "password": "Maitland@2025"
    }
    
    try:
        response = requests.post(url, json=data, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            access_token = result.get('access', '')
            refresh_token = result.get('refresh', '')
            
            print(f"✓ Login SUCCESSFUL!")
            print(f"  - Access Token: {access_token[:50]}...")
            print(f"  - Refresh Token: {refresh_token[:50]}...")
            
            # Test /auth/me/ endpoint
            print(f"\n  Testing /auth/me/ endpoint...")
            me_url = f"{base_url}/api/auth/me/"
            me_response = requests.get(
                me_url,
                headers={"Authorization": f"Bearer {access_token}"},
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
            print(f"✗ Login FAILED!")
            print(f"  Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"✗ Cannot connect to {base_url}")
        print(f"  Make sure the server is running!")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    username = "sunshine"
    password = "Maitland@2025"
    
    # Test 1: Database check
    print("\n" + "="*60)
    print("TEST 1: Database Authentication Check")
    print("="*60)
    db_test = test_login(username, password)
    
    # Test 2: API endpoint (if server is running)
    print("\n" + "="*60)
    print("TEST 2: API Endpoint Test")
    print("="*60)
    
    # Try local first
    api_test_local = test_api_endpoint("http://localhost:8000")
    
    # Try PythonAnywhere
    print("\n")
    api_test_prod = test_api_endpoint("https://sunshinebar.pythonanywhere.com")
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Database Test: {'✓ PASS' if db_test else '✗ FAIL'}")
    print(f"API Test (Local): {'✓ PASS' if api_test_local else '✗ FAIL (Server may not be running)'}")
    print(f"API Test (Production): {'✓ PASS' if api_test_prod else '✗ FAIL (User may not exist on PythonAnywhere)'}")
    print("="*60)
    
    if db_test:
        print("\n✓ User is properly configured in the database!")
        if not api_test_prod:
            print("\n⚠ User needs to be created on PythonAnywhere!")
            print("   Run: python3 manage.py create_sunshine_user")
    else:
        print("\n✗ User configuration has issues!")
        sys.exit(1)

