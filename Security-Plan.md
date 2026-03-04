# Security Plan

What we actually use for auth, aligned with `JwtService.java`.

## Current implementation

- **Auth:** Stateless JWT. One **access token** per login/register (no refresh tokens, no OAuth2).
- **Signing:** **HMAC-SHA256** (symmetric secret from `jwt.secret`). Not RS256.
- **Flow:** Register or login → server returns one JWT (`token`, `tokenType: "Bearer"`, `expiresIn`). Client sends `Authorization: Bearer <token>`. Logout = client discards the token (no server-side revocation).
- **Token claims:** `sub` (userId), `email`, `roles`, `iat`, `exp`.
- **Config:** `JWT_SECRET` and `JWT_EXPIRATION` (ms). Secret must be at least 32 bytes for production.

## Future work (not implemented)

- OAuth2 / social login  
- RS256 or other asymmetric signing  
- Refresh tokens  
- Server-side logout / token blacklist
