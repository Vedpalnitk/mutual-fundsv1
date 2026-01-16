# Security Guidelines

## Environment Variables

- Never commit secrets to source control
- Use `.env.local` for local secrets (auto-gitignored by Next.js)
- Prefix public variables with `NEXT_PUBLIC_` for client-side access
- Keep API keys server-side only when possible

```bash
# .env.local (never commit)
DATABASE_URL=...
API_SECRET_KEY=...

# Public (safe to expose)
NEXT_PUBLIC_API_URL=https://api.example.com
```

## Input Validation

- Validate all user inputs on both client and server
- Sanitize data before rendering (React handles XSS by default)
- Use TypeScript types for runtime validation awareness

## API Security

### CORS
- Configure CORS headers for API routes
- Whitelist specific origins in production

### Rate Limiting
- Implement rate limiting for public endpoints
- Use appropriate limits for MFAPI.in calls

## Data Handling

### Sensitive Data
- Never log sensitive user data
- Encrypt sensitive data at rest
- Use HTTPS for all API calls

### Local Storage
- Don't store sensitive data in localStorage/AsyncStorage
- Theme preferences, cached fund data are OK
- Never store auth tokens in plain text

## Dependencies

- Keep dependencies updated
- Review security advisories: `npm audit`
- Prefer well-maintained packages with active communities

## Code Review Checklist

- [ ] No hardcoded secrets or API keys
- [ ] User inputs are validated
- [ ] Error messages don't leak sensitive info
- [ ] HTTPS used for external API calls
- [ ] Dependencies are from trusted sources
