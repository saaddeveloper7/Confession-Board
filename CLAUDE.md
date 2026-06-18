## Progress
- [x] Project folders created
- [x] Next.js frontend initialized
- [x] Express backend initialized
- [x] Express server.js setup with /api/health and /api/test-db routes
- [x] Supabase connected (Project ID: kcfjcvszlyuudjedsmrf)
- [x] Database schema: confessions table created
- [x] CRUD routes for confessions (POST, GET, GET by id, DELETE)
- [x] Anonymous username generator
- [x] Frontend connects to backend
- [x] Backend input validation on createConfession (content max 500, category enum)
- [x] Rate limiting on POST /api/confessions (5 / IP / minute)
- [x] RLS re-enabled on `confessions` (public SELECT + INSERT, no public DELETE)
- [ ] Comments table + routes
- [ ] Reactions
- [x] AI moderation (Groq llama-3.1-8b-instant)
- [x] Mood detection (Groq llama-3.1-8b-instant)
- [x] `users` table (bcrypt password_hash, RLS enabled, backend-only access)
- [x] Auth routes: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
- [x] `requireAuth` JWT middleware (Bearer token, 7d expiry)
- [x] Auth rate limiting (register 5/hr/IP, login 10/15min/IP)
- [x] Frontend pages: /register, /login
- [x] `AuthStatus` component on homepage (verifies token via /me)
- [x] `reset_token` + `reset_token_expires` columns added to `users` (partial index on reset_token)
- [x] Email service via Resend (`emailService.sendPasswordResetEmail`)
- [x] Auth routes: POST /api/auth/forgot-password, POST /api/auth/reset-password
- [x] Forgot/reset rate limiting (forgot 5/hr/IP, reset 10/15min/IP)
- [x] Frontend pages: /forgot-password, /reset-password
- [x] "Forgot password?" link on /login page
- [x] GET /api/auth/verify-reset-token endpoint + frontend pre-validation
- [x] `users` table: added `bio` (TEXT) + `profile_picture_url` (TEXT) columns
- [x] Supabase Storage bucket `profile-pictures` (public read)
- [x] User routes: GET /api/users/:username (public), PATCH /api/users/me, POST /api/users/me/change-password, POST /api/users/me/avatar
- [x] `multer` integration (memoryStorage) for avatar uploads
- [x] Profile rate limiting (updateProfile 20/15min/IP, changePassword 5/hr/IP, uploadAvatar 10/hr/IP)
- [x] GET /api/auth/me now returns bio + profile_picture_url
- [x] Frontend page: /profile/[username] (public view)
- [x] Frontend page: /settings (protected — edit profile, change password, upload avatar)
- [x] `AuthStatus` now shows avatar circle + links username to /profile/[username] + adds Settings link

## Upcoming Roadmap
- [x] **Session 3:** Authentication core (register, login, JWT, auth middleware) ✅ DONE
- [x] **Session 4:** Password recovery (forgot/reset password via email — Resend.com) ✅ DONE
- [x] **Session 5:** User profiles (view/edit profile, change password, profile picture upload to Supabase Storage) ✅ DONE
- [ ] **Session 6:** Dual-mode posting + comments (post as username or anonymous, optional country/date display, comments system)
- [ ] **Session 7:** Routing & UI polish (navbar, footer, categories filter, search, loading states, mobile responsive)

## Session 3 — Tested
All 10 auth tests passed in Postman (register, login, /me, wrong password, missing token, invalid token, duplicate email) and frontend (register flow, login flow, logout, page refresh persistence, localStorage check, Supabase users verification).

## Gotchas / Notes
- RLS is ON for `confessions`: anyone can read and insert, but DELETE only works via backend's Secret key (which bypasses RLS).
- Supabase API key system updated: use "Secret key" for backend, "Publishable key" for frontend (replaces old anon/service_role naming).
- Allowed categories: Relationships, Work, School, Life, Funny. Content max 500 chars.
- Groq AI used for moderation + mood (model: llama-3.1-8b-instant). Returns safe=true fallback if Groq API fails so app doesn't break. Free tier limits: ~30 req/min.
- Auth is being built from scratch (bcrypt + JWT) — no third-party auth providers. Decision: more learning value + better for CV interviews.
- JWT stored in localStorage as 'auth_token'. Future upgrade: move to httpOnly cookie for XSS protection.
- `users` table uses RLS — backend Secret key bypasses it. Public has NO access to users table directly.
- Auth rate limits: register 5/hour/IP, login 10/15min/IP.
- Password hashing: bcrypt, 10 salt rounds.
- Email enumeration protection: /forgot-password always returns same response whether email exists or not.
- Reset tokens expire in 1 hour, single-use (cleared after successful reset).
- Reset emails sent FROM onboarding@resend.dev (Resend free tier default). For production, verify a custom domain.
- Rate limits: forgot-password 5/hour/IP, reset-password 10/15min/IP.
- Reset password page now pre-validates token on load via /api/auth/verify-reset-token, so reused/expired links show error immediately instead of after form submit.
- Profile pictures stored in Supabase Storage bucket 'profile-pictures' (public read, write via backend Secret key only).
- Avatar upload: 2MB max, JPG/PNG/WebP only, filename pattern: {userId}-{timestamp}.{ext}.
- Email is NEVER returned in GET /api/users/:username (privacy). Only returned in GET /api/auth/me for the logged-in user themselves.
- Changing password also clears reset_token (safety: invalidates any pending reset link).
- Rate limits: updateProfile 20/15min, changePassword 5/hr, uploadAvatar 10/hr per IP.