# Telugu Saptapadi — Backend API

> Production-grade Node.js + Express + Socket.IO backend for the Telugu Saptapadi matrimony platform.
> Focused on the Telugu community across Andhra Pradesh, Telangana, and global Telugu diaspora.

---

## Stack

| Layer            | Technology                                 |
| ---------------- | ------------------------------------------ |
| Runtime          | Node.js 18+                                |
| Framework        | Express 4                                  |
| Database         | MongoDB + Mongoose                         |
| Real-time        | Socket.IO 4                                |
| Auth             | JWT (httpOnly cookie + Bearer)             |
| OTP              | Twilio SMS                                 |
| Email            | NodeMailer (SMTP)                          |
| Photo Storage    | **Cloudinary** (replaces AWS S3)           |
| Payments (India) | Razorpay (INR)                             |
| Payments (NRI)   | Stripe (USD / GBP / CAD / AUD)             |
| Security         | Helmet, HPP, Mongo-Sanitize, Rate Limiting |

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
# Fill in all values — especially Cloudinary, Twilio, Razorpay/Stripe

# 3. Development
npm run dev

# 4. Production
npm start
```

---

## Telugu-Specific Features

- **Caste fields**: `caste`, `subCaste`, `subsect` — supports Kamma, Reddy, Kapu, Brahmin, Yadav, Vysya, etc.
- **Gotram**: strictly validated — same-gotram marriages flagged as **Gotram Dosham**
- **Jatakam**: Telugu term for horoscope — full Ashtakoot (36-point) compatibility with Telugu labels (నాడి దోషం, మంగళ దోషం, etc.)
- **District filter**: AP/Telangana district-level search (Guntur, Warangal, Vijayawada, Hyderabad, etc.)
- **Region**: Andhra / Telangana / Rayalaseema segmentation
- **Native Place** & **Kula Devata**: family-culture fields important in Telugu alliances
- **Cloudinary**: all photos stored on Cloudinary with face-detection smart cropping, blur transformation for privacy-locked photos — no signed URL expiry
- **Jatakam PDF upload**: users can upload their horoscope PDF to Cloudinary

---

## Cloudinary Integration

Photos are uploaded as buffers (no disk write) via `streamifier`:

```
multer memoryStorage → buffer → cloudinaryService.uploadPhoto() → Cloudinary
```

Each upload creates:

- Full-size image (1200px wide, quality auto)
- 400×500 face-crop thumbnail (eager transform)
- 150×150 avatar thumbnail (eager transform)

Privacy-blurred photos use Cloudinary on-the-fly `effect: blur:800` — no re-upload needed.

---

## API Reference

### Auth

| Method | Endpoint                     | Auth |
| ------ | ---------------------------- | ---- |
| POST   | `/api/auth/register/step1`   | None |
| POST   | `/api/auth/register/step2`   | None |
| POST   | `/api/auth/verify-otp`       | None |
| POST   | `/api/auth/resend-otp`       | None |
| POST   | `/api/auth/login`            | None |
| POST   | `/api/auth/login/otp`        | None |
| POST   | `/api/auth/login/otp/verify` | None |
| POST   | `/api/auth/logout`           | JWT  |
| GET    | `/api/auth/me`               | JWT  |

### Profile

| Method | Endpoint | Auth |
| ------ | -------- | ---- |

| GET | `/api/profile/me` | JWT |
| GET | `/api/profile/:id` | Optional |
| PUT | `/api/profile/wizard/step/:step` | JWT |
| POST | `/api/profile/photos` | JWT |
| DELETE | `/api/profile/photos/:publicId` | JWT |
| PATCH | `/api/profile/photos/:publicId/primary` | JWT |
| PATCH | `/api/profile/photos/:publicId/privacy` | JWT + Premium |
| POST | `/api/profile/jatakam/pdf` | JWT |

### Matches

| Method | Endpoint                          | Auth     |
| ------ | --------------------------------- | -------- |
| GET    | `/api/matches/browse`             | Optional |
| GET    | `/api/matches/daily`              | JWT      |
| GET    | `/api/matches/jatakam/:profileId` | JWT      |

**Browse filters**: `religion`, `caste`, `subCaste`, `region`, `district`, `city`, `state`, `country`, `isNRI`, `nriCountry`, `maritalStatus`, `mangalaDosham`, `motherTongue`, `ageMin`, `ageMax`, `gotram` (Premium), `sort`, `page`, `limit`

### Interests

| Method | Endpoint                     | Auth |
| ------ | ---------------------------- | ---- |
| POST   | `/api/interests/send`        | JWT  |
| PATCH  | `/api/interests/:id/respond` | JWT  |
| GET    | `/api/interests/inbox`       | JWT  |
| GET    | `/api/interests/sent`        | JWT  |
| GET    | `/api/interests/mutual`      | JWT  |

### Chat

| Method | Endpoint                        | Auth       |
| ------ | ------------------------------- | ---------- |
| GET    | `/api/chat/conversations`       | JWT        |
| GET    | `/api/chat/:partnerId/messages` | JWT + Gold |
| POST   | `/api/chat/:partnerId/messages` | JWT + Gold |
| DELETE | `/api/chat/messages/:messageId` | JWT        |

ad

### Payments

| Method | Endpoint                              | Auth      |
| ------ | ------------------------------------- | --------- |
| POST   | `/api/payments/razorpay/create-order` | JWT       |
| POST   | `/api/payments/razorpay/verify`       | JWT       |
| POST   | `/api/payments/stripe/create-session` | JWT       |
| POST   | `/api/payments/razorpay/webhook`      | Signature |
| POST   | `/api/payments/stripe/webhook`        | Signature |
| GET    | `/api/payments/history`               | JWT       |

### Admin

| Method | Endpoint                              | Role      |
| ------ | ------------------------------------- | --------- |
| GET    | `/api/admin/dashboard`                | Admin/Mod |
| GET    | `/api/admin/users`                    | Admin/Mod |
| PATCH  | `/api/admin/users/:id/suspend`        | Admin     |
| PATCH  | `/api/admin/users/:id/unsuspend`      | Admin     |
| PATCH  | `/api/admin/users/:id/verify-aadhaar` | Admin/Mod |
| PATCH  | `/api/admin/users/:id/feature`        | Admin/Mod |
| GET    | `/api/admin/photos/pending`           | Admin/Mod |
| PATCH  | `/api/admin/photos/approve`           | Admin/Mod |
| DELETE | `/api/admin/photos/reject`            | Admin/Mod |
| GET    | `/api/admin/reports`                  | Admin/Mod |
| PATCH  | `/api/admin/reports/:id/resolve`      | Admin/Mod |
| GET    | `/api/admin/payments`                 | Admin     |

### Reports

| Method | Endpoint       | Auth |
| ------ | -------------- | ---- |
| POST   | `/api/reports` | JWT  |

---

## Socket.IO

Connect with JWT:

```js
const socket = io("http://localhost:5000", { auth: { token: "your_jwt" } });
```

| Direction     | Event               | Payload                         |
| ------------- | ------------------- | ------------------------------- |
| Client→Server | `send_message`      | `{ receiverId, content }`       |
| Client→Server | `typing_start`      | `{ receiverId }`                |
| Client→Server | `typing_stop`       | `{ receiverId }`                |
| Client→Server | `mark_read`         | `{ conversationId }`            |
| Server→Client | `new_message`       | message object                  |
| Server→Client | `user_typing`       | `{ userId, typing }`            |
| Server→Client | `messages_read`     | `{ conversationId, readBy }`    |
| Server→Client | `new_interest`      | `{ from, interestId, message }` |
| Server→Client | `interest_response` | `{ interestId, status, from }`  |
| Server→Client | `user_online`       | `{ userId }`                    |
| Server→Client | `user_offline`      | `{ userId, lastSeen }`          |

---

## Folder Structure

```
src/
  config/       db.js, cloudinary.js
  controllers/  auth, profile, match, interest, chat, payment, admin, report
  middleware/   auth, errorHandler, rateLimiter, upload
  models/       User, Interest, Message, Payment, DailyMatch, Report
  routes/       one file per resource
  services/     cloudinaryService, jatakamService, otpService, emailService
  socket/       socketHandler.js
  jobs/         dailyMatchJob.js
  utils/        logger, jwt, AppError, apiResponse
```

---

## Premium Plan Gates

| Feature             | Free   | Silver | Gold   | Diamond |
| ------------------- | ------ | ------ | ------ | ------- |
| Browse              | 10/day | 50     | 100    | 200     |
| Daily matches       | 3      | 10     | 20     | 50      |
| Contact reveal      | 0      | 5/day  | 20/day | ∞       |
| Chat                | ✗      | ✗      | ✓      | ✓       |
| Photo privacy       | ✗      | ✓      | ✓      | ✓       |
| Gotram filter       | ✗      | ✓      | ✓      | ✓       |
| Full Jatakam report | ✗      | ✗      | ✓      | ✓       |
| NRI filter          | ✗      | ✗      | ✓      | ✓       |
