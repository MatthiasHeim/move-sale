# MöbelMarkt - Furniture Rental Marketplace

## Overview

MöbelMarkt is a full-stack web application for a furniture rental marketplace. The application allows users to browse furniture, equipment, and decorative items by category, search through products, and make reservations for pickup. It features a modern mobile-first design with a German-language interface and includes an FAQ section for common customer questions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite for fast development and builds
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design system variables and mobile-first responsive design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful API with JSON responses and proper HTTP status codes
- **Error Handling**: Centralized error middleware with structured error responses
- **Logging**: Custom logging middleware for API request/response monitoring

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema**: Three main entities - products (furniture/equipment/decor), FAQs, and reservations
- **Migrations**: Drizzle Kit for database schema versioning and migrations
- **Connection**: Connection pooling with WebSocket support for serverless environments

### Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Security**: No complex authentication system implemented - appears to be a public-facing catalog

### Mobile-First Design Approach
- **Responsive Design**: Tailwind CSS breakpoints optimized for mobile devices
- **Touch Interactions**: Minimum 44px touch targets for better mobile usability
- **Performance**: Lazy loading for images and optimized asset delivery
- **User Experience**: Sticky headers, smooth scrolling, and mobile-optimized navigation

### Component Architecture
- **Design System**: Consistent spacing, typography, and color schemes using CSS custom properties
- **Reusable Components**: Product cards, category filters, FAQ accordions, and reservation modals
- **Accessibility**: Proper ARIA labels, semantic HTML, and keyboard navigation support
- **Internationalization**: German language interface with proper localization

### Data Flow Patterns
- **API Communication**: Centralized API client with error handling and credential management
- **Caching Strategy**: React Query for intelligent data fetching, caching, and background updates
- **Real-time Updates**: Periodic cleanup of expired reservations with interval-based processing
- **Form Validation**: Zod schemas shared between frontend and backend for consistent validation

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Database Driver**: @neondatabase/serverless for optimized serverless connections

### UI and Component Libraries
- **Radix UI**: Comprehensive set of accessible React components for complex interactions
- **Shadcn/ui**: Pre-built component library built on top of Radix UI with Tailwind styling
- **Lucide React**: Icon library for consistent iconography throughout the application

### Development and Build Tools
- **Vite**: Frontend build tool with hot module replacement and optimized production builds
- **TypeScript**: Static type checking for both frontend and backend code
- **ESBuild**: Fast JavaScript bundler for server-side code compilation
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens

### Form and Data Handling
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation for runtime type checking
- **TanStack Query**: Powerful data synchronization for React applications

### Development Environment
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Error Overlay**: Runtime error modal for better development experience
- **Source Maps**: Proper debugging support with trace mapping