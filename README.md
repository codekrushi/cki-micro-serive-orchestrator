# CKI Microservice Orchestrator Demo

A demo Node.js application showing a decoupled microservice architecture with:

- Redis Pub/Sub event bus
- MongoDB flexible schema for `dynamicAttributes`
- Sales, Inventory/QC, Billing, and Dispatch service flows
- Domain-agnostic metadata support for Textile or Solar

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start dependencies with Docker:

```bash
docker compose up -d
```

3. Copy environment variables:

```bash
copy .env.example .env
```

4. Start the demo:

```bash
npm start
```

## What it demonstrates

- `SalesService` creates an order and publishes `ORDER_PLACED`
- `InventoryService` reserves stock and later publishes `QC_PASSED`
- `BillingService` calculates invoice and leakage after QC approval
- `DispatchService` simulates barcode generation and dispatch readiness
- The MongoDB order model stores `metadata` dynamically, so textile and solar domains can coexist without schema migrations

## Demo flow

- Sales creates an order with domain-specific attributes
- Inventory responds to `ORDER_PLACED`
- QC passes and emits `QC_PASSED`
- Billing and Dispatch react independently

## Notes

This sample is built for demonstration and architecture validation. You can extend it with REST APIs, real stock updates, or domain-specific event consumers.

## DOCKER installation 
install docker locally 

if you hit issues with permissions ru the below scripts
takeown /F "C:\ProgramData\DockerDesktop" /R /A
icacls "C:\ProgramData\DockerDesktop" /grant:r "Administrators:F" /T /C