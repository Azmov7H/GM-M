# Development Setup

## Prerequisites

### Node.js 24 LTS

```bash
nvm install 24
nvm use 24
node -v  # Should show v24.x.x
npm -v
```

### Git

```bash
git --version
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

## Project Setup

```bash
git clone <repo-url>
cd alli-jamm
npm install
```

## Environment

1. Copy `.env.example` to `.env.local`
2. Adjust values as needed

## Development Server

```bash
npm run dev
```

Opens at http://localhost:3000

## Available Commands

### Code Quality

- `npm run lint` - Check for ESLint issues
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without modifying
- `npm run typecheck` - Run TypeScript compiler checks

### Testing

- `npm run test` - Run unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run end-to-end tests with Playwright

### Database

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:migrate` - Apply pending migrations
- `npm run db:push` - Push schema directly to database (prototyping)
- `npm run db:studio` - Open Drizzle Studio GUI

### Production

- `npm run build` - Build the application
- `npm run start` - Start the production server
