# Frontend AGENTS.md

This document provides guidelines and instructions for AI agents working on the frontend codebase.

---

## 1. Project Overview

**Project Name:** SignSystem Frontend

**Description:** A React-based frontend for the SignSystem application, which manages document signing workflows. The frontend provides user authentication, document listing, viewing, and signing capabilities.

**Tech Stack:**
- **Framework:** React 19.2.4 with Vite 7.3.1
- **Routing:** React Router DOM 7.13.0
- **Styling:** Tailwind CSS 4.1.18
- **UI Utilities:** 
  - `clsx` (^2.1.1) - Conditional class names
  - `tailwind-merge` (^3.4.0) - Tailwind class merging
  - `lucide-react` (^0.563.0) - Icon library

**Key Features:**
- User authentication (login page)
- Document listing with pending/signed tabs
- Document viewing and signing workflow
- Responsive design with mobile support
- Spanish localization (UI text in Spanish)

**Directory Structure:**
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/          # Reusable UI components (Button, Input, Card)
│   │   ├── DocumentCard.jsx
│   │   ├── Layout.jsx
│   │   └── SignatureModal.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── DocumentList.jsx
│   │   └── DocumentViewer.jsx
│   ├── utils/
│   │   └── cn.js         # Class name utility
│   ├── App.jsx           # Main app component with routes
│   └── main.jsx          # Entry point
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

**Path Alias:**
- `@` is aliased to `./src` (configured in `vite.config.js`)
- Use `@/components/ui/Button` instead of `../../components/ui/Button`

---

## 2. Build and Test Commands

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint with strict warnings |

### Build Command

```bash
# Build for production
npm run build
```

The build output will be in the `dist/` directory.

### Development Command

```bash
# Start development server (default port 5173)
npm run dev
```

### Linting Command

```bash
# Run ESLint with strict mode
npm run lint
```

This project uses ESLint with:
- `eslint-plugin-react-hooks` for React hooks rules
- `eslint-plugin-react-refresh` for HMR compatibility
- Maximum warnings set to 0

---

## 3. Code Style Guidelines

### Imports

**Order:**
1. React imports
2. Third-party library imports
3. Path alias imports (`@/...`)
4. Relative imports (`./`, `../`)

**Example:**
```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { Lock, Mail } from 'lucide-react';
import Layout from '../components/Layout';
```

**Rules:**
- Use absolute imports with `@` alias for src files
- Use named imports for UI components
- Group imports by type with blank lines between groups
- Sort imports alphabetically within each group

### Formatting

**Line Length:** Maximum 100 characters per line

**Indentation:** 4 spaces (not tabs)

**Spacing:**
- Use single quotes for strings: `'text'`
- No spaces before parentheses: `functionName()` not `functionName ()`
- Spaces around operators: `a + b` not `a+b`
- No trailing commas in object literals

**Example:**
```jsx
const UserProfile = ({ name, email, role }) => {
    if (!name || !email) {
        return null;
    }
    
    return (
        <div className="user-profile">
            <h1 className="text-xl font-bold">{name}</h1>
            <p className="text-gray-600">{email}</p>
        </div>
    );
};
```

### Types

This project uses JavaScript with JSDoc comments for type documentation when needed.

**Props Documentation:**
```jsx
/**
 * Button component for user actions
 * @param {Object} props
 * @param {string} [props.variant='primary'] - Visual style variant
 * @param {string} [props.size='md'] - Size of the button
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 */
export const Button = ({ className, variant = 'primary', size = 'md', children, ...props }) => {
    // implementation
};
```

**State Types:**
```jsx
const [isLoading, setIsLoading] = useState(false);
const [documents, setDocuments] = useState([]);
const [error, setError] = useState(null);
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `DocumentCard`, `SignatureModal` |
| Hooks | camelCase + prefix | `useDocument`, `useAuth` |
| Variables | camelCase | `documentList`, `isSigned` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| CSS classes | kebab-case | `bg-indigo-600`, `text-gray-900` |
| Props | camelCase | `onClick`, `documentId` |
| Files | PascalCase for components | `DocumentCard.jsx` |
| Utils | camelCase | `cn.js` (utility function) |

**Component Naming:**
- Use `displayName` for React components:
```jsx
Button.displayName = 'Button';
```

### Error Handling

**Try-Catch Pattern:**
```jsx
const fetchDocuments = async () => {
    try {
        setIsLoading(true);
        const response = await fetch('/api/documents');
        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        setDocuments(data);
    } catch (error) {
        console.error('Error fetching documents:', error);
        setError(error.message);
    } finally {
        setIsLoading(false);
    }
};
```

**Component Error Boundaries:**
- Wrap potentially failing components with error handling
- Display user-friendly error messages

**Async/Await:**
- Always wrap async operations in try-catch
- Use `finally` for cleanup (e.g., setting loading states)

### Component Structure

**Functional Components:**
```jsx
// 1. Imports
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

// 2. Component definition
export const ComponentName = ({ prop1, prop2 }) => {
    // 3. Hooks (alphabetical order)
    const [state, setState] = useState(initialValue);
    
    // 4. Derived state
    const derivedValue = state ? compute() : defaultValue;
    
    // 5. Event handlers
    const handleClick = () => {
        // handler logic
    };
    
    // 6. Effects (if needed)
    useEffect(() => {
        // effect logic
    }, [dependency]);
    
    // 7. Early returns
    if (!ready) {
        return <LoadingSpinner />;
    }
    
    // 8. Render
    return (
        <div className="component">
            <h1>Title</h1>
            {children}
        </div>
    );
};

ComponentName.displayName = 'ComponentName';

// 9. Default props (if needed)
ComponentName.defaultProps = {
    prop1: 'default',
};
```

### Tailwind CSS Guidelines

**Class Ordering:**
1. Layout (display, flex, grid)
2. Positioning (position, top, left)
3. Box model (margin, padding, width, height)
4. Visual (background, border, shadow)
5. Typography (font, text, color)
6. Effects (opacity, transition)

**Example:**
```jsx
<div className="
    flex items-center justify-between
    p-4 m-2
    bg-white rounded-lg shadow-md
    text-gray-900 font-medium
    hover:bg-gray-50 transition-colors
">
```

**Custom Classes:**
- Use the `cn()` utility for conditional classes:
```jsx
const buttonClasses = cn(
    'inline-flex items-center justify-center',
    'bg-indigo-600 text-white',
    isLoading && 'opacity-50 cursor-not-allowed',
    className
);
```

### React Patterns

**useState Initialization:**
```jsx
// Lazy initialization for expensive initial state
const [data, setData] = useState(() => {
    return expensiveComputation();
});

// Object state
const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
});
```

**useEffect Dependencies:**
- Always include all dependencies
- Use empty array `[]` for mount-only effects
- Use proper cleanup functions:

```jsx
useEffect(() => {
    const controller = new AbortController();
    
    fetchData(controller.signal)
        .then(data => setData(data))
        .catch(err => {
            if (err.name !== 'AbortError') {
                setError(err.message);
            }
        });
    
    return () => controller.abort();
}, [dependency]);
```

**Event Handling:**
```jsx
// Prevent default on form submissions
const handleSubmit = (e) => {
    e.preventDefault();
    // form logic
};

// Type-safe event handlers
const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
};
```

### File Naming

| Content | File Name | Example |
|---------|-----------|---------|
| Page component | PascalCase.jsx | DocumentList.jsx |
| Reusable UI | PascalCase.jsx | Button.jsx, Card.jsx |
| Utility function | camelCase.js | cn.js |
| Component folder | PascalCase | components/ui/Button/ |

### Additional Guidelines

**Conditional Rendering:**
```jsx
{isLoading ? (
    <LoadingSpinner />
) : (
    <Content />
)}

{condition && <Component />}

{condition || <Fallback />}
```

**List Rendering:**
```jsx
{items.map(item => (
    <Item key={item.id} {...item} />
))}
```

**Refs:**
```jsx
import React, { forwardRef } from 'react';

export const Input = forwardRef(({ className, ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={cn('input-classes', className)}
            {...props}
        />
    );
});

Input.displayName = 'Input';
```

**Context Usage:**
```jsx
// Create context with provider
export const useMyContext = () => {
    const context = useContext(MyContext);
    if (!context) {
        throw new Error('useMyContext must be used within MyProvider');
    }
    return context;
};
```

---

## Quick Reference

**Always use:**
- `@/` for absolute imports from src
- `cn()` utility for Tailwind class merging
- `displayName` for React components
- `forwardRef` for components that accept refs
- Lazy state initialization for expensive computations

**Never use:**
- Relative imports for components (use `@/` instead)
- Inline function definitions in render props
- Console.log for debugging (use proper logging)
