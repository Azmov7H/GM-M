# Architectural Decisions

## 1. SQLite over Client-Server Databases

**Decision:** Use SQLite instead of PostgreSQL/MySQL.

**Why:**
- Zero configuration and no separate server
- Single file database for easy backup/copy
- Excellent performance for local-first use
- Perfect for 1-10 concurrent users
- No network overhead

## 2. Next.js App Router

**Decision:** Use Next.js 16 with App Router (not Pages Router).

**Why:**
- Server Components by default (performance)
- React Server Actions for mutations
- File-based routing with layouts
- Built-in optimization (fonts, images, scripts)
- Active ecosystem and community

## 3. Feature-Oriented Architecture

**Decision:** Organize code by feature, not by technical layer.

**Why:**
- Features are self-contained
- Easier to understand feature scope
- Simpler to remove/disable features
- Better code locality
- Scales with application complexity

## 4. Drizzle ORM over Prisma

**Decision:** Use Drizzle ORM instead of Prisma.

**Why:**
- Lighter weight, less overhead
- Better SQLite support
- Closer to SQL (less abstraction)
- No binary engine to install
- TypeScript-first design

## 5. Server Actions over API Routes

**Decision:** Prefer Server Actions for mutations.

**Why:**
- Simpler form handling
- Built-in CSRF protection
- Co-located with components
- No manual API endpoint creation
- Better developer experience

## 6. No Separate Backend

**Decision:** No Express/Fastify backend.

**Why:**
- Next.js handles server-side logic
- Reduces deployment complexity
- Single process for everything
- Sufficient for local-first architecture
- Less maintenance overhead

## 7. Arabic-First, RTL

**Decision:** Arabic is the primary language with RTL layout.

**Why:**
- Target market is Arabic-speaking
- RTL is the default, LTR is future support
- Layout decisions account for RTL from start
- Prevents RTL retrofitting issues

## 8. Local-First

**Decision:** Application runs locally, no cloud dependency.

**Why:**
- Works offline
- Data stays on client machine
- No internet required
- Better privacy
- Lower operational costs
