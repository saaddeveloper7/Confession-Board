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

## Security (hardening session)
- **Helmet** added in `server.js` for security headers (`app.use(helmet(...))` before routes). CSP and crossOriginResourcePolicy are disabled because this is a pure JSON API (serves no HTML) and we don't want to interfere with CORS or Supabase Storage image URLs loaded by the frontend.
- **CORS locked to FRONTEND_URL only** (no `origin: '*'`). Methods: GET/POST/PATCH/DELETE. Allowed headers: Content-Type, Authorization. Reads `process.env.FRONTEND_URL` (defaults to http://localhost:3000).
- **Input sanitization** (`sanitize-html`) via `src/utils/sanitize.js` → `sanitizeText()`. Strips ALL HTML tags + trims. Applied to confession `content` and profile `bio` before DB insert (stored-XSS defense). NOT applied to email/username/password (they have own validation; sanitizing could corrupt them).
- **Frontend XSS audit:** All user content (confessions, bios, usernames) renders via normal JSX, which auto-escapes — confirmed safe. The only `dangerouslySetInnerHTML` is the no-flash theme-init script in `app/layout.js`, which is a static developer-authored string with no user/dynamic input (not an injection vector).
- **Avatar magic-bytes validation** in `userController.js` (`hasValidImageSignature`): checks the actual file buffer starts with a valid JPEG (FF D8 FF) / PNG (89 50 4E 47…) / WebP (RIFF…WEBP) signature, rejecting faked mimetypes with 400 "Invalid image file". Existing 2MB limit + mimetype check kept as first line of defense (defense in depth).
- **Global error handler** at the end of `server.js`: logs full error server-side (`console.error`), returns generic `{ error: "Something went wrong" }` (500) to the client. All controller 500 catch blocks were also changed from leaking `err.message` to logging + returning the generic message — prevents DB-structure/internal info disclosure.

## Design system (theme session)
- **4 themes:** `light` (default), `dark`, `midnight` (indigo/violet accent), `warm` (cream bg, amber accent). Selected via a `data-theme` attribute on `<html>`.
- **CSS-variable approach:** each theme defines a full palette (`--bg`, `--surface`, `--text`, `--text-muted`, `--border`, `--accent`, `--accent-hover`, `--accent-text`, `--shadow`) under a `[data-theme="…"]` block in `app/globals.css`. Tailwind v4 `@theme inline` maps these to utilities (`bg-bg`, `bg-surface`, `text-text`, `text-text-muted`, `border-border`, `bg-accent`, `text-accent`, `hover:bg-accent-hover`, etc.), so switching `data-theme` instantly restyles everything.
- **Reusable component classes** in `globals.css` (`@layer components`): `.card`, `.input-field`, `.label`, `.btn-primary`, `.btn-secondary`, `.badge`, `.app-link`, `.muted-link`, `.alert-error/success/warn`. All pages use these for a uniform look. Alerts intentionally keep their own bg+text so they stay readable on every theme.
- **Theme persistence:** choice saved to `localStorage` key `theme` (values: light/dark/midnight/warm), with safe fallback to `light` if unset/blocked. `components/ThemeProvider.js` is a React context (`useTheme()`) wrapping the app in `app/layout.js`.
- **No-flash:** a tiny static (developer-authored, no user input) inline script in `layout.js <head>` reads `localStorage.theme` and sets `data-theme` before first paint, so there's no flash of the wrong theme.
- **Fonts:** `next/font/google` — **Inter** for body (`--font-inter` → `--font-sans`), **Sora** for headings (`--font-sora` → `--font-display`, applied to h1–h4 in base layer).
- **Theme switcher:** `components/ThemeSwitcher.js` — 4 small swatches (bg disc + accent dot), lives in the **homepage header** next to `AuthStatus`. Active theme gets an accent ring. Persists on click.

## Security debt / TODO
- **JWT still in localStorage — migrate to httpOnly cookies + CSRF in a dedicated future session.** Considered the top remaining security gap (localStorage tokens are readable by any XSS-injected script). Deliberately NOT touched in the hardening session to avoid breaking the working auth flow.