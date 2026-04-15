# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build            # Production build (standalone output)
npm run lint             # Run ESLint

# Testing
npm test                 # Run all tests once (vitest run)
npm run test:watch       # Run tests in watch mode
# Single test file: npx vitest run tests/gemini-text.test.ts
# Single test: npx vitest run -t "returns validated selling points"

# Database
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Create/run migrations

# Docker
docker compose up --build -d   # Dev with bind mounts
docker build -t amazon-selling-points .   # Production image
```

## Architecture

### Stack
- Next.js 16 + App Router + React 19 + TypeScript
- Tailwind CSS v4
- Prisma + SQLite
- Vitest for unit tests

### Key Patterns

**Service Layer**: Business logic lives in `services/`, not in API routes.
- `ProjectService` — CRUD and workspace hydration
- `GenerationService` — orchestrates copy and image generation, manages project status transitions
- `ExportService` — creates ZIP exports with images + metadata

**Provider Pattern**: AI calls are abstracted behind `TextProvider` and `ImageProvider` interfaces in `services/provider-types.ts`.
- `GeminiTextProvider` — calls Gemini JSON API for exactly 5 selling points. It wraps raw JSON arrays into `{ sellingPoints: [...] }` before Zod validation.
- `BananaImageProvider` — **despite the name, this now calls Gemini image generation** (`gemini-2.5-flash-image`) and saves base64 responses to `public/uploads/`. The provider value stored in DB is `"gemini"`.

**API Routes**: Thin wrappers around services. They parse inputs with Zod, instantiate the service, and return `apiSuccess` / `apiError` from `lib/api.ts`.

**Canvas UI**: `WorkspaceCanvas` renders a three-column node layout (input → selling points → images). On desktop it uses absolute positioning inside a large transform-scaled container; on mobile it falls back to a grid. Nodes can be dragged by their headers. Clicking generated images opens a lightbox.

### State Flow
1. `POST /api/projects/:id/generate-copy` — generates 5 selling points, saves them, sets project status to `copy_ready`
2. `POST /api/projects/:id/update-selling-point` — edits a selling point, marks its image as `failed` (stale), sets status `image_stale`
3. `POST /api/projects/:id/generate-images` — batch-generates images in chunks of 2, updates status to `images_ready` or `images_partial`
4. `POST /api/projects/:id/export` — returns a ZIP with all images and a JSON metadata file

### Localization
The entire UI and all backend error messages are in Chinese. Status enums are mapped to Chinese labels in `lib/i18n.ts`.

### Environment Variables
Copy `.env.example` to `.env.local` and fill in:
- `GEMINI_API_KEY` — required for both text and image generation
- `GEMINI_TEXT_MODEL` — defaults to `gemini-2.5-pro`
- `GEMINI_IMAGE_MODEL` — defaults to `gemini-2.5-flash-image`
- `DATABASE_URL` — e.g. `file:./dev.db`
- `APP_URL` — e.g. `http://localhost:3000`

`BANANAPRO_*` variables are present in the example but no longer used.

### Important File Locations
- `lib/schemas.ts` — Zod schemas for all API inputs
- `lib/prompts.ts` — LLM prompt builders
- `lib/env.ts` — env parsing with cache; use `resetEnvCache()` in tests
- `prisma/schema.prisma` — SQLite schema with `Project`, `SellingPoint`, `GeneratedImage`
- `public/uploads/` — runtime image storage (excluded from Git)
