# Frescrow – Decentralized Freelance Escrow Platform (XRPL)
---

## About

**Frescrow** is a decentralized freelance escrow platform built on the **XRP Ledger (XRPL)**.  
It enables clients and freelancers to collaborate with confidence using **on-chain, milestone-based escrows**.

By leveraging XRPL’s native escrow functionality and RLUSD, Frescrow eliminates intermediaries, platform fees, and custody risks.

> **Core Idea:**  
> Trust is enforced by the transparency of the XRP Ledger — not by the platform.

[Video](https://drive.google.com/drive/folders/1HUib_pYoRMt3ELIPOykPvX6NAUAv3xy0?usp=sharing)
[Documentation](https://drive.google.com/file/d/1pW8RZCpIe52rx5Q5gJuUr9oEqeR91Kz6/view?usp=sharing)
---

## The Problem

The global freelance economy is worth **$1.5 trillion**, yet freelancers and clients face serious trust and payment inefficiencies.

### Freelancers face:
- Non-payment risk after delivering work  
- Payment delays of **14–30 days** on traditional platforms  
- International transfers taking days or even weeks due to intermediaries  
- Asymmetric information during disputes  
- High platform and financial institution fees (**1–3%**)  

### Clients face:
- Risk of incomplete or poor-quality work  
- Freelancers disappearing mid-project  
- Limited recourse for disputes  
- Expensive escrow fees:
  - **1–3%** for traditional escrow services  
  - Up to **25%** on platforms like Fiverr  

---

## User Stories

### As a Client
- I want to ensure freelancers deliver work **consistently and reliably**.  
- I want **fast, milestone-based payments** to maintain project momentum.  
- I want to avoid **high escrow and platform fees**.  

### As a Freelancer
- I want a **transparent way to demonstrate reliability**.  
- I want **frequent and predictable payments**.  
- I want large contracts split into **smaller, conditional payouts**.  

---

## Key XRPL Features

- **RLUSD-Based Payments**  
  Stable, fiat-pegged payments via RLUSD trust lines.

- **Native XRPL Escrow**  
  Trustless fund locking and release using `EscrowCreate` and `EscrowFinish`.

- **Time-Locked Smart Escrows**  
  On-chain deadlines enforce delivery timelines.

- **Wallet-Based Identity (DID-Style)**  
  XRPL wallets act as decentralized identities.

- **On-Chain Metadata & History**  
  Project details stored in escrow memos.

---

## Key Application Features

- **Milestone-Based Payments**  
- **On-Chain Reputation**  
- **Zero Platform Fees**  
- **Fast & Global Settlement (3–5 seconds)**  
- **Full Transparency via XRPL Explorer**

---

## Getting Started

### Prerequisites
- Node.js
- npm

### Clone Repository
```bash
git clone https://github.com/gnaixus/fintechhackathon.git
cd fintechhackathon
```
### Start Backend
```bash
cd backend
npm install
npm run dev
```
### Backend runs on:
http://localhost:3001

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```
### Frontend runs on:
http://localhost:3002

---

## Teck Stack
- Frontend: React.js, React Router
- Backend: Node.js, Express
- Blockchain: XRP Ledger (XRPL Testnet)
- SDK: xrpl.js

