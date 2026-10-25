# bit-alumni-connect
A centralized and modular Alumni Management System for Bannari Amman Institute of Technology (BIT).

---

## Architecture Overview

```text
+------------------------+        HTTPS / REST API        +-------------------------------+        JDBC (TLS)        +--------------------------+
|     Vercel (Edge)      |  --------------------------->  |     Render (Web Service)      |  --------------------->  |       Neon Postgres      |
|  React 18 + Vite (SPA) |                                | Spring Boot 3.4 (Java 21 JRE) |                          |   Serverless PostgreSQL  |
|   Tailwind CSS + Lucide|                                | Docker (Low Memory Profile)   |                          |     Pooled Connection    |
+------------------------+                                +-------------------------------+                          +--------------------------+
```

1. **Frontend (Vercel)**: Single Page Application (SPA) built with React and Vite. Requests to client-side routes are rewritten to `/index.html` via `vercel.json`.
2. **Backend (Render)**: Multi-stage Dockerized Spring Boot web service running on Java 21 Eclipse Temurin with active profile `prod`. Tuned for 512 MB memory footprints (`-XX:+UseSerialGC -Xmx320m -XX:MaxMetaspaceSize=128m`).
3. **Database (Neon)**: Cloud-native serverless PostgreSQL instance with auto-scaling storage and SSL enforcement.

---

## Production Deployment Guide

### 1. Database Setup (Neon)
1. Create a PostgreSQL project on [Neon Console](https://console.neon.tech).
2. Obtain your pooled connection string: `postgres://<username>:<password>@<ep-pooler>.neon.tech/<dbname>?sslmode=require`.
3. Format as a Spring JDBC URL:
   `jdbc:postgresql://<ep-pooler>.neon.tech/<dbname>?sslmode=require`

---

### 2. Backend Deployment (Render)
1. In [Render Dashboard](https://dashboard.render.com), create a new **Web Service**.
2. Connect your repository and select **Docker** environment (or set Root Directory to `backend` with `backend/Dockerfile`).
3. Configure the following environment variables:

| Environment Variable | Required | Description | Example / Format |
|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | Yes | Activates production configuration | `prod` |
| `DB_URL` | Yes | JDBC connection string to Neon Postgres | `jdbc:postgresql://<host>/<db>?sslmode=require` |
| `DB_USERNAME` | Yes | Database username | `neondb_owner` |
| `DB_PASSWORD` | Yes | Database password | `<YOUR_NEON_PASSWORD>` |
| `JWT_SECRET` | Yes | Cryptographic HMAC-SHA256 signing secret (min 32 bytes) | Generated base64 string |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated list of permitted frontend origins | `https://your-frontend.vercel.app` |
| `FRONTEND_URL` | Yes | Canonical URL of the production web app | `https://your-frontend.vercel.app` |
| `SEED_ADMIN_PASSWORD` | Optional | If set, seeds `admin@bitsathy.ac.in` with this password | Strong random password |
| `SEED_ALUMNI_PASSWORD` | Optional | If set, seeds demo alumnus `alumni@bitsathy.ac.in` | Strong random password |
| `SEED_WATCHMAN_PASSWORD`| Optional | If set, seeds `watchman@bitsathy.ac.in` | Strong random password |
| `SEED_FACULTY_PASSWORD` | Optional | If set, seeds `faculty.it@bitsathy.ac.in` | Strong random password |
| `SEED_STUDENT_PASSWORD` | Optional | If set, seeds demo student `student@bitsathy.ac.in` | Strong random password |

> [!NOTE]
> **Free Tier Sleep Behavior**: Render free web services automatically spin down after 15 minutes of inactivity. When a request arrives, the instance wakes up automatically (cold start takes approximately 50-60 seconds). Subsequent requests respond with sub-second latency.

#### Generating a Strong JWT Secret
Run the following command in terminal to generate a secure 48-byte base64-encoded key:
```bash
openssl rand -base64 48
```

---

### 3. Frontend Deployment (Vercel)
1. Import the repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Configure Environment Variables:

| Environment Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_URL` | Yes | Base URL pointing to Render backend API v1 | `https://your-backend.onrender.com/api/v1` |

4. Deploy. The `frontend/vercel.json` rewrite configuration ensures deep routes (e.g., `/alumni/profile`, `/login`) resolve seamlessly on refresh without 404 errors.
