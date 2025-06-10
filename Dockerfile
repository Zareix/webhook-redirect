FROM oven/bun:1.2.15 AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build


FROM oven/bun:1.2.15-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist webhook-redirect

EXPOSE 3000

CMD [ "bun", "run", "./webhook-redirect" ]

