#!/usr/bin/env python3

import requests
import sys
import json
import os
from datetime import datetime
from pathlib import Path

class NextRidesAPITester:
    def __init__(self, base_url="https://carshub-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=data)
            elif method == 'POST':
                if files:
                    # For multipart/form-data, don't set Content-Type header
                    test_headers.pop('Content-Type', None)
                    response = requests.post(url, data=data, files=files, headers=test_headers)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}",
            "phone": "+1234567890"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        # First register a user
        timestamp = datetime.now().strftime('%H%M%S')
        register_data = {
            "email": f"login_test_{timestamp}@example.com",
            "password": "LoginTest123!",
            "name": f"Login Test {timestamp}",
            "phone": "+1987654321"
        }
        
        # Register user
        success, _ = self.run_test(
            "Pre-Login Registration",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        
        if not success:
            return False
        
        # Now test login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        return success and 'access_token' in response

    def test_get_user_profile(self):
        """Test getting current user profile"""
        if not self.token:
            self.log_test("Get User Profile", False, "No token available")
            return False
            
        # The /auth/me endpoint expects authorization as a parameter
        return self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200,
            data={"authorization": f"Bearer {self.token}"}
        )[0]

    def test_get_makes(self):
        """Test getting car makes"""
        return self.run_test(
            "Get Car Makes",
            "GET",
            "makes",
            200
        )[0]

    def test_get_models(self):
        """Test getting car models"""
        return self.run_test(
            "Get Car Models",
            "GET",
            "models",
            200
        )[0]

    def test_get_listings(self):
        """Test getting car listings"""
        return self.run_test(
            "Get Car Listings",
            "GET",
            "listings",
            200
        )[0]

    def test_create_listing(self):
        """Test creating a car listing"""
        if not self.token:
            self.log_test("Create Listing", False, "No token available")
            return False, None

        # Create test images (dummy files)
        test_images = []
        for i in range(3):
            # Create a small dummy image file
            dummy_content = b"dummy image content " + str(i).encode()
            test_images.append(('images', (f'test_image_{i}.jpg', dummy_content, 'image/jpeg')))

        listing_data = {
            "make": "Toyota",
            "model": "Camry",
            "year": "2020",
            "mileage": "50000",
            "price": "25000",
            "drive_type": "FWD",
            "city": "Los Angeles",
            "zip_code": "90001",
            "phone": "+1234567890",
            "vin": "1HGBH41JXMN109186",
            "description": "Well maintained Toyota Camry in excellent condition. Regular maintenance, clean interior.",
            "authorization": f"Bearer {self.token}"
        }

        success, response = self.run_test(
            "Create Car Listing",
            "POST",
            "listings",
            200,
            data=listing_data,
            files=test_images
        )
        
        if success and 'id' in response:
            return True, response['id']
        return False, None

    def test_get_my_listings(self):
        """Test getting user's own listings"""
        if not self.token:
            self.log_test("Get My Listings", False, "No token available")
            return False
            
        # The /my-listings endpoint expects authorization as a parameter
        return self.run_test(
            "Get My Listings",
            "GET",
            "my-listings",
            200,
            data={"authorization": f"Bearer {self.token}"}
        )[0]

    def test_get_single_listing(self, listing_id):
        """Test getting a single listing by ID"""
        if not listing_id:
            self.log_test("Get Single Listing", False, "No listing ID available")
            return False
            
        return self.run_test(
            "Get Single Listing",
            "GET",
            f"listings/{listing_id}",
            200
        )[0]

    def test_update_listing(self, listing_id):
        """Test updating a listing"""
        if not self.token or not listing_id:
            self.log_test("Update Listing", False, "No token or listing ID available")
            return False

        update_data = {
            "price": 24000,
            "description": "Updated description - price reduced for quick sale!"
        }

        # The update endpoint expects authorization in headers
        headers = {"Authorization": f"Bearer {self.token}"}
        return self.run_test(
            "Update Listing",
            "PUT",
            f"listings/{listing_id}",
            200,
            data=update_data,
            headers=headers
        )[0]

    def test_delete_listing(self, listing_id):
        """Test deleting a listing"""
        if not self.token or not listing_id:
            self.log_test("Delete Listing", False, "No token or listing ID available")
            return False

        # The delete endpoint expects authorization in headers
        headers = {"Authorization": f"Bearer {self.token}"}
        return self.run_test(
            "Delete Listing",
            "DELETE",
            f"listings/{listing_id}",
            200,
            headers=headers
        )[0]

    def test_search_listings(self):
        """Test searching listings with filters"""
        search_params = {
            "make": "Toyota",
            "price_from": "20000",
            "price_to": "30000"
        }
        
        return self.run_test(
            "Search Listings with Filters",
            "GET",
            "listings",
            200,
            data=search_params
        )[0]

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting NextRides API Tests")
        print("=" * 50)
        
        # Test basic endpoints
        self.test_root_endpoint()
        
        # Test authentication
        if not self.test_user_registration():
            print("❌ Registration failed, skipping authenticated tests")
            return self.get_results()
        
        self.test_user_login()
        self.test_get_user_profile()
        
        # Test car data endpoints
        self.test_get_makes()
        self.test_get_models()
        self.test_get_listings()
        
        # Test listing CRUD operations
        listing_created, listing_id = self.test_create_listing()
        
        if listing_created:
            self.test_get_my_listings()
            self.test_get_single_listing(listing_id)
            self.test_update_listing(listing_id)
            # Don't delete the listing so we can test it in frontend
            # self.test_delete_listing(listing_id)
        
        # Test search functionality
        self.test_search_listings()
        
        return self.get_results()

    def get_results(self):
        """Get test results summary"""
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            failed_tests = [r for r in self.test_results if not r['success']]
            print("\nFailed tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
            return 1

def main():
    """Main test function"""
    tester = NextRidesAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())