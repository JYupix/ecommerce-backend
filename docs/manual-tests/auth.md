# Auth Manual Tests

Use these checks to validate the auth flow before pushing changes.

## Smoke Test

| Case | Method | Route | Expected | Status | Actual result |
| --- | --- | --- | --- | --- | --- |
| Register new user | POST | /auth/register | 201 |  |  |
| Verify email | GET | /auth/verify-email?token=... | 200 |  |  |
| Login with verified user | POST | /auth/login | 200 |  |  |
| Refresh access token | POST | /auth/refresh | 200 |  |  |
| Forgot password | POST | /auth/forgot-password | 200 |  |  |
| Reset password | POST | /auth/reset-password | 200 |  |  |
| Change password | POST | /auth/change-password | 200 |  |  |
| Logout | POST | /auth/logout | 200 |  |  |

## Security Checks

| Case | Method | Route | Expected | Status | Actual result |
| --- | --- | --- | --- | --- | --- |
| Login with wrong password | POST | /auth/login | 401 |  |  |
| Login without verified email | POST | /auth/login | 401 |  |  |
| Refresh with revoked token | POST | /auth/refresh | 401 |  |  |
| Change password without token | POST | /auth/change-password | 401 |  |  |
| Change password with old access token after logout | POST | /auth/change-password | 401 |  |  |
| Forgot password with unknown email | POST | /auth/forgot-password | 200 |  |  |

## Notes

- Keep responses consistent with your controller status codes.
- Document any behavior changes here when you modify the auth flow.
