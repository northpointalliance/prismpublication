# AI Flow Network

A modern landing page website built with React, TypeScript, Vite, and shadcn/ui components.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Project Overview

### Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: React Router DOM
- **Data Fetching**: TanStack React Query
- **Database**: Supabase (Edge Functions)
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

### Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui component library
│   ├── Navbar.tsx       # Main navigation
│   ├── HeroSection.tsx  # Hero/landing section
│   ├── HowItWorksSection.tsx
│   ├── AudienceSection.tsx
│   ├── StatsSection.tsx
│   ├── FAQSection.tsx
│   ├── CTASection.tsx   # Call-to-action section
│   └── Footer.tsx
├── pages/               # Page components
│   ├── Index.tsx        # Home/landing page
│   ├── Demo.tsx         # Interactive product demo
│   └── NotFound.tsx     # 404 page
├── hooks/               # Custom React hooks
├── integrations/        # Third-party integrations
│   └── supabase/       # Supabase client & types
├── lib/                 # Utility functions
├── App.tsx              # Main app component with routing
├── main.tsx             # Entry point
└── index.css            # Global styles
```

### Components

The website consists of the following main sections:

1. **Navbar** - Top navigation with links to all sections
2. **HeroSection** - Hero banner with main headline and CTA
3. **HowItWorksSection** - Explains how the service works
4. **AudienceSection** - Target audience/who it's for
5. **StatsSection** - Key metrics and statistics
6. **FAQSection** - Frequently asked questions
7. **CTASection** - Final call-to-action
8. **Footer** - Footer with links and copyright

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### Tailwind Configuration

Tailwind is configured in:
- `tailwind.config.ts` - Main Tailwind configuration
- `postcss.config.js` - PostCSS configuration
- `src/index.css` - Global styles and custom CSS

### Supabase Integration

The project includes Supabase integration for backend functionality:
- Edge Functions in `supabase/functions/`
- Client configuration in `src/integrations/supabase/`
- Types in `src/integrations/supabase/types.ts`

## 🎨 Customization

### Adding New Components

Use the shadcn/ui CLI to add new components:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add card
```

### Modifying Styles

- Global styles: `src/index.css`
- Component-specific styles: Inline with Tailwind classes
- shadcn/ui components: `src/components/ui/`

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add a route in `src/App.tsx`:

```tsx
import NewPage from "./pages/NewPage";

// Add route:
<Route path="/new-page" element={<NewPage />} />
```

## 🧪 Testing

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

## 📦 Dependencies

### Core Dependencies
- react & react-dom
- react-router-dom
- @tanstack/react-query
- @supabase/supabase-js

### UI Components (shadcn/ui)
- @radix-ui/* (various components)
- lucide-react (icons)
- class-variance-authority
- tailwind-merge
- clsx

### Form & Validation
- react-hook-form
- @hookform/resolvers
- zod

### Development Dependencies
- vite
- typescript
- tailwindcss
- eslint
- vitest

## 🌐 Browser Support

The project uses modern browser features. For production, consider adding appropriate polyfills or use a tool like browserslist to manage browser compatibility.

## 📄 License

Private - All rights reserved

## 🆘 Support

For issues or questions, please refer to the project documentation or contact the development team.
