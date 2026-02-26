# AI Flow Network - Deep Dive Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack Deep Dive](#technology-stack-deep-dive)
3. [Project Structure Explained](#project-structure-explained)
4. [Component System](#component-system)
5. [Styling & Theming](#styling--theming)
6. [State Management & Data Fetching](#state-management--data-fetching)
7. [Backend Integration (Supabase)](#backend-integration-supabase)
8. [Routing & Navigation](#routing--navigation)
9. [Build & Deployment](#build--deployment)
10. [Development Workflow](#development-workflow)
11. [Troubleshooting & Best Practices](#troubleshooting--best-practices)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   React     │  │   Vite      │  │  TanStack Query │   │
│  │   App       │  │   (Dev)     │  │  (Cache)        │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     Supabase (Backend)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  Database   │  │  Auth       │  │  Edge Functions │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Application Flow

1. **User Request** → React Router intercepts the URL
2. **Route Matching** → Determines which page component to render
3. **Data Fetching** → TanStack Query fetches data from Supabase
4. **Rendering** → React components render with fetched data
5. **Interactivity** → User actions trigger state updates or API calls

---

## Technology Stack Deep Dive

### React 18 with TypeScript

The application uses React 18's concurrent features and TypeScript for type safety.

**Key Features Used:**
- JSX syntax for component templating
- Functional components with hooks
- TypeScript interfaces for props and state

**Example Component with Types:**

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'default', 
  size = 'default', 
  className,
  children, 
  ...props 
}) => {
  return (
    <button 
      className={cn(btnVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Vite 5 - Build Tool

Vite provides lightning-fast development experience with:

- **Hot Module Replacement (HMR)** - Instant updates without page reload
- **ES Modules** - Native browser ES module support
- **Rollup** - Optimized production builds
- **Plugins** - SWC for fast TypeScript compilation

**Vite Configuration (`vite.config.ts`):**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: "::",
    port: 8080,
    open: true,
  },
});
```

### Tailwind CSS - Styling

Tailwind CSS provides utility-first styling:

**Utility Classes Example:**

```html
<!-- Padding -->
<div class="p-4">    <!-- padding: 1rem -->
<div class="px-6">   <!-- padding-left/right: 1.5rem -->
<div class="py-8">  <!-- padding-top/bottom: 2rem -->

<!-- Margin -->
<div class="m-auto">   <!-- margin: auto -->
<div class="mx-auto">  <!-- margin-left/right: auto -->

<!-- Flexbox -->
<div class="flex items-center justify-between">
<div class="flex flex-col gap-4">

<!-- Colors -->
<div class="bg-primary text-primary-foreground">
<div class="text-muted-foreground">
```

### shadcn/ui - Component Library

shadcn/ui is NOT a typical component library. Instead:

1. **Copy-Paste** - Components are copied into your project
2. **Full Control** - You own the code, can modify anything
3. **Radix UI** - Uses Radix primitives for accessibility
4. **Tailwind** - Styled with Tailwind CSS
5. **clsx & tailwind-merge** - For conditional class merging

**Component File Structure:**

```
src/components/ui/
├── button.tsx          # Button component
├── dialog.tsx          # Modal/dialog
├── dropdown-menu.tsx   # Dropdown menus
├── accordion.tsx       # FAQ sections
├── card.tsx            # Card containers
└── ...                 # Many more UI components
```

---

## Project Structure Explained

### Root Directory Files

| File | Purpose |
|------|---------|
| `package.json` | NPM dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `vite.config.ts` | Vite build configuration |
| `tailwind.config.ts` | Tailwind CSS customization |
| `postcss.config.js` | PostCSS (Tailwind) config |
| `eslint.config.js` | Code linting rules |
| `index.html` | Entry HTML file |
| `.env` | Environment variables |

### Source Directory (`src/`)

```
src/
├── main.tsx                 # Application entry point
├── App.tsx                  # Root component with routing
├── App.css                  # App-level styles
├── index.css               # Global styles + Tailwind
├── vite-env.d.ts           # Vite type declarations
│
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── accordion.tsx
│   │   └── ... (50+ components)
│   │
│   ├── Navbar.tsx         # Navigation component
│   ├── NavLink.tsx        # Navigation link component
│   ├── HeroSection.tsx    # Hero/landing section
│   ├── HowItWorksSection.tsx
│   ├── AudienceSection.tsx
│   ├── StatsSection.tsx
│   ├── FAQSection.tsx
│   ├── CTASection.tsx
│   └── Footer.tsx
│
├── pages/                 # Page components
│   ├── Index.tsx          # Home page
│   ├── Demo.tsx           # Interactive demo page
│   └── NotFound.tsx       # 404 page
│
├── hooks/                 # Custom React hooks
│   ├── use-mobile.tsx     # Mobile detection hook
│   └── use-toast.ts      # Toast notification hook
│
├── integrations/          # Third-party integrations
│   └── supabase/
│       ├── client.ts      # Supabase client instance
│       └── types.ts       # Database type definitions
│
└── lib/                   # Utility functions
    └── utils.ts           # cn() helper function
```

### Entry Point Flow

**`index.html`** → References `src/main.tsx`

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BotGrid - AI Ad Network</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**`src/main.tsx`** → Renders the App

```tsx
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

**`src/App.tsx`** → Sets up providers and routing

```tsx
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
```

---

## Component System

### Page Components

#### Index.tsx - Main Landing Page

The home page composes multiple sections:

```tsx
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only...">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <HowItWorksSection />
        <AudienceSection />
        <StatsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};
```

#### NotFound.tsx - 404 Page

```tsx
const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1>404 - Page Not Found</h1>
    </div>
  );
};
```

### Section Components

#### Navbar.tsx - Navigation

**Features:**
- Responsive design with mobile hamburger menu
- Glass morphism effect (blur backdrop)
- Keyboard accessible
- ARIA labels for screen readers

**Structure:**
- Logo (links to home)
- Desktop navigation links (hidden on mobile)
- Desktop action buttons (Sign In, Get Started)
- Mobile menu (toggleable)

**State:**
```tsx
const [mobileOpen, setMobileOpen] = useState(false);
```

#### HeroSection.tsx - Hero Banner

**Visual Elements:**
- Grid pattern background
- Animated glow orbs (pulse animation)
- Gradient text
- Live statistics counter

**Animations:**
- `animate-fade-up` - Staggered text reveal
- `animate-pulse-glow` - Ambient background glow
- `text-gradient-primary` - Gradient text effect

**Structure:**
- Badge/announcement
- Main headline (h1)
- Subheadline paragraph
- CTA buttons (2 variants)
- Statistics counter (3 stats)

#### Other Sections

| Component | Purpose |
|-----------|---------|
| `HowItWorksSection.tsx` | Explains the platform's functionality |
| `AudienceSection.tsx` | Target audience (publishers/advertisers) |
| `StatsSection.tsx` | Network statistics and metrics |
| `FAQSection.tsx` | Accordion FAQ |
| `CTASection.tsx` | Final call-to-action |
| `Footer.tsx` | Links, copyright, social |

### UI Components (shadcn/ui)

The project includes 50+ UI components in `src/components/ui/`:

**Common Components:**
- `button.tsx` - Button with variants
- `card.tsx` - Card container
- `accordion.tsx` - Collapsible content
- `dialog.tsx` - Modal dialog
- `dropdown-menu.tsx` - Dropdown menus
- `tabs.tsx` - Tab navigation
- `input.tsx` - Text input
- `textarea.tsx` - Multi-line input
- `label.tsx` - Form labels
- `checkbox.tsx` - Checkbox

**Feedback Components:**
- `toast.tsx` - Toast notifications
- `toaster.tsx` - Toast container
- `sonner.tsx` - Alternative toast (Sonner)
- `alert.tsx` - Alert messages
- `progress.tsx` - Progress bar

**Layout Components:**
- `sheet.tsx` - Slide-out panel
- `drawer.tsx` - Drawer (mobile menu)
- `resizable.tsx` - Resizable panels
- `scroll-area.tsx` - Custom scrollbar
- `separator.tsx` - Visual separator
- `aspect-ratio.tsx` - Aspect ratio container

**Navigation Components:**
- `navigation-menu.tsx` - Navigation menu
- `breadcrumb.tsx` - Breadcrumbs
- `pagination.tsx` - Page numbers
- `menubar.tsx` - Menu bar

**Form Components:**
- `form.tsx` - Form wrapper
- `select.tsx` - Dropdown select
- `radio-group.tsx` - Radio buttons
- `switch.tsx` - Toggle switch
- `slider.tsx` - Range slider
- `toggle.tsx` - Toggle button

**Data Display:**
- `table.tsx` - Data table
- `avatar.tsx` - User avatar
- `badge.tsx` - Status badge
- `skeleton.tsx` - Loading placeholder
- `hover-card.tsx` - Hover reveal card

**Chart Components:**
- `chart.tsx` - Recharts integration

---

## Styling & Theming

### CSS Variables (Design Tokens)

The design system uses CSS custom properties (variables) defined in `src/index.css`:

```css
@layer base {
  :root {
    /* Colors */
    --background: 210 20% 98%;
    --foreground: 222 47% 11%;
    
    --primary: 199 89% 38%;
    --primary-foreground: 0 0% 100%;
    
    --secondary: 210 20% 94%;
    --secondary-foreground: 222 47% 15%;
    
    --muted: 210 15% 93%;
    --muted-foreground: 215 16% 42%;
    
    --accent: 199 89% 38%;
    --accent-foreground: 0 0% 100%;
    
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    
    --border: 214 20% 88%;
    --input: 214 20% 88%;
    --ring: 199 89% 38%;
    
    /* Border Radius */
    --radius: 0.75rem;
    
    /* Custom */
    --glow-primary: 199 89% 38%;
    --glow-secondary: 260 60% 50%;
    --surface-glass: 210 20% 97%;
  }
}
```

### Using Variables in Components

```tsx
// Using Tailwind's hsl() function
<div className="bg-primary text-primary-foreground">
  This uses --primary and --primary-foreground
</div>

// Using CSS variables directly
<div style={{ 
  backgroundColor: `hsl(var(--primary))`,
  color: `hsl(var(--primary-foreground))`
}}>
  Custom styling
</div>
```

### Custom Utility Classes

```css
@layer utilities {
  /* Gradient Text */
  .text-gradient-primary {
    @apply bg-clip-text text-transparent;
    background-image: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--glow-secondary)));
  }
  
  /* Glow Effect */
  .glow-primary {
    box-shadow: 0 0 40px -10px hsl(var(--glow-primary) / 0.25),
                0 0 80px -20px hsl(var(--glow-primary) / 0.1);
  }
  
  /* Glass Effect */
  .glass {
    @apply backdrop-blur-xl;
    background: hsl(var(--surface-glass) / 0.85);
    border-bottom: 1px solid hsl(var(--border));
  }
  
  /* Grid Pattern */
  .grid-pattern {
    background-image: 
      linear-gradient(hsl(var(--border) / 0.5) 1px, transparent 1px),
      linear-gradient(90deg, hsl(var(--border) / 0.5) 1px, transparent 1px);
    background-size: 60px 60px;
  }
}
```

### Custom Animations

```css
/* Float Animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

/* Fade Up Animation */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-up {
  animation: fade-up 0.8s ease-out forwards;
}

.animate-fade-up-delay-1 { animation-delay: 0.15s; }
.animate-fade-up-delay-2 { animation-delay: 0.3s; }
.animate-fade-up-delay-3 { animation-delay: 0.45s; }
```

### Tailwind Configuration

The Tailwind config extends the default theme:

```typescript
// tailwind.config.ts
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... more colors
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

---

## State Management & Data Fetching

### TanStack Query (React Query)

TanStack Query handles server state management:

```tsx
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users').then(res => res.json()),
});

// Mutations
const mutation = useMutation({
  mutationFn: (newUser) => 
    fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser),
    }),
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

### React Hook Form

For form handling:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginForm = () => {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('email')} />
      <input type="password" {...form.register('password')} />
      <button type="submit">Submit</button>
    </form>
  );
};
```

### Local Component State

```tsx
const Component = () => {
  // useState for local state
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  
  // useState with complex initial value
  const [user, setUser] = useState<User | null>(null);
  
  // useState with function (lazy initialization)
  const [data] = useState(() => expensiveComputation());
  
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
};
```

---

## Backend Integration (Supabase)

### Supabase Client

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Using Supabase in Components

```tsx
import { supabase } from '@/integrations/supabase/client';

const MyComponent = () => {
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('column', 'value');
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Data:', data);
    }
  };

  return <button onClick={fetchData}>Fetch Data</button>;
};
```

### Common Supabase Operations

```tsx
// SELECT
const { data } = await supabase.from('users').select('*');

// INSERT
const { data, error } = await supabase
  .from('users')
  .insert([{ name: 'John', email: 'john@example.com' }]);

// UPDATE
const { data, error } = await supabase
  .from('users')
  .update({ name: 'Jane' })
  .eq('id', 1);

// DELETE
const { error } = await supabase
  .from('users')
  .delete()
  .eq('id', 1);

// Authentication
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

await supabase.auth.signOut();
```

### Edge Functions

The project includes Supabase Edge Functions in `supabase/functions/`:

```
supabase/functions/
└── query-fan-out/
    └── index.ts      # Edge function handler
```

---

## Routing & Navigation

### React Router Setup

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);
```

### Navigation Components

```tsx
import { Link, NavLink } from 'react-router-dom';

// Standard link
<Link to="/about">About</Link>

// NavLink (can style active state)
<NavLink 
  to="/about" 
  className={({ isActive }) => isActive ? 'active' : ''}
>
  About
</NavLink>

// External link
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  External
</a>
```

### Anchor Navigation (Same Page)

```tsx
// Scroll to section
<a href="#section-id">Go to Section</a>

// Or with Link
<Link to="/#section-id">Go to Section</Link>

// In the target section
<section id="section-id">
  Content
</section>
```

---

## Build & Deployment

### Development

```bash
npm run dev
# Starts Vite dev server at http://localhost:5173
# Features: Hot Module Replacement, fast refresh
```

### Production Build

```bash
npm run build
# Creates optimized build in /dist folder
# Uses Rollup for bundling
# Minifies and tree-shakes code
```

### Preview Production Build

```bash
npm run preview
# Serves the production build locally
# Useful for testing before deployment
```

### Linting

```bash
npm run lint
# Runs ESLint to check code quality
# Enforces coding standards
```

### Testing

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## Development Workflow

### Adding a New Component

**Option 1: Using shadcn/ui CLI**

```bash
npx shadcn@latest add button
# This adds button.tsx to src/components/ui/
# Also adds the component to components.json
```

**Option 2: Manual Creation**

```tsx
// src/components/ui/new-component.tsx
import * as React from "react";

export interface NewComponentProps {
  children?: React.ReactNode;
}

export function NewComponent({ children }: NewComponentProps) {
  return <div>{children}</div>;
}
```

### Adding a New Page

1. Create the page component:

```tsx
// src/pages/About.tsx
const About = () => {
  return (
    <div>
      <h1>About Us</h1>
      <p>Welcome to our about page!</p>
    </div>
  );
};

export default About;
```

2. Add the route:

```tsx
// src/App.tsx
import About from "./pages/About";

// In Routes:
<Route path="/about" element={<About />} />
```

### Modifying the Theme

**To change colors:**

```css
/* src/index.css */
@layer base {
  :root {
    --primary: 199 89% 38%;  /* Change this Hue/Sat/Lightness */
    --primary-foreground: 0 0% 100%;
  }
}
```

**To add new colors:**

```css
/* src/index.css */
@layer base {
  :root {
    --new-color: 200 50% 50%;
  }
}
```

```typescript
// tailwind.config.ts
extend: {
  colors: {
    'new-color': 'hsl(var(--new-color))',
  }
}
```

---

## Troubleshooting & Best Practices

### Common Issues

**1. Port Already in Use**

```bash
# Find and kill process on port
lsof -ti:3000 | xargs kill -9
# Or let Vite use next available port
npm run dev -- --port 3001
```

**2. TypeScript Errors**

```bash
# Regenerate TypeScript cache
rm -rf node_modules/.cache
rm -rf tsconfig.tsbuildinfo
```

**3. Tailwind Not Updating**

```bash
# Clear Vite cache
rm -rf node_modules/.vite
```

**4. Missing Dependencies**

```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

### Best Practices

1. **Use TypeScript** - Always define types for props and state
2. **Component Organization** - Keep related files together
3. **Reusable Components** - Extract common patterns
4. **Lazy Loading** - Use `React.lazy()` for large components
5. **Environment Variables** - Never commit secrets to git
6. **Code Splitting** - Only import what you need

### Performance Tips

```tsx
// Lazy load pages
const About = React.lazy(() => import('./pages/About'));

// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data.map(item => <Item key={item.id} {...item} />)}</div>;
});

// Virtualize long lists
// Use libraries like @tanstack/react-virtual
```

### Accessibility Checklist

- [ ] Use semantic HTML (`<nav>`, `<main>`, `<section>`)
- [ ] Add `aria-label` to interactive elements
- [ ] Ensure color contrast meets WCAG AA
- [ ] Support keyboard navigation
- [ ] Add focus indicators
- [ ] Use `alt` text for images

---

## Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query)
- [React Router](https://reactrouter.com)

---

*This documentation was auto-generated for the AI Flow Network project.*
