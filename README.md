# Amazon Main Image Studio

Single-page canvas workspace for generating Amazon product main images, selling-point copy, and exportable assets.

中文版本见 [README.zh-CN.md](./README.zh-CN.md)。

## Stack

- Next.js 16 + App Router
- TypeScript
- Tailwind CSS v4
- Prisma + SQLite
- Zod
- Vitest

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy envs:

```bash
cp .env.example .env.local
```

3. Generate Prisma client and create the local database:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Start the app:

```bash
npm run dev
```

## Core routes

- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `POST /api/projects/:id/generate-copy`
- `POST /api/projects/:id/update-selling-point`
- `POST /api/projects/:id/generate-images`
- `POST /api/projects/:id/regenerate-image`
- `POST /api/projects/:id/export`
- `POST /api/uploads`

## Notes

- The workspace is a full-canvas page with input, copy, and output zones.
- The text generation provider expects a JSON-only response with exactly 5 selling points.
- The image generation provider supports direct image responses or submit-and-poll style providers.
- Runtime uploads and export artifacts are excluded from Git.

## Docker

Development with bind mounts:

```bash
docker compose up --build
```

Production image:

```bash
docker build -t amazon-selling-points .
docker run --rm -p 3000:3000 --env-file .env.local amazon-selling-points
```
