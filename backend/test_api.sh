#!/bin/bash

BASE_URL="http://localhost:8001/api"

echo "1. Registering Device (Trial)..."
curl -X POST $BASE_URL/v1/device/register \
  -H "Content-Type: application/json" \
  -d '{"fingerprint": "test-device-001", "model": "Pixel 6", "os_version": "Android 13"}' \
  | grep "trial_active" && echo " [PASS]" || echo " [FAIL]"

echo -e "\n2. Getting Admin Token..."
TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access":"[^"]*' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
    echo " [PASS] Token obtained"
else
    echo " [FAIL] Could not obtain token"
    echo $TOKEN_RESPONSE
    exit 1
fi

echo -e "\n3. Checking Admin Payments List..."
curl -s -X GET $BASE_URL/admin/payments/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  | grep "\[" && echo " [PASS] List retrieved" || echo " [FAIL]"
