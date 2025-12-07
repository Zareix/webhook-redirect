FROM oven/bun:1.3.4-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build


FROM oven/bun:1.3.4-alpine AS runner

COPY --from=builder /app/dist/index.js /app/webhook-redirect.js

EXPOSE 3000

CMD [ "bun", "run", "/app/webhook-redirect.js" ]

