#!/usr/bin/env python3

import requests
import sys
import json
import os
from datetime import datetime
from pathlib import Path
from PIL import Image
import io

class ImageHandlingTester:
    def __init__(self, base_url="https://project-analyzer-111.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.test_credentials = {
            "email": "test@test.com",
            "password": "123456"
        }

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

    def create_test_image(self, size_mb=1.5, format='PNG'):
        """Create a test image of specified size"""
        # For large images, use a fixed large dimension and adjust quality/compression
        if size_mb >= 1.0:
            # Create a large high-resolution image
            width, height = 2000, 2000  # 4MP image
        else:
            # Calculate dimensions for smaller images
            target_bytes = int(size_mb * 1024 * 1024)
            pixels_needed = target_bytes // 3
            width = int(pixels_needed ** 0.5)
            height = width
        
        # Create a colorful test image with random-like pattern for poor compression
        img = Image.new('RGB', (width, height))
        pixels = []
        for y in range(height):
            for x in range(width):
                # Create a noisy pattern that compresses poorly
                r = ((x * 123 + y * 456) % 256)
                g = ((x * 789 + y * 234) % 256) 
                b = ((x * 567 + y * 890) % 256)
                pixels.append((r, g, b))
        
        img.putdata(pixels)
        
        # Save to bytes with settings to achieve target size
        img_bytes = io.BytesIO()
        if format == 'PNG':
            img.save(img_bytes, format='PNG', compress_level=0)  # No compression for larger file
        else:
            img.save(img_bytes, format=format, quality=95)
        img_bytes.seek(0)
        
        actual_size = len(img_bytes.getvalue())
        print(f"   Created {format} test image: {actual_size / (1024*1024):.2f}MB ({width}x{height})")
        
        return img_bytes.getvalue(), actual_size

    def login_with_test_credentials(self):
        """Login with test credentials"""
        print(f"\n🔐 Logging in with test credentials...")
        
        url = f"{self.base_url}/auth/login"
        headers = {'Content-Type': 'application/json'}
        
        try:
            response = requests.post(url, json=self.test_credentials, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data['access_token']
                self.user_id = data['user']['id']
                print(f"   ✅ Login successful - Token: {self.token[:20]}...")
                return True
            else:
                print(f"   ❌ Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Login exception: {str(e)}")
            return False

    def test_create_listing_with_1_image(self):
        """Test creating a listing with only 1 image (minimum requirement)"""
        if not self.token:
            self.log_test("Create Listing with 1 Image", False, "No token available")
            return False, None

        print(f"\n🔍 Testing Create Listing with 1 Image...")
        
        # Create a large test image (1.5MB PNG)
        image_data, original_size = self.create_test_image(1.5, 'PNG')
        
        # Prepare form data
        files = [('images', ('test_large.png', image_data, 'image/png'))]
        
        listing_data = {
            "make": "Tesla",
            "model": "Model 3",
            "year": "2023",
            "mileage": "15000",
            "price": "45000",
            "drive_type": "RWD",
            "city": "San Francisco",
            "zip_code": "94102",
            "phone": "+1555123456",
            "vin": "5YJ3E1EA4KF123456",
            "description": "Excellent Tesla Model 3 with autopilot, premium interior, and supercharging included.",
            "clean_title": "true",
            "authorization": f"Bearer {self.token}"
        }

        url = f"{self.base_url}/listings"
        
        try:
            response = requests.post(url, data=listing_data, files=files)
            
            if response.status_code == 200:
                data = response.json()
                listing_id = data.get('id')
                images = data.get('images', [])
                
                print(f"   ✅ Listing created successfully with ID: {listing_id}")
                print(f"   ✅ Images uploaded: {len(images)} image(s)")
                print(f"   ✅ Original image size: {original_size / (1024*1024):.2f}MB")
                
                self.log_test("Create Listing with 1 Image", True, f"Listing ID: {listing_id}")
                return True, listing_id
            else:
                error_msg = f"Status {response.status_code}: {response.text}"
                self.log_test("Create Listing with 1 Image", False, error_msg)
                return False, None
                
        except Exception as e:
            self.log_test("Create Listing with 1 Image", False, f"Exception: {str(e)}")
            return False, None

    def test_image_compression(self, listing_id):
        """Test that uploaded images are compressed to under 500KB JPEG"""
        if not listing_id:
            self.log_test("Image Compression Verification", False, "No listing ID available")
            return False

        print(f"\n🔍 Testing Image Compression for listing {listing_id}...")
        
        # Check if the compressed file exists on disk
        upload_path = Path(f"/app/backend/uploads/{listing_id}/0.jpg")
        
        if not upload_path.exists():
            self.log_test("Image Compression Verification", False, f"Compressed image not found at {upload_path}")
            return False
        
        # Check file size
        file_size = upload_path.stat().st_size
        file_size_kb = file_size / 1024
        
        print(f"   📁 Compressed file path: {upload_path}")
        print(f"   📏 Compressed file size: {file_size_kb:.2f}KB ({file_size} bytes)")
        
        # Verify it's under 500KB (512000 bytes)
        if file_size <= 500 * 1024:
            print(f"   ✅ File size is under 500KB limit")
            
            # Verify it's a JPEG file
            try:
                with Image.open(upload_path) as img:
                    if img.format == 'JPEG':
                        print(f"   ✅ File format is JPEG")
                        print(f"   📐 Image dimensions: {img.size[0]}x{img.size[1]}")
                        self.log_test("Image Compression Verification", True, f"Size: {file_size_kb:.2f}KB, Format: JPEG")
                        return True
                    else:
                        self.log_test("Image Compression Verification", False, f"Expected JPEG, got {img.format}")
                        return False
            except Exception as e:
                self.log_test("Image Compression Verification", False, f"Error reading image: {str(e)}")
                return False
        else:
            self.log_test("Image Compression Verification", False, f"File size {file_size_kb:.2f}KB exceeds 500KB limit")
            return False

    def test_add_images_to_existing_listing(self, listing_id):
        """Test adding images to an existing listing with compression"""
        if not self.token or not listing_id:
            self.log_test("Add Images to Existing Listing", False, "No token or listing ID available")
            return False

        print(f"\n🔍 Testing Add Images to Existing Listing {listing_id}...")
        
        # Create another large test image (2MB PNG)
        image_data, original_size = self.create_test_image(2.0, 'PNG')
        
        files = [('images', ('test_large_2.png', image_data, 'image/png'))]
        
        form_data = {
            "authorization": f"Bearer {self.token}"
        }

        url = f"{self.base_url}/listings/{listing_id}/images"
        
        try:
            response = requests.post(url, data=form_data, files=files)
            
            if response.status_code == 200:
                data = response.json()
                images = data.get('images', [])
                
                print(f"   ✅ Image added successfully")
                print(f"   ✅ Total images now: {len(images)}")
                print(f"   ✅ Original added image size: {original_size / (1024*1024):.2f}MB")
                
                # Check if the new compressed file exists
                new_image_path = Path(f"/app/backend/uploads/{listing_id}/1.jpg")
                if new_image_path.exists():
                    new_file_size = new_image_path.stat().st_size
                    new_file_size_kb = new_file_size / 1024
                    print(f"   📏 New compressed file size: {new_file_size_kb:.2f}KB")
                    
                    if new_file_size <= 500 * 1024:
                        self.log_test("Add Images to Existing Listing", True, f"Added image compressed to {new_file_size_kb:.2f}KB")
                        return True
                    else:
                        self.log_test("Add Images to Existing Listing", False, f"Added image {new_file_size_kb:.2f}KB exceeds 500KB limit")
                        return False
                else:
                    self.log_test("Add Images to Existing Listing", False, "Compressed image file not found")
                    return False
            else:
                error_msg = f"Status {response.status_code}: {response.text}"
                self.log_test("Add Images to Existing Listing", False, error_msg)
                return False
                
        except Exception as e:
            self.log_test("Add Images to Existing Listing", False, f"Exception: {str(e)}")
            return False

    def test_get_listings_still_works(self):
        """Test that GET /api/listings still works with existing data"""
        print(f"\n🔍 Testing GET /api/listings still works...")
        
        url = f"{self.base_url}/listings"
        
        try:
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    print(f"   ✅ Retrieved {len(data)} listings")
                    
                    # Check if listings have valid structure
                    if len(data) > 0:
                        first_listing = data[0]
                        required_fields = ['id', 'make', 'model', 'year', 'price', 'images']
                        missing_fields = [field for field in required_fields if field not in first_listing]
                        
                        if not missing_fields:
                            print(f"   ✅ Listing structure is valid")
                            print(f"   ✅ Sample listing: {first_listing['year']} {first_listing['make']} {first_listing['model']}")
                            self.log_test("GET Listings Still Works", True, f"Retrieved {len(data)} listings with valid structure")
                            return True
                        else:
                            self.log_test("GET Listings Still Works", False, f"Missing fields in listing: {missing_fields}")
                            return False
                    else:
                        print(f"   ✅ No listings found (empty response is valid)")
                        self.log_test("GET Listings Still Works", True, "Empty listings response")
                        return True
                else:
                    self.log_test("GET Listings Still Works", False, "Response is not a list")
                    return False
            else:
                error_msg = f"Status {response.status_code}: {response.text}"
                self.log_test("GET Listings Still Works", False, error_msg)
                return False
                
        except Exception as e:
            self.log_test("GET Listings Still Works", False, f"Exception: {str(e)}")
            return False

    def run_image_handling_tests(self):
        """Run all image handling tests"""
        print("🚀 Starting NextRides Image Handling Tests")
        print("=" * 60)
        
        # Login first
        if not self.login_with_test_credentials():
            print("❌ Login failed, cannot run authenticated tests")
            return self.get_results()
        
        # Test 1: Create listing with 1 image (minimum requirement)
        listing_created, listing_id = self.test_create_listing_with_1_image()
        
        if listing_created and listing_id:
            # Test 2: Verify image compression
            self.test_image_compression(listing_id)
            
            # Test 3: Add images to existing listing with compression
            self.test_add_images_to_existing_listing(listing_id)
        
        # Test 4: Verify old listings still work
        self.test_get_listings_still_works()
        
        return self.get_results()

    def get_results(self):
        """Get test results summary"""
        print("\n" + "=" * 60)
        print(f"📊 Image Handling Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All image handling tests passed!")
            return 0
        else:
            print("⚠️  Some image handling tests failed")
            failed_tests = [r for r in self.test_results if not r['success']]
            print("\nFailed tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
            return 1

def main():
    """Main test function"""
    tester = ImageHandlingTester()
    return tester.run_image_handling_tests()

if __name__ == "__main__":
    sys.exit(main())