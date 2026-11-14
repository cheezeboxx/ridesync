# RideSync
A scalable ride-matching backend that finds nearby drivers with Redis GEO, protects itself with rate limiting, and scales horizontally behind an Nginx load balancer.

## Getting started

```bash
npm install
npm run dev
```

Then check http://localhost:3000/health