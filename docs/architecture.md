# Architecture

## Overview
RideSync is a ride-matching backend designed to handle heavy concurrent traffic.

## Request flow
```
Clients
   │
 Nginx (load balancer)
   │
 ┌─┴───────────┐
 API 1  API 2  API 3   (stateless Node.js instances)
 └─┬───────────┘
   │
 ┌─┴────────┐
Redis    Postgres
```

## Components
- **Nginx:** distributes incoming requests across API instances
- **Node.js API:** stateless, so instances can be added or removed freely
- **Redis:** caching, geospatial driver lookup, rate limiting
- **Postgres:** durable storage for users and rides
