# Garmin Health API Integration Guide

**Last Updated:** January 2026
**API Version:** Garmin Health API v1
**Auth Protocol:** OAuth 2.0 (CORRECTED from OAuth 1.0A)

---

## Overview

Garmin Connect provides health and fitness data through the **Garmin Health API**. This integration enables NGX GENESIS to access:
- Heart Rate Variability (HRV) and resting heart rate
- Sleep metrics (duration, stages, score)
- Body Battery (Garmin's proprietary energy metric)
- Stress levels
- Steps and activity data

## Developer Program Requirements

### Application Process

**Timeline:** 2-4 weeks for approval

1. **Apply at:** [developer.garmin.com/health-api](https://developer.garmin.com/health-api)
2. **Required Information:**
   - Company name and description
   - Application name and purpose
   - Expected user base
   - Data usage policy
   - Privacy policy URL

3. **Evaluation Criteria:**
   - Legitimate health/fitness use case
   - Privacy-compliant data handling
   - No data reselling

### After Approval

You receive:
- Consumer Key (Client ID)
- Consumer Secret (Client Secret)
- Access to Health API endpoints
- Webhook configuration panel

## Authentication Flow (OAuth 2.0)

### Authorization URL
```
https://connect.garmin.com/oauthConfirm
```

### Token URL
```
https://connectapi.garmin.com/oauth-service/oauth/access_token
```

### Flow Implementation

```python
# backend/wearables/garmin.py

from typing import Any
import httpx
from urllib.parse import urlencode

# Garmin OAuth 2.0 endpoints
GARMIN_AUTH_URL = "https://connect.garmin.com/oauthConfirm"
GARMIN_TOKEN_URL = "https://connectapi.garmin.com/oauth-service/oauth/access_token"
GARMIN_API_BASE = "https://apis.garmin.com/wellness-api/rest"

class GarminClient:
    """Garmin Health API client using OAuth 2.0."""

    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri

    def get_authorization_url(self, state: str) -> str:
        """Generate OAuth 2.0 authorization URL."""
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "scope": "activity heart sleep stress",
            "state": state,
        }
        return f"{GARMIN_AUTH_URL}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> dict[str, Any]:
        """Exchange authorization code for access token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GARMIN_TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.redirect_uri,
                },
            )
            response.raise_for_status()
            return response.json()

    async def refresh_token(self, refresh_token: str) -> dict[str, Any]:
        """Refresh access token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GARMIN_TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
            )
            response.raise_for_status()
            return response.json()
```

## Available Endpoints

### Daily Summaries
```
GET /dailies?uploadStartTimeInSeconds={start}&uploadEndTimeInSeconds={end}
```

Returns:
- Steps, distance, calories
- Heart rate (min, max, average, resting)
- Stress levels
- Body Battery

### Sleep Data
```
GET /sleeps?uploadStartTimeInSeconds={start}&uploadEndTimeInSeconds={end}
```

Returns:
- Total sleep duration
- Sleep stages (deep, light, REM, awake)
- Sleep score
- Respiration rate

### HRV Data
```
GET /hrv?uploadStartTimeInSeconds={start}&uploadEndTimeInSeconds={end}
```

Returns:
- HRV status (balanced, low, unbalanced)
- HRV values (weekly averages)
- Last night's HRV

### Body Battery
```
GET /bodyBattery?uploadStartTimeInSeconds={start}&uploadEndTimeInSeconds={end}
```

Returns:
- Body Battery level (0-100)
- Charged/drained amounts
- Timestamps

## Webhook Configuration

Garmin supports push notifications for new data.

### Webhook URL
Configure in Garmin Developer Portal:
```
https://api.genesis.mx/webhooks/garmin
```

### Payload Format
```json
{
  "dailies": [
    {
      "userId": "garmin_user_id",
      "userAccessToken": "...",
      "summaryId": "...",
      "startTimeInSeconds": 1705363200,
      "durationInSeconds": 86400,
      "steps": 8500,
      "distanceInMeters": 6200.5,
      "restingHeartRateInBeatsPerMinute": 62,
      "bodyBatteryChargedValue": 45,
      "bodyBatteryDrainedValue": 60
    }
  ]
}
```

## Data Normalization

### HRV Conversion
Garmin provides HRV status, not raw values. Estimate RMSSD:

```python
def estimate_hrv_from_garmin(status: str, resting_hr: int) -> float:
    """Estimate HRV RMSSD from Garmin status."""
    # Garmin HRV status categories
    status_ranges = {
        "balanced": (40, 60),      # Good HRV range
        "high": (60, 100),         # Excellent HRV
        "low": (20, 40),           # Below average
        "unbalanced": (30, 50),    # Variable
    }

    low, high = status_ranges.get(status.lower(), (30, 50))

    # Adjust based on resting HR (inverse relationship)
    if resting_hr < 55:
        return high
    elif resting_hr > 70:
        return low
    else:
        # Linear interpolation
        ratio = (70 - resting_hr) / 15
        return low + (high - low) * ratio
```

### Body Battery → Recovery Score
```python
def body_battery_to_recovery(body_battery: int) -> float:
    """Convert Body Battery (0-100) to NGX Recovery Score (0-100)."""
    # Body Battery is already a 0-100 scale
    # Apply slight normalization for consistency
    return min(100, body_battery * 1.05)  # Slight boost for calibration
```

## Rate Limits

- **API calls:** 100 requests per minute per user
- **Bulk endpoints:** 25 requests per minute
- **Webhook delivery:** Near real-time (5-15 min delay typical)

## Error Handling

### Common Errors

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Token expired | Refresh token |
| 403 | Insufficient scope | Re-authorize |
| 429 | Rate limited | Backoff and retry |
| 503 | Service unavailable | Retry with backoff |

### Retry Strategy
```python
async def garmin_request_with_retry(url: str, token: str, max_retries: int = 3):
    """Make Garmin API request with exponential backoff."""
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers={"Authorization": f"Bearer {token}"}
                )

                if response.status_code == 429:
                    wait_time = 2 ** attempt
                    await asyncio.sleep(wait_time)
                    continue

                response.raise_for_status()
                return response.json()

        except httpx.HTTPError as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)
```

## Testing

### Sandbox Environment
Garmin provides a sandbox for testing:
- Use test credentials from Developer Portal
- Simulated data available
- No real user data

### Test User Setup
1. Create test account in Garmin Connect
2. Authorize your app
3. Generate test data via Garmin Connect app
4. Verify data flows through webhook

## Security Considerations

1. **Token Storage:** Encrypt access/refresh tokens in database
2. **Webhook Validation:** Verify webhook signatures
3. **HTTPS Only:** All API calls must use HTTPS
4. **Scope Minimization:** Only request needed scopes

## IMPORTANT: OAuth 2.0 (NOT 1.0A)

**Previous documentation incorrectly stated OAuth 1.0A.**

As of 2025, Garmin Health API uses **OAuth 2.0**. Key differences:
- No request token step
- Standard authorization code flow
- Refresh tokens for long-term access
- Bearer token authentication

This correction is critical for implementation.

---

## References

- [Garmin Health API Documentation](https://developer.garmin.com/health-api/overview)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Garmin Connect Developer Portal](https://developer.garmin.com)
