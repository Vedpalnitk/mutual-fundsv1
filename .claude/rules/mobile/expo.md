---
paths:
  - "mobile/**/*.{ts,tsx}"
---

# Expo & React Native Guidelines

## Project Structure

```
mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── (tabs)/            # Tab navigation group
│   │   ├── _layout.tsx    # Tab bar configuration
│   │   ├── dashboard.tsx
│   │   ├── funds.tsx
│   │   └── profile.tsx
│   ├── funds/
│   │   └── [id].tsx       # Dynamic fund detail route
│   └── _layout.tsx        # Root layout with providers
├── components/            # Reusable components
├── context/              # React context providers
├── constants/            # Theme, colors, static data
└── services/             # API services
```

## Expo Router

### File-Based Routing
- `app/` directory defines routes
- `_layout.tsx` for nested layouts
- `(group)` for route groups (no URL segment)
- `[param].tsx` for dynamic routes

### Navigation
```typescript
import { useRouter, useLocalSearchParams } from 'expo-router'

const router = useRouter()
router.push('/funds/123')
router.back()

const { id } = useLocalSearchParams<{ id: string }>()
```

## Styling

### React Native Paper
- Use Paper components for Material Design
- Access theme via `useTheme()` from `react-native-paper`

### StyleSheet Pattern
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
})
```

### Theme Colors
```typescript
import { useTheme } from 'react-native-paper'

const { colors } = useTheme()
// colors.primary, colors.background, colors.surface, etc.
```

## Theming

### ThemeModeContext
```typescript
import { useThemeMode } from '@/context/ThemeModeContext'

const { mode, setPreference } = useThemeMode()
// mode: 'light' | 'dark'
// setPreference: ('light' | 'dark' | 'system') => void
```

## Data Persistence

### AsyncStorage
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'

// Save
await AsyncStorage.setItem('key', JSON.stringify(data))

// Load
const stored = await AsyncStorage.getItem('key')
const data = stored ? JSON.parse(stored) : null
```

## Common Patterns

### Screen with Background
```typescript
import { ScreenBackground } from '@/components/ScreenBackground'

export default function MyScreen() {
  return (
    <ScreenBackground showThemeToggle>
      {/* content */}
    </ScreenBackground>
  )
}
```

### Loading States
```typescript
const [loading, setLoading] = useState(true)
const [refreshing, setRefreshing] = useState(false)

if (loading) {
  return <ActivityIndicator />
}
```

### Pull to Refresh
```typescript
<FlatList
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
  }
/>
```

## Commands

- **Start dev server**: `npm start` or `npx expo start`
- **Clear cache**: `npx expo start --clear`
- **iOS simulator**: `npx expo run:ios`
- **Android emulator**: `npx expo run:android`
- **Install deps**: `npx expo install <package>`
