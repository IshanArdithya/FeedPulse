# FeedPulse

FeedPulse is an AI-powered internal product feedback platform built with Next.js, Express, MongoDB, and Google Gemini. Teams can collect public feedback, analyze it with AI, and review everything from a protected admin dashboard.

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript, Mongoose, JWT
- Database: MongoDB
- AI: Google Gemini API
- Tooling: Jest, Docker, Docker Compose

## Project Structure

```text
feedpulse/
|-- frontend/
|-- backend/
|-- docker-compose.yml
|-- package.json
`-- README.md
```

## Environment Variables

Create a root `.env` file for Docker and local development. You can copy from `.env.example`.

Required values:

- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `GEMINI_API_KEY`

Optional values:

- `GEMINI_MODEL` defaults to `gemini-2.5-flash`
- `MONGO_URI` for non-Docker local backend usage
- `NEXT_PUBLIC_API_URL` for non-Docker local frontend usage

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create env files:

- root `.env`
- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env`

3. Start the app:

```bash
npm run dev
```

4. Open:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000/api/health`

## Run With Docker

Docker Compose starts the frontend, backend, and MongoDB with one command.

1. Create a root `.env` from `.env.example` and set at least:

```env
JWT_SECRET=replace-this-with-a-secure-value
ADMIN_EMAIL=admin@feedpulse.dev
ADMIN_PASSWORD=admin12345
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

2. Build and start everything:

```bash
docker compose up --build
```

3. Open:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/api/health`
- MongoDB: `mongodb://localhost:27017/feedpulse`

4. Stop containers:

```bash
docker compose down
```

5. Stop containers and remove database volume:

```bash
docker compose down -v
```

Notes:

- MongoDB runs inside Docker and persists data in the `mongo_data` volume.
- The frontend uses `http://localhost:4000/api` inside the browser so it can reach the backend from your host machine.
- Gemini only works if `GEMINI_API_KEY` has active quota for the configured model.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run test
docker compose up --build
```

## Screenshots


