---
paths:
  - "src/**/*.{ts,tsx}"
  - "mobile/**/*.{ts,tsx}"
---

# Code Style Guidelines

## TypeScript

- Use TypeScript strict mode
- Define explicit types for function parameters and return values
- Use interfaces for object shapes, types for unions/primitives
- Avoid `any` - use `unknown` and type guards when needed

## Formatting

- 2-space indentation
- Single quotes for strings
- No trailing semicolons (match existing codebase)
- Max line length: 100 characters
- Use template literals for string interpolation

## Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useTheme.ts`)
- **Utilities**: camelCase (`formatCurrency.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `ThemeContextValue`)

## Imports

- Group imports: React/Next → third-party → local
- Use path aliases (`@/components/...`)
- Prefer named imports over default imports for utilities

## File Organization

```typescript
// 1. Imports
import { useState } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui'

// 2. Types/Interfaces
interface Props {
  title: string
}

// 3. Component
const MyComponent = ({ title }: Props) => {
  // hooks first
  const [state, setState] = useState()

  // handlers
  const handleClick = () => {}

  // render
  return <div>{title}</div>
}

// 4. Export
export default MyComponent
```
