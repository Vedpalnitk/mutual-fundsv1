---
paths:
  - "src/**/*.tsx"
  - "src/components/**/*"
---

# React & Next.js Guidelines

## Component Patterns

### Functional Components Only
- Use functional components with hooks
- No class components

### Props Interface
```typescript
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

const Button = ({ label, onClick, variant = 'primary' }: ButtonProps) => {
  // ...
}
```

### Hooks Usage
- Call hooks at the top of the component
- Custom hooks in `hooks/` or alongside component
- Use `useMemo` and `useCallback` for expensive operations

## Next.js Specifics

### Pages Router
- This project uses Pages Router (`src/pages/`)
- Use `useRouter` from `next/router`
- Dynamic routes: `[id].tsx`, `[...slug].tsx`

### Data Fetching
- Client-side: React hooks + fetch/axios
- Static: `getStaticProps` for build-time data
- Server: `getServerSideProps` for request-time data

### Routing
```typescript
import { useRouter } from 'next/router'

const router = useRouter()
router.push('/dashboard')
router.query.id // for dynamic params
```

## State Management

### React Context Pattern
```typescript
// context/MyContext.tsx
const MyContext = createContext<ContextValue | undefined>(undefined)

export function MyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState()
  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  )
}

export function useMyContext() {
  const context = useContext(MyContext)
  if (!context) throw new Error('useMyContext must be used within MyProvider')
  return context
}
```

## Styling

### Tailwind CSS
- Use Tailwind utility classes
- Custom styles in `globals.css` with CSS custom properties
- Dark mode: class-based (`:root.dark`)

### CSS Custom Properties
```css
:root {
  --color-primary: #007AFF;
}
:root.dark {
  --color-primary: #0A84FF;
}
```

## Error Handling

- Use error boundaries for component errors
- Handle async errors with try/catch
- Display user-friendly error messages
