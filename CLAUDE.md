# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload (runs both frontend and backend)
- `npm run build` - Build for production (frontend + backend bundling)
- `npm start` - Run production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes using Drizzle

## Project Architecture

This is a full-stack **furniture rental marketplace** called MöbelMarkt with a German interface. The application helps a family moving from Müllheim to Hong Kong sell their furniture and household items.

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Shadcn/ui + Radix UI + Tailwind CSS
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state
- **Authentication**: Session-based with PostgreSQL store

### Key Directory Structure
- `client/src/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types
- `attached_assets/` - Static assets
- `migrations/` - Database migration files

### Database Schema (shared/schema.ts)

**Core entities:**
- `products` - Furniture/equipment/decor items with images, pricing, availability
- `reservations` - Customer reservations with pickup times and status
- `faqs` - Frequently asked questions
- `productTexts` - Tutti.ch listing text generation
- `drafts` - AI-generated product proposals from images

### API Architecture

**Authentication endpoints:**
- `POST /api/auth/login` - Admin login with session creation
- `POST /api/auth/logout` - Session destruction
- `GET /api/auth/status` - Check authentication status

**Product management:**
- `GET /api/products` - Public product listing (available items only)
- `GET /api/admin/products` - Admin view (includes sold items)
- `POST /api/products` - Create product (admin auth required)
- `PATCH /api/products/:id` - Update product (admin auth required)
- `DELETE /api/products/:id` - Delete product (admin auth required)
- `POST /api/products/:id/mark-sold` - Mark as sold (admin auth required)
- `POST /api/products/:id/toggle-pin` - Pin/unpin product (admin auth required)

**File upload and AI:**
- `POST /api/upload` - Multi-file image upload with HEIC conversion and WebP optimization
- `POST /api/agent/draft` - AI product description generation using OpenAI GPT-4 Vision

**Customer features:**
- `POST /api/reservations` - Create product reservation
- `GET /api/pickup-times` - Available pickup time slots
- `GET /api/faqs` - Customer FAQ list

### Frontend Structure

**Pages:**
- `/` - Public product catalog with category filtering
- `/admin/login` - Admin authentication
- `/admin` - Admin dashboard with three tabs (Create Listing, My Products, Tutti Archive)

**Key components:**
- `CreateListingTab` - Drag-drop image upload + AI proposal generation
- `ProductsTab` - Admin product management interface
- `TuttiArchiveTab` - Generated Tutti.ch listings archive

### Authentication Flow

- Session-based authentication using `express-session` with PostgreSQL storage
- Admin password stored in `ADMIN_PASS` environment variable
- API token system for external integrations stored in `API_TOKEN`
- Sessions persist for 24 hours with secure HTTP-only cookies

### Image Processing Pipeline

1. **Upload**: Multi-file drag-and-drop with HEIC/JPEG/PNG support
2. **Processing**: HEIC→JPEG conversion, auto-rotation, resize to 1600px, WebP compression
3. **Storage**: Saved to both `/tmp/` (for AI processing) and `client/public/uploads/` (for web serving)
4. **Serving**: Static files served via Vite in dev, direct serving in production

### AI Integration

- **OpenAI GPT-4 Vision** for product description generation
- **Input**: Product images + optional text description
- **Output**: Structured JSON with German product details, pricing, Tutti.ch listings
- **Categories**: furniture, appliances, toys, electronics, decor, kitchen, sports, outdoor, kids_furniture, other
- **Conditions**: like new, very good, good, fair
- **Pricing**: Rounded to nearest 5 CHF

### Environment Variables Required

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `ADMIN_PASS` - Admin login password
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `PORT` - Server port (defaults to 5000)

### Development Notes

- **Mobile-first**: UI optimized for mobile with touch-friendly interactions
- **German language**: All user-facing text in German (Swiss High German)
- **Real-time cleanup**: Expired reservations cleaned every 5 minutes
- **Error handling**: Centralized error middleware with structured responses
- **Type safety**: Shared Zod schemas between frontend/backend for validation
- **Session-based auth**: No JWT tokens, uses traditional sessions for simplicity
- **Replit optimized**: Includes Replit-specific Vite plugins for development

### File Upload Constraints

- **Size limit**: 10MB per file, max 8 files per upload
- **Formats**: JPEG, PNG, HEIC, HEIF
- **Processing**: Auto-converts HEIC to JPEG, applies rotation, resizes, converts to WebP
- **Storage**: Dual storage for AI processing and web serving

### Business Logic

- **Reservations**: 48-hour expiration, automatic product unavailability marking
- **Categories**: Three main types (furniture, equipment, decor) plus extended AI categories
- **Pickup scheduling**: Mock business hours (Mon-Fri 17:00-19:00, Sat-Sun 10:00-16:00)
- **Pricing strategy**: Fair pricing with 5 CHF rounding for quick sale due to move