FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm db:generate
RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p uploads/frames uploads/prescriptions uploads/employees uploads/tickets

ENV NODE_ENV=production

EXPOSE 8000

CMD ["node", "dist/index.js"]
