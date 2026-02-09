# Backend CORS Fix Required

## Problem
Frontend is getting CORS preflight errors when calling `/api/changes` endpoint:

```
Access to XMLHttpRequest at 'https://5b04-212-192-219-96.ngrok-free.app/api/changes?timeoutMs=25000' 
from origin 'https://28e4-212-192-219-96.ngrok-free.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
The frontend sends custom headers (`If-None-Match`, `Authorization`, `x-graph-token`) which triggers a **CORS preflight OPTIONS request**. The backend is **not handling OPTIONS requests** or not returning the required CORS headers.

## Required Fix

### 1. Handle OPTIONS Requests
Your backend MUST handle `OPTIONS` requests for ALL routes (especially `/api/changes`).

### 2. Return CORS Headers on OPTIONS
When receiving an `OPTIONS` request, return these headers:

```
Access-Control-Allow-Origin: <origin>
Access-Control-Allow-Headers: Authorization, x-graph-token, If-None-Match, Content-Type
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Max-Age: 86400
```

### 3. Return CORS Headers on Actual Requests
On all GET/POST/PUT/DELETE requests, also return:

```
Access-Control-Allow-Origin: <origin>
Access-Control-Expose-Headers: ETag, Retry-After
```

### 4. Allowed Origins
Must include:
- `https://localhost:3001` (for local testing)
- `https://28e4-212-192-219-96.ngrok-free.app` (current frontend ngrok URL)

## Example Express.js Implementation

```javascript
// CORS middleware (add BEFORE your routes)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://localhost:3001',
    'https://28e4-212-192-219-96.ngrok-free.app'
  ];
  
  // Set CORS headers
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Headers', 
    'Authorization, x-graph-token, If-None-Match, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 
    'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'ETag, Retry-After');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // No Content
  }
  
  next();
});
```

## Example Fastify Implementation

```javascript
// Add CORS plugin
await fastify.register(require('@fastify/cors'), {
  origin: [
    'https://localhost:3001',
    'https://28e4-212-192-219-96.ngrok-free.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'x-graph-token', 'If-None-Match', 'Content-Type'],
  exposedHeaders: ['ETag', 'Retry-After'],
  maxAge: 86400
});
```

## Testing

After implementing, test with:

```bash
# Test OPTIONS preflight
curl -X OPTIONS \
  -H "Origin: https://28e4-212-192-219-96.ngrok-free.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization,x-graph-token,If-None-Match" \
  -v \
  https://5b04-212-192-219-96.ngrok-free.app/api/changes

# Should return 204 with CORS headers
```

## Current Impact

Until this is fixed:
- ✅ Other endpoints work (if they don't use custom headers)
- ❌ `/api/changes` polling is disabled (frontend auto-disables after 3 failures)
- ⚠️ Real-time category updates won't work

## Priority: HIGH
This blocks the change feed polling feature which is essential for real-time updates.
