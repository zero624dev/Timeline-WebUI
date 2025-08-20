# EventTime - Presence & Activity Tracking System

## Overview

EventTime is a Korean read-only web application that displays presence and activity tracking using a MongoDB database. The system tracks user status changes across web/desktop/mobile platforms using a 6-bit status format (00=offline, 01=away, 10=online, 11=do not disturb) and monitors activity start/end events. The application provides daily summaries showing time spent in different statuses and activities with a clean, responsive Korean interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript for REST API development
- **Database Layer**: Drizzle ORM for type-safe database operations
- **Storage**: Abstract storage interface with in-memory implementation (easily replaceable with database)
- **Middleware**: Express middleware for JSON parsing, URL encoding, and request logging
- **Error Handling**: Centralized error handling middleware for consistent API responses

### Data Storage
- **Database**: MongoDB Atlas for production use with real presence tracking data
- **ORM**: Mongoose for MongoDB operations with schema validation
- **Connection**: MongoDB Atlas serverless connection with 61,249+ presence documents
- **Current Implementation**: Real MongoDB data for user ID "532239959281893397" with data from 2023-2025
- **Target Date**: August 17, 2025 (where actual presence data exists)

### Database Schema
- **Presence Collection**: Stores user status changes with 6-bit status encoding, timestamps, and activity arrays
- **Status Format**: 6-bit encoding for web/desktop/mobile platforms (2 bits each: 00=offline, 01=away, 10=online, 11=do not disturb)
- **Activities**: Array of current activities with name, state, and timestamps
- **Schema Validation**: Mongoose schemas with TypeScript interfaces for type safety

### Authentication & Authorization
- Currently not implemented, ready for future enhancement with session-based or JWT authentication

### API Design
- **Read-Only Endpoints**: GET-only API for presence data retrieval
- **Presence Management**: 
  - GET /api/presences - Retrieve all presence data
  - GET /api/presences/date/:date - Get presence data by specific date
  - GET /api/presences/user/:userId - Get presence data for specific user
  - GET /api/timeline - Get processed timeline with status/activity changes
  - GET /api/timeline/:userId - Get user-specific timeline data
- **Response Format**: Consistent JSON responses with MongoDB data
- **Request Logging**: Automatic logging with timing and document counts

### Development Features
- **Hot Reload**: Vite development server with HMR for rapid development
- **Error Overlay**: Runtime error modal for better debugging experience
- **Type Checking**: Full TypeScript coverage across frontend, backend, and shared schemas
- **Code Organization**: Modular architecture with shared types between client and server

## External Dependencies

### Database Services
- **MongoDB Atlas**: Cloud-hosted MongoDB with serverless connection pooling
- **Mongoose**: MongoDB ODM for Node.js with schema validation and TypeScript support
- **Real Data**: 61,249+ presence documents spanning from 2023 to 2025

### UI Libraries
- **Radix UI**: Comprehensive set of accessible React components including dialogs, dropdowns, forms, and navigation
- **Lucide React**: Modern icon library with consistent design
- **Tailwind CSS**: Utility-first CSS framework for styling
- **class-variance-authority**: Utility for creating variant-based component APIs

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking and enhanced development experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

### Form & Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Schema validation library for runtime type checking
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### State Management
- **TanStack Query**: Server state management with caching, background updates, and error handling
- **Wouter**: Lightweight routing library for single-page applications

### Date Handling
- **date-fns**: Modern JavaScript date utility library with locale support
- **date-fns/locale**: Korean locale support for internationalization

### Utilities
- **clsx**: Utility for constructing className strings conditionally
- **tailwind-merge**: Utility for merging Tailwind CSS classes efficiently
- **nanoid**: URL-safe unique string ID generator