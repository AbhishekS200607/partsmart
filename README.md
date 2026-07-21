# PartSmart 🔧
### *Scratch. Win. Smile.*

A production-ready digital scratch card loyalty platform for automobile spare parts shops.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Node.js + Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (Admin only) |

---

## Quick Start

### 1. Clone & Install

```bash
cd partsmart
npm install
```

### 2. Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the **SQL Editor** and run the contents of `src/models/database.sql`
3. Copy your **Project URL** and **Service Role Key** from Project Settings → API

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
JWT_SECRET=your_random_32_char_secret
ADMIN_EMAIL=admin@yourshop.com
ADMIN_PASSWORD=YourSecurePassword
```

### 4. Create Admin Account

Run this in Supabase SQL Editor (replace values):

```sql
INSERT INTO admins (email, password_hash)
VALUES (
  'admin@partsmart.in',
  '$2a$10$...'  -- use bcrypt hash of your password
);
```

Or use this Node.js snippet to generate the hash:

```js
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('YourPassword', 10));
```

### 5. Start Server

```bash
npm start
# or for development:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Pages

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/scratch` | Customer scratch card flow |
| `/reward?invoice=INV-001` | Reward display page |
| `/claimed?invoice=INV-001` | Already claimed page |
| `/admin` | Admin dashboard (login required) |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | — | Admin login |
| POST | `/api/claim` | — | Submit invoice & get reward |
| GET | `/api/claim/:invoice` | — | Get claim by invoice |
| GET | `/api/rewards` | — | List all rewards |
| POST | `/api/rewards` | Admin | Add reward |
| PUT | `/api/rewards/:id` | Admin | Update reward |
| DELETE | `/api/rewards/:id` | Admin | Delete reward |
| GET | `/api/admin/dashboard` | Admin | Dashboard stats |
| GET | `/api/admin/claims` | Admin | Paginated claims |
| GET | `/api/admin/export` | Admin | Export CSV |
| GET | `/api/admin/settings` | Admin | Get settings |
| POST | `/api/admin/settings` | Admin | Update settings |
| POST | `/api/admin/claim-status` | Admin | Update claim status |

---

## Security Features

- ✅ Helmet.js secure headers
- ✅ CORS protection
- ✅ Rate limiting (5 claims/IP/15min, 5 logins/IP/hour)
- ✅ Input validation (express-validator)
- ✅ SQL injection protection (Supabase parameterized queries)
- ✅ XSS protection
- ✅ JWT authentication for admin
- ✅ bcrypt password hashing
- ✅ Unique invoice constraint (DB level)
- ✅ Server-side reward selection only
- ✅ Cryptographically secure randomness

---

## Deployment (Railway / Render / Fly.io)

1. Push code to GitHub
2. Connect repo to Railway/Render
3. Set all environment variables from `.env.example`
4. Deploy — done!

### Environment Variables Required in Production

```
PORT
NODE_ENV=production
SUPABASE_URL
SUPABASE_SERVICE_KEY
JWT_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
CORS_ORIGIN=https://yourdomain.com
```

---

## Project Structure

```
partsmart/
├── server.js                 # Express app entry
├── .env                      # Environment variables
├── src/
│   ├── config/
│   │   ├── env.js            # Config loader
│   │   └── supabase.js       # Supabase client
│   ├── controllers/
│   │   ├── claimController.js
│   │   ├── rewardController.js
│   │   └── adminController.js
│   ├── services/
│   │   ├── claimService.js
│   │   └── rewardService.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── claim.js
│   │   ├── reward.js
│   │   └── admin.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rateLimiter.js
│   │   ├── errorHandler.js
│   │   └── helmetConfig.js
│   ├── utils/
│   │   ├── randomReward.js
│   │   ├── validation.js
│   │   └── logger.js
│   └── models/
│       └── database.sql
└── public/
    ├── index.html
    ├── scratch.html
    ├── reward.html
    ├── claimed.html
    ├── admin.html
    ├── css/
    │   ├── style.css
    │   ├── landing.css
    │   ├── scratch.css
    │   ├── reward.css
    │   └── admin.css
    └── js/
        ├── utils.js
        ├── landing.js
        ├── scratch.js
        ├── reward.js
        └── admin.js
```

---

## License

MIT © 2024 PartSmart
