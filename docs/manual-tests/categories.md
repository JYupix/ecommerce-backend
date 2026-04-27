# Categories Manual Tests

Use this checklist to validate category behavior with public and admin access.

## Smoke Test

| Case | Method | Route | Expected | Status | Actual result |
| --- | --- | --- | --- | --- | --- |
| List categories | GET | /categories | 200 |  |  |
| Get category by slug | GET | /categories/slug/:slug | 200 |  |  |
| Create category as admin | POST | /categories | 201 |  |  |
| Update category as admin | PATCH | /categories/:id | 200 |  |  |
| Soft delete category as admin | DELETE | /categories/:id | 200 |  |  |
| Restore category as admin | PATCH | /categories/:id/restore | 200 |  |  |

## Security Checks

| Case | Method | Route | Expected | Status | Actual result |
| --- | --- | --- | --- | --- | --- |
| Create category with user token | POST | /categories | 403 |  |  |
| Create category without token | POST | /categories | 401 |  |  |
| Update category without token | PATCH | /categories/:id | 401 |  |  |
| Delete category without token | DELETE | /categories/:id | 401 |  |  |
| Get non-existing slug | GET | /categories/slug/does-not-exist | 404 |  |  |
| Create duplicated category | POST | /categories | 409 |  |  |

## Notes

- Use a real `categoryId` and `slug` from your dev database.
- When you soft delete a category, verify it disappears from the public list.
- When you restore it, verify it appears again.
