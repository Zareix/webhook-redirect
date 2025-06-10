FROM oven/bun:1.2.15 AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN TARGET=$(uname -m) && \
  echo "Building for target: $TARGET" && \
  bun run build --target=$TARGET


FROM oven/bun:1.2.15-slim AS runner

WORKDIR /app

COPY --from=builder /app/webhook-redirect .
RUN chmod +x webhook-redirect

EXPOSE 3000

CMD [ "./webhook-redirect" ]

