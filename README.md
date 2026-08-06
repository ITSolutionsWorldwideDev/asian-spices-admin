# 🛒 **Asian Spices | Admin Dashboard (Next.js)**

This repo is the admin dashboard for Asian Spices. It's a standalone Next.js app (App Router, TypeScript, port 3003) — **not** part of a Turborepo/monorepo setup, despite earlier docs here. The customer-facing storefront lives in the sibling repo `asian-spices-web`.

---

## 🚀 Live Demo

👉 **Website:** https://asianspices.online/
👉 **Admin Panel:** https://asianspices.online/

---

## 📌 **Features**

### 🛍 **Website**
- 🧭 Modern, SEO-optimized storefront built with Next.js App Router  
- ⚡ High-performance product browsing and search  
- 🛒 Cart & checkout flows  
- 🌐 Internationalization (i18n)  
- 📱 Fully responsive UI with Tailwind CSS  

### 🛠 **Admin Dashboard**
- 📦 Product management (CRUD)  
- 👥 Customer & order management  
- 📊 Analytics & reporting  
- 🔐 Role-based authentication  
- ⚙️ Settings & configuration  

### 📦 **Monorepo / Turborepo Features**
- ♻️ Shared UI component library  
- 🧩 Shared utilities and config packages  
- 🚄 Remote caching for faster builds  
- 🧪 Unified testing and linting setup  
- 🗂 Clear folder structure for multiple apps  

---

## 🛠️ Tech Stack

| Tech         | Description                          |
|--------------|--------------------------------------|
| **Turborepo** | High-performance monorepo tooling |
| **Next.js** | Framework for website + admin dashboard |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first CSS styling |
| **Prisma / MongoDB / PostgreSQL** | Database & ORM |
| **NextAuth / Auth0 / Custom Auth** | Authentication |
| **i18next** | Internationalization |
| **React Query / SWR** | Data fetching & caching |
| **Zustand / Redux** | State management (if applicable) |

---


## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ITSolutionsWorldwideDev/asian-spices-admin.git


## 📁 **Monorepo Structure**

```txt
/apps
  ├── website        # Customer-facing storefront
  ├── admin          # Admin panel dashboard

/packages
  ├── ui             # Shared UI components
  ├── config         # Shared ESLint, Tailwind, TS config
  ├── utils          # Shared helper functions
  ├── hooks          # Shared custom hooks

/turbo.json          # Turborepo pipeline config
/package.json
/tsconfig.json
