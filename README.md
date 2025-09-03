# TypeScript Node.js Authentication & User Management API

A scalable RESTful API built with TypeScript, Express.js, and MongoDB, providing robust authentication, user management, and security features. The project supports both traditional email/password and Google OAuth authentication, with modular architecture and professional error handling.

## Features

- **User Signup & Login** (Email/Password & Google OAuth)
- **Email Confirmation** with OTP
- **Password Reset** (OTP-based)
- **JWT Authentication** (Access & Refresh Tokens)
- **Rate Limiting & Security Headers**
- **Centralized Error Handling**
- **Modular Service & Repository Layers**
- **MongoDB Integration** via Mongoose

## Tech Stack

- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT, Google OAuth2
- **Validation:** Zod
- **Security:** Helmet, Rate Limiting

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB instance (local or Atlas)
- Google OAuth2 credentials (for Gmail login)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <(https://github.com/Ziad7Ahmed7/Social-App)>
   cd TS APP
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.development` to `.env` or edit as needed.
   - Set your MongoDB URI, JWT secrets, and Google OAuth client IDs.

4. **Run the server:**
   ```bash
   npm run start:dev
   ```
   The server will start on the port specified in your `.env` file (default: 3000).

### API Endpoints

#### Auth

- `POST /auth/signup` — Register a new user
- `POST /auth/login` — Login with email and password
- `POST /auth/signup-gmail` — Signup with Google
- `POST /auth/login-gmail` — Login with Google
- `POST /auth/confirm-email` — Confirm email with OTP
- `POST /auth/send-forgot-code` — Send password reset OTP
- `POST /auth/verify-forgot-password` — Verify OTP for password reset
- `POST /auth/reset-forgot-password` — Reset password

#### User

- `GET /user/profile` — Get user profile (requires JWT)
- `POST /user/logout` — Logout (invalidate token)
- `POST /user/refresh-token` — Refresh JWT

### Project Structure

```
src/
  moduels/
    auth/
    user/
  DB/
  middleware/
  utils/
  app.controller.ts
  index.ts
config/
  .env.development
```

### Environment Variables

See `config/.env.development` for all required variables:
- `PORT`
- `DB_URI`
- `ACCESS_USER_TOKEN_SIGNATURE`
- `REFRESH_USER_TOKEN_SIGNATURE`
- `WEB_CLIENT_IDS`
- etc.

### Running Frontend (Angular)

If you want to run the Angular frontend (`FE_Angular`), follow its own `README.md` or run:
```bash
cd FE_Angular
npm install
ng serve
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

[MIT](LICENSE)
