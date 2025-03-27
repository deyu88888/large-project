# Frontend

This is a **Vite + React + TypeScript** frontend application using **TailwindCSS**, **MUI**, **Vitest**, and **ESLint**. It includes testing utilities like Testing Library and coverage reporting.

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) or [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Running the app

```bash
# Dev
npm run dev

# Prod
npm run build
npm run preview
```

### Testing

```bash

# To run all tests
npm run test

# To run all test with coverage
npm run test:coverage
```

### Linting

```bash 
npm run lint
```

### Project structure

├── public/             # Static assets
├── src/                # Main application source
│   ├── components/     # Reusable UI components
|   |   ├───__test__/   # Tests
│   ├── pages/          # Route-based page components
|   |   ├───__test__/   # Tests
│   ├── hooks/          # Custom hooks
│   ├── store/          # Zustand global store
│   ├── utils/          # Utility functions
│   ├── styles/         # Tailwind and global styles
│   └── main.tsx        # App entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json
