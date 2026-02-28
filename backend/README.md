# Safety Glasses Backend API

A Node.js + TypeScript + Express backend for the Safety Glasses management platform.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (recommended) or npm

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup database:**
   ```bash
   # Generate Prisma client
   pnpm db:generate

   # Push schema to database (development)
   pnpm db:push

   # Or run migrations (production)
   pnpm db:migrate
   ```

4. **Seed the database (optional):**
   ```bash
   pnpm db:seed
   ```

5. **Start the server:**
   ```bash
   # Development with hot-reload
   pnpm dev

   # Production
   pnpm build
   pnpm start
   ```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/register` - Register new user (admin only)
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout

### Companies
- `GET /api/v1/companies` - List companies (admin only)
- `POST /api/v1/companies` - Create company (admin only)
- `GET /api/v1/companies/:id` - Get company
- `PUT /api/v1/companies/:id` - Update company (admin only)
- `DELETE /api/v1/companies/:id` - Delete company (admin only)

### Users
- `GET /api/v1/users` - List users (admin only)
- `POST /api/v1/users` - Create user (admin only)
- `GET /api/v1/users/:id` - Get user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Deactivate user (admin only)

### Employees
- `GET /api/v1/employees` - List employees
- `POST /api/v1/employees` - Create employee
- `GET /api/v1/employees/:id` - Get employee
- `PUT /api/v1/employees/:id` - Update employee
- `DELETE /api/v1/employees/:id` - Delete employee

### Frames
- `GET /api/v1/frames` - List frames
- `POST /api/v1/frames` - Create frame (admin only)
- `GET /api/v1/frames/:id` - Get frame
- `PUT /api/v1/frames/:id` - Update frame (admin only)
- `DELETE /api/v1/frames/:id` - Deactivate frame (admin only)

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Get order
- `PUT /api/v1/orders/:id` - Update order
- `DELETE /api/v1/orders/:id` - Delete order (admin only)

### Support Tickets
- `GET /api/v1/support-tickets` - List tickets
- `POST /api/v1/support-tickets` - Create ticket
- `GET /api/v1/support-tickets/:id` - Get ticket
- `PUT /api/v1/support-tickets/:id` - Update ticket

### File Upload
- `POST /api/v1/upload` - Upload file
- `DELETE /api/v1/upload` - Delete file

## Default Credentials

After running the seed script:

- **Admin:** admin@safetyglasses.com / admin123
- **Manager:** manager@democompany.com / manager123

## Scripts

- `pnpm dev` - Start development server with hot-reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:migrate` - Run migrations
- `pnpm db:seed` - Seed the database
- `pnpm db:studio` - Open Prisma Studio

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 8000 |
| NODE_ENV | Environment | development |
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET | Secret for JWT tokens | - |
| JWT_EXPIRES_IN | JWT expiration time | 24h |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:5173 |
| MAX_FILE_SIZE | Max upload size in bytes | 5242880 (5MB) |
| UPLOAD_DIR | Upload directory | uploads |
