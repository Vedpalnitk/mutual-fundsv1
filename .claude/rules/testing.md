---
paths:
  - "**/*.test.{ts,tsx}"
  - "**/*.spec.{ts,tsx}"
  - "__tests__/**/*"
---

# Testing Guidelines

## Test File Naming

- Unit tests: `ComponentName.test.tsx`
- Integration tests: `feature.spec.ts`
- Place tests alongside source files or in `__tests__/` directory

## Testing Libraries

### Web (Next.js)
- Jest for test runner
- React Testing Library for component tests
- MSW for API mocking

### Mobile (Expo)
- Jest with jest-expo preset
- React Native Testing Library

## Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  })

  afterEach(() => {
    // Cleanup
  })

  it('should render correctly', () => {
    // Arrange
    // Act
    // Assert
  })

  it('should handle user interaction', async () => {
    // ...
  })
})
```

## Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## API Mocking

```typescript
// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'mocked' }),
  })
) as jest.Mock
```

## Test Coverage Goals

- Components: Test rendering and user interactions
- Hooks: Test state changes and side effects
- Services: Test API calls and error handling
- Utils: Test pure functions with various inputs
