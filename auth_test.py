#!/usr/bin/env python3

import requests
import sys
import json

class AuthTester:
    def __init__(self, base_url="https://nextrides-backend.onrender.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")

    def test_existing_user_login(self):
        """Test login with existing test user"""
        print(f"\n🔍 Testing login with existing test user...")
        
        login_data = {
            "email": "test@test.com",
            "password": "123456"
        }
        
        url = f"{self.base_url}/auth/login"
        headers = {'Content-Type': 'application/json'}
        
        try:
            response = requests.post(url, json=login_data, headers=headers)
            
            if response.status_code == 200:
                response_data = response.json()
                if 'access_token' in response_data:
                    self.token = response_data['access_token']
                    self.log_test("Existing User Login", True)
                    print(f"   Token obtained: {self.token[:20]}...")
                    return True
                else:
                    self.log_test("Existing User Login", False, "No access token in response")
                    return False
            else:
                error_msg = f"Status {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test("Existing User Login", False, error_msg)
                return False
                
        except Exception as e:
            self.log_test("Existing User Login", False, f"Exception: {str(e)}")
            return False

    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint with token"""
        if not self.token:
            self.log_test("Auth Me Endpoint", False, "No token available")
            return False
            
        print(f"\n🔍 Testing /auth/me endpoint...")
        
        url = f"{self.base_url}/auth/me"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                if 'id' in user_data and 'email' in user_data:
                    self.log_test("Auth Me Endpoint", True)
                    print(f"   User ID: {user_data['id']}")
                    print(f"   Email: {user_data['email']}")
                    return True
                else:
                    self.log_test("Auth Me Endpoint", False, "Invalid user data structure")
                    return False
            else:
                error_msg = f"Status {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test("Auth Me Endpoint", False, error_msg)
                return False
                
        except Exception as e:
            self.log_test("Auth Me Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_seed_endpoint(self):
        """Test the test seed endpoint to ensure test user exists"""
        print(f"\n🔍 Testing test seed endpoint...")
        
        seed_data = {
            "email": "test@test.com",
            "password": "123456",
            "name": "Test User"
        }
        
        url = f"{self.base_url}/test/seed"
        headers = {'Content-Type': 'application/json'}
        
        try:
            response = requests.post(url, json=seed_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("Test Seed Endpoint", True)
                return True
            else:
                error_msg = f"Status {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test("Test Seed Endpoint", False, error_msg)
                return False
                
        except Exception as e:
            self.log_test("Test Seed Endpoint", False, f"Exception: {str(e)}")
            return False

    def run_auth_tests(self):
        """Run focused auth tests"""
        print("🚀 Starting NextRides Auth-Focused Tests")
        print("=" * 50)
        
        # First try to login with existing test user
        login_success = self.test_existing_user_login()
        
        # If login fails, try to seed the user and login again
        if not login_success:
            print("\n⚠️  Login failed, attempting to seed test user...")
            if self.test_seed_endpoint():
                print("✅ Test user seeded, retrying login...")
                login_success = self.test_existing_user_login()
        
        # Test /auth/me endpoint if we have a token
        if login_success:
            self.test_auth_me_endpoint()
        
        # Results
        print("\n" + "=" * 50)
        print(f"📊 Auth Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All auth tests passed!")
            return 0
        else:
            print("⚠️  Some auth tests failed")
            return 1

def main():
    """Main test function"""
    tester = AuthTester()
    return tester.run_auth_tests()

if __name__ == "__main__":
    sys.exit(main())