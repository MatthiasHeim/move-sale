# Umzugsbeute 📦

> **AI-Powered Moving Sale Marketplace** - A full-stack application helping a family moving from Müllheim to Hong Kong sell their household items with intelligent listing generation.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![OpenAI](https://img.shields.io/badge/OpenAI%20GPT--5-412991?style=flat&logo=openai&logoColor=white)](https://openai.com)

## 🌟 Features

### 🤖 AI-Powered Listing Generation
- **GPT-5 with Reasoning**: Advanced AI analyzes product images and generates engaging descriptions
- **Market Research Integration**: Automatic price research on Swiss marketplaces (Tutti, Ricardo, Anibis)
- **Storytelling Approach**: Personal narratives about the Hong Kong move to build trust and urgency
- **Multi-Platform Optimization**: Listings work perfectly on Tutti.ch and Facebook Marketplace

### 📸 Smart Image Processing
- **HEIC Support**: Automatic conversion of iPhone photos to web-optimized formats
- **Auto-Rotation**: Corrects image orientation using EXIF data
- **WebP Compression**: Optimized images for fast loading
- **Drag & Drop Upload**: Intuitive multi-file upload interface

### 🛒 Customer Experience
- **Mobile-First Design**: Optimized for Swiss mobile shoppers
- **Real-Time Reservations**: 48-hour reservation system with automatic expiry
- **Pickup Scheduling**: Integrated calendar for appointment booking
- **Multi-Language**: German (Swiss High German) interface

### 🔐 Admin Features
- **Session Authentication**: Secure admin panel for listing management
- **Product Management**: Create, edit, pin, and mark items as sold
- **AI Proposal System**: Review and publish AI-generated listings
- **Tutti Archive**: Generated listings ready for copy-paste to marketplaces

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast development
- **Shadcn/ui + Radix UI** for accessible components
- **Tailwind CSS** for styling
- **TanStack Query** for server state management
- **Wouter** for lightweight routing

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Session-based authentication** with PostgreSQL store
- **Multer** for file uploads
- **Sharp** for image processing

### AI & Storage
- **OpenAI GPT-5** with reasoning and market research
- **Supabase Storage** for image hosting
- **HEIC-Convert** for iPhone photo support

### Deployment
- **Vercel** for hosting
- **Neon** for PostgreSQL database
- **Environment-aware** configuration for serverless

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- OpenAI API key
- Supabase project for storage

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd umzugsbeute

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host/db"

# Authentication
SESSION_SECRET="your-session-secret"
ADMIN_PASS="your-admin-password"

# AI
OPENAI_API_KEY="sk-proj-..."

# Storage (Optional - for image uploads)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Server
PORT=5000
```

## 📱 Usage

### For Customers
1. **Browse Products**: View available furniture and household items
2. **Make Reservations**: Reserve items with pickup time selection
3. **Get Information**: Read FAQs about pickup, payment, and conditions

### For Admins
1. **Upload Images**: Drag and drop product photos (supports iPhone HEIC)
2. **AI Generation**: Let GPT-5 analyze images and create listings
3. **Review & Edit**: Modify AI suggestions before publishing
4. **Manage Sales**: Track reservations and mark items as sold
5. **Export Listings**: Copy generated Tutti/Facebook descriptions

## 🎯 AI Listing Generation Process

1. **Image Analysis**: GPT-5 analyzes uploaded photos to identify items
2. **Market Research**: Searches Swiss marketplaces for similar items
3. **Price Optimization**: Suggests competitive prices based on market data
4. **Storytelling**: Creates emotional narratives about the move to Hong Kong
5. **Multi-Platform**: Generates titles and descriptions for Tutti and Facebook

### Example Generated Listing

**Title**: `IKEA Kallax Regal weiß 4x4 Fächer`

**Description**:
> Da wir im November nach Hongkong umziehen, müssen wir schweren Herzens unser geliebtes IKEA Kallax Regal verkaufen. Es hat uns jahrelang treue Dienste geleistet und unsere Wohnung perfekt organisiert. Das Regal ist in sehr gutem Zustand und bietet enormen Stauraum für Bücher, Deko oder Ordner. Würden wir gerne behalten, aber der Umzug lässt uns keine Wahl. Abholung in Müllheim Dorf, Bezahlung bar oder TWINT. CHF 85.00

## 🏛️ Architecture

### Directory Structure
```
├── client/src/           # React frontend
│   ├── components/       # Reusable UI components
│   ├── pages/           # Route pages
│   └── lib/             # Utilities and hooks
├── server/              # Express.js backend
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database operations
│   └── auth.ts          # Authentication logic
├── shared/              # Shared TypeScript types
└── migrations/          # Database migrations
```

### Database Schema
- **Products**: Items with images, pricing, and availability
- **Reservations**: Customer bookings with expiry
- **FAQs**: Frequently asked questions
- **Product Texts**: Generated Tutti.ch listings
- **Drafts**: AI proposals before publishing

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production server
npm run check        # TypeScript type checking
npm run db:push      # Update database schema
```

### API Endpoints

#### Public
- `GET /api/products` - List available products
- `POST /api/reservations` - Create reservation
- `GET /api/faqs` - Customer FAQ

#### Admin (Authentication Required)
- `POST /api/upload` - Upload product images
- `POST /api/agent/draft` - Generate AI listing
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

## 🌍 Deployment

### Vercel Deployment
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Database Setup (Neon)
1. Create Neon project
2. Copy connection string to `DATABASE_URL`
3. Run `npm run db:push` to create tables

## 📄 License

MIT License - feel free to use this project as a template for your own moving sales or marketplace applications.

## 🤝 Contributing

This is a personal project for a family move, but the codebase serves as a great example of:
- AI-powered content generation
- Modern React/TypeScript patterns
- Serverless-ready architecture
- Image processing pipelines
- Multi-platform listing optimization

---

*Built with ❤️ for a smooth transition from Müllheim to Hong Kong*