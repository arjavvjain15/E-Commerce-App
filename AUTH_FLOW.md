# Project Authentication & Security Flow Documentation

This document explains the authentication architecture of this application, outlining the lifetime of tokens, database-backed session validation, and how specific security attacks (such as token theft or CSRF) are mitigated.

---

## 1. Authentication Architecture Overview

The system uses a **Dual-Token Hybrid System** combining stateless JWT verification with database-backed stateful validation using a unique **JTI (JWT ID)**.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant Server as Express Server
    database DB as MySQL DB (Sequelize)

    Note over Client, Server: 1. Login / Authentication Flow
    Client->>Server: POST /api/auth/login { email, password }
    Server->>Server: Validate password
    Server->>Server: Generate JTI (uuid)
    Server->>Server: Generate Access Token (JWT with JTI, 15m expiry)
    Server->>Server: Generate Refresh Token (JWT, 7d expiry)
    Server->>DB: Save Session { userId, jti, refreshToken, expiresAt }
    Server-->>Client: Set httpOnly Cookies (accessToken & refreshToken)

    Note over Client, Server: 2. Request Authorization Flow (authMiddleware)
    Client->>Server: Protected Request (automatically sends cookies)
    Server->>Server: Verify accessToken signature (stateless)
    Server->>DB: Check if Session exists with JTI (stateful lookup)
    alt Session exists
        DB-->>Server: Session found
        Server-->>Client: Process request and return data (200 OK)
    else Session destroyed / logged out
        DB-->>Server: No session found
        Server-->>Client: Reject request (401 Unauthorized)
    end
```

---

## 2. Detailed Verification Flows

### A. Access Token Validation (`authMiddleware`)
Every protected endpoint runs `authMiddleware`:
1. **Cookie Extraction**: Retrieves `accessToken` from `req.cookies`.
2. **Signature Verification**: Statelessly checks if the token is valid and unexpired using `process.env.ACCESS_SECRET`.
3. **Stateful Session Check**: Queries the `Sessions` table in the database for `where: { jti: decoded.jti }`.
4. **User Retrieval**: Queries the database to retrieve the active user, appending it to `req.user`.

### B. Token Refreshing (`/refresh`)
When the short-lived `accessToken` expires (15 minutes), the client hits `/api/auth/refresh`:
1. Checks for the presence of the `refreshToken` in cookies.
2. Verifies the signature of the `refreshToken` using `process.env.REFRESH_SECRET`.
3. Queries the `Sessions` table to find the matching `refreshToken`.
4. Checks if the current time exceeds `expiresAt` in the DB session.
5. Generates a brand new `accessToken` with a **new JTI** and updates the JTI on the active session row in the database.

---

## 3. Core Security & Attack Mitigation Strategies

| Attack Vector | How It Is Mitigated | Implementation Detail |
| :--- | :--- | :--- |
| **Cross-Site Scripting (XSS)** | Tokens cannot be read by malicious JavaScript code. | Both `accessToken` and `refreshToken` are delivered as **`httpOnly`** cookies. JavaScript (e.g. `document.cookie`) cannot access them. |
| **Cross-Site Request Forgery (CSRF)** | Attacker sites cannot trigger state-changing operations on behalf of the user. | Cookies use **`sameSite: "strict"`**, ensuring that the browser never attaches the authorization cookies to cross-site requests. |
| **Network Eavesdropping (MITM)** | Tokens cannot be intercepted in transit. | Cookies are marked **`secure: true`** in production, restricting cookie transmissions to HTTPS connections only. |
| **Token Replay (Stolen Access Token)** | Compromised access token becomes useless after logout or session revocation. | Verification requires a database lookup of the unique `jti` (JWT ID). Deleting the database session immediately invalidates all active access tokens containing that JTI. |

---

## 4. Case Studies & Edge Cases

### Case 1: User Logs Out Before Access Token Expiration
* **The Scenario**: An access token is valid for 15 minutes. The user clicks "Logout" after 2 minutes. The token has 13 minutes of math-valid lifetime left.
* **How It Works**:
  1. The client sends a `POST` request to `/api/auth/logout`.
  2. The server extracts the `accessToken`, decodes it to get the `jti`, and runs:
     ```javascript
     await deleteSessionByJti(decoded.jti);
     ```
  3. The server clears the cookies in the user's browser.
* **Preventing Abuse**: If an attacker intercepts the original access token (valid for 13 more minutes) and attempts to replay it, the stateless check (`jwt.verify`) will succeed, but the database check `Session.findOne({ where: { jti: decoded.jti } })` will return `null`. The server will immediately reject the request with `401 Session expired or logged out`.

### Case 2: Access Token Expires, but Refresh Token is Valid
* **The Scenario**: The user has been active for 20 minutes. The access token (15-minute expiry) is expired, but the refresh token (7-day expiry) is still valid.
* **How It Works**:
  1. The client receives a `401 Unauthorized` due to token expiration.
  2. The client sends a request to `/api/auth/refresh`.
  3. The server validates the refresh token against both the cryptographic secret and the database session.
  4. The server responds with a new access token (containing a new `jti`) and updates the session JTI in the database.
  5. The client transparently retries the failed request with the new access token.

### Case 3: Refresh Token is Stolen
* **The Scenario**: An attacker gains access to the database or attempts to spoof/steal the refresh token.
* **How It Works**:
  1. The refresh token can only be used to generate a new access token at `/api/auth/refresh`.
  2. Because the cookie is `httpOnly`, standard browser exploits (XSS) cannot steal it.
  3. If the attacker somehow intercepts the network and gets the refresh token, they still cannot access protected routes directly with it (since only the `accessToken` is checked on protected routes). They would have to invoke the `/refresh` endpoint.
  4. Doing so immediately creates a new access token and updates the session JTI. If the original user is active, they will get logged out when their JTI is overwritten in the DB, signaling session hijacking immediately.
  5. During a logout, the refresh token and session are deleted from the database entirely, rendering the stolen token useless.
