# LabForge CTF

LabForge CTF is a local web-security training range inspired by OWASP AttackForge. It presents vulnerable web and API labs as a CTF-style experience with challenges, flags, scoring, progress tracking, and a leaderboard.

**Made by Yousif Wazni**

## Project layout

```text
labforge-ctf/
├── index.html              # Frontend shell
├── styles.css              # Dark operator-console theme
├── app.js                  # Challenge catalog and browser interactions
├── nginx.conf              # Static frontend and API reverse proxy
├── docker-compose.yml      # Web, API, and PostgreSQL services
├── backend/
│   ├── server.js           # Express API
│   ├── schema.sql          # PostgreSQL schema
│   ├── package.json        # API dependencies
│   └── Dockerfile          # API image
├── .env.example            # Safe configuration template
└── .gitignore
```

## Features

- English frontend with a dark CTF/operator-console style.
- Search and category filters for Web, API, Auth, and Advanced labs.
- Challenge modal with objectives, hints, flag validation, points, and solved state.
- Local progress stored in browser `localStorage` when running the frontend alone.
- Express API with registration, login, JWT authentication, challenge listing, flag submission, progress, and leaderboard endpoints.
- PostgreSQL persistence for users, challenges, and solved challenges.
- Docker Compose setup with Nginx in front of the API and database.
- Seed data covering SQL injection, XSS, IDOR, SSRF, JWT, path traversal, deserialization, business logic, DVWA, bWAPP, Mutillidae, Juice Shop, WebGoat, Tomcat, WrongSecrets, Security Shepherd, DVWS, ZeroHealth, and RESTaurant.

## Quick start: frontend only

This mode needs no Docker or Node.js:

```powershell
python -m http.server 5173 --directory .
```

Open <http://localhost:5173>.

Opening `index.html` directly also works, but API integration is available only through HTTP.

## Full local stack with Docker

Requirements:

- Docker Desktop with the Linux engine running.
- Docker Compose v2.

Create a local environment file from the safe template:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and replace `POSTGRES_PASSWORD` and `JWT_SECRET` with local values. The `.env` file is ignored by Git.

Start all services:

```powershell
docker compose up --build -d
```

Services:

- Frontend: <http://localhost:8080>
- API health check: <http://localhost:4000/api/health>
- PostgreSQL: private Docker network only

Check status and logs:

```powershell
docker compose ps
docker compose logs -f api
```

Stop the stack:

```powershell
docker compose down
```

Remove the local database volume too:

```powershell
docker compose down -v
```

## Real vulnerable lab stack

The `labs/` directory contains the actual web applications behind the challenge catalog. Start them separately from the platform API:

```powershell
docker compose -f labs/docker-compose.yml up --build -d
```

The real lab URLs and troubleshooting commands are documented in [labs/README.md](labs/README.md). Keep these intentionally vulnerable services on localhost only.

## API reference

All API routes are prefixed with `/api`.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | No | Service and database health check |
| GET | `/challenges` | No | List active challenges |
| POST | `/auth/register` | No | Create a user and return a JWT |
| POST | `/auth/login` | No | Authenticate and return a JWT |
| GET | `/me` | Bearer token | Return the current user |
| GET | `/me/progress` | Bearer token | Return solved challenges and score |
| POST | `/challenges/:id/submit` | Bearer token | Validate a flag and record a solve |
| GET | `/leaderboard` | No | Return the top 50 users |

Example registration request:

```json
{
  "username": "operator01",
  "email": "operator01@example.local",
  "password": "use-a-local-password"
}
```

## GitHub workflow

```powershell
git clone git@github.com:yousif-IQ/Lab.git
cd Lab
Copy-Item .env.example .env
docker compose up --build -d
```

Never commit `.env`, database dumps, real credentials, or production JWT secrets.

## Security notes

This repository is a deliberately vulnerable training project. Run it locally or inside an isolated lab network. Do not expose the challenge services to the public internet.

Before a public deployment:

1. Use strong secrets in the deployment environment.
2. Move challenge flags out of the static frontend and keep validation server-side.
3. Add rate limiting, email verification, password reset controls, and administrative authorization.
4. Add automated tests and CI checks.
5. Pin dependency versions and review image updates.

## License

No license file is included. The repository may be visible publicly on GitHub, but public visibility does not grant permission to copy, modify, or redistribute the code. Add an explicit open-source license if you want others to legally reuse it.
