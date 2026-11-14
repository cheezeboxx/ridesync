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