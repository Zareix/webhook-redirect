# --- BUILD STAGE ---
FROM nginx:alpine AS build

RUN apk add \
    nodejs \
    npm

RUN npm install -g pnpm

COPY ./package.json package.json
COPY ./pnpm-lock.yaml pnpm-lock.yaml
RUN pnpm install
COPY . .

RUN pnpm tsc

# --- APP SETUP STAGE ---
FROM nginx:alpine
RUN apk add \
    nodejs \
    npm

RUN npm install -g pnpm

ENV NODE_ENV=production

WORKDIR /app
COPY ./package.json package.json
COPY ./pnpm-lock.yaml pnpm-lock.yaml
RUN pnpm install

COPY --from=build /dist /app/dist

EXPOSE 3001

CMD ["pnpm", "start"]
