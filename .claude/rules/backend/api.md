---
paths:
  - "src/services/**/*.ts"
  - "src/pages/api/**/*.ts"
---

# API Service Guidelines

## Service Structure

### API Client Pattern
```typescript
// services/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}
```

### Resource API Pattern
```typescript
export const resourceApi = {
  list: () => request<Resource[]>('/api/v1/resources'),
  get: (id: string) => request<Resource>(`/api/v1/resources/${id}`),
  create: (data: Partial<Resource>) => request<Resource>('/api/v1/resources', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: string, data: Partial<Resource>) => request<Resource>(`/api/v1/resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id: string) => request<void>(`/api/v1/resources/${id}`, { method: 'DELETE' }),
}
```

## External APIs

### MFAPI.in (Mutual Fund Data)
- Base URL: `https://api.mfapi.in`
- Endpoints:
  - `GET /mf` - List all funds
  - `GET /mf/{schemeCode}` - Fund details with NAV history
- No authentication required
- Rate limiting may apply

### Response Handling
```typescript
interface MFAPIResponse {
  meta: {
    fund_house: string
    scheme_type: string
    scheme_category: string
    scheme_code: number
    scheme_name: string
  }
  data: Array<{ date: string; nav: string }>
  status: string
}
```

## Error Handling

- Always wrap API calls in try/catch
- Return meaningful error messages
- Log errors for debugging
- Use TypeScript for response types

```typescript
try {
  const data = await fundsApi.get(schemeCode)
  return data
} catch (error) {
  console.error(`Failed to fetch fund ${schemeCode}:`, error)
  throw new Error('Unable to load fund data')
}
```

## Caching Strategy

- Cache fund list for 5 minutes (mobile: AsyncStorage)
- Cache individual fund data for 1 hour
- Invalidate cache on pull-to-refresh
