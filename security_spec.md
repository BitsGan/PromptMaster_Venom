# Firestore Security Specification

This document details the security specification for the Firebase Firestore Rules of our prompt matching game.

## 1. Data Invariants

1. **User Identity Security**: Users can only read, create, or update their own user profile document (`/users/{userId}`). Writing to another user's profile is strictly forbidden.
2. **Schema Type Safety**: Documents in `/users/{userId}` must follow a strict schema structure:
   - `uid`, `email`, `displayName`, and `photoURL` must be strings.
   - `completedLevels` and `timeTrialSuccesses` must be lists.
   - `totalScore` must be a non-negative integer.
   - `highScores` and `timeTrialBestTimes` must be maps.
3. **Temporal Integrity**:
   - `createdAt` must be equal to the server's current timestamp on creation.
   - `updatedAt` must be updated to the server's current timestamp on every modification.
4. **Immutable Fields**:
   - `uid` and `email` are immutable once created.
   - `createdAt` is immutable once created.
5. **Solutions Integrity**:
   - Solutions sub-collection records (`/users/{userId}/solutions/{solutionId}`) must only be created by the owner of the parent user profile.
   - Solutions must contain a valid `levelId` (non-negative integer), `prompt`, `score`, and `submittedAt`.
   - Solutions, once written, are immutable (preventing post-facto tampering of successful records).

---

## 2. The "Dirty Dozen" Payloads (Exploit Vector Payloads)

Below are twelve payloads designed to bypass rules, test limits, or spoof identity. Our Firestore Security Rules are mathematically built to reject all of these.

1. **Payload 1: Cross-User Profiles writes (Attacking Identity Boundaries)**
   - Action: `set` on `/users/victim_uid_123` by authenticated user `hacker_uid_456` with:
     ```json
     { "uid": "victim_uid_123", "email": "victim@gmail.com", "totalScore": 99999 }
     ```
   - Target Outcome: `PERMISSION_DENIED`

2. **Payload 2: Email Spoofing (Unverified Identity Check)**
   - Action: authenticated user with unverified email or trying to write to user who doesn't match auth.uid.
   - Target Outcome: `PERMISSION_DENIED`

3. **Payload 3: Score Injection / Privilege Escalation (Shadow Fields)**
   - Action: `set` on `/users/hacker_uid_456` with non-existent or un-enumerated field:
     ```json
     { "uid": "hacker_uid_456", "email": "hacker@gmail.com", "isAdministrator": true }
     ```
   - Target Outcome: `PERMISSION_DENIED`

4. **Payload 4: Invalid Types (Value Poisoning)**
   - Action: `update` on `/users/hacker_uid_456` setting `totalScore` to a string:
     ```json
     { "totalScore": "nine-thousand" }
     ```
   - Target Outcome: `PERMISSION_DENIED`

5. **Payload 5: Massively Oversized IDs (Denial of Wallet)**
   - Action: `set` on `/users/VERY_LONG_GARBAGE_CHARACTER_ID_REPEATING_1000_TIMES...`
   - Target Outcome: `PERMISSION_DENIED` (ID size limit or character pattern rule)

6. **Payload 6: Array Size Exhaustion (Denial of Wallet)**
   - Action: `update` on `/users/hacker_uid_456` setting `completedLevels` with an array of size greater than 100 or non-integers.
   - Target Outcome: `PERMISSION_DENIED`

7. **Payload 7: Bypassing Server Time (Temporal Spoofing)**
   - Action: `update` on `/users/hacker_uid_456` setting `updatedAt` to a client-crafted future timestamp:
     ```json
     { "updatedAt": "2030-01-01T00:00:00Z" }
     ```
   - Target Outcome: `PERMISSION_DENIED`

8. **Payload 8: Modifying Immutable Profile ID (Immutability Guard)**
   - Action: `update` on `/users/hacker_uid_456` changing the `uid` association:
     ```json
     { "uid": "victim_uid_123" }
     ```
   - Target Outcome: `PERMISSION_DENIED`

9. **Payload 9: Orphaned Solution Records (Relationship Sync violation)**
   - Action: Unauthenticated user attempt to list or write to `/users/any_user/solutions/sol_1`
   - Target Outcome: `PERMISSION_DENIED`

10. **Payload 10: TAMPERING of Existing Custom Solutions (Immutability Violation)**
    - Action: `update` or `delete` on an existing document in `/users/hacker_uid_456/solutions/sol_1` to alter the registered score.
    - Target Outcome: `PERMISSION_DENIED`

11. **Payload 11: Scraping All User Records (Blanket Read Guard)**
    - Action: Client issues structural collection list query on `/users` without specified document ID limits, or unauthenticated list.
    - Target Outcome: `PERMISSION_DENIED`

12. **Payload 12: Injection of Malicious Character String as Level IDs**
    - Action: Setting level map `highScores` key containing special characters or SQL-injection characters.
    - Target Outcome: `PERMISSION_DENIED`

---

## 3. Test Runner details

Our production deployment test suite verifies these rules. Each operation must pass strict validation before deploying.
- All unauthenticated operations default-deny.
- Strict read and write permissions apply to authenticated owners.
- Validations execute strictly in order: Request Auth -> Static Validation -> DB Reads.
