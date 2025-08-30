## Multi-stage Dockerfile for TimeFlow
## 1) Build stage: install deps and run `bun run build` to populate `dist/`.
## 2) Runtime stage: copy only `dist/` and run the bundled server.

FROM oven/bun:latest AS builder
WORKDIR /app
# Copy package manifests first to leverage Docker layer cache
COPY package.json ./
COPY bun.lock* ./ || true

# Install dependencies (including dev deps required for build)
RUN bun install

# Copy the rest of the repo and run the build step which produces `dist/`
COPY . .
RUN bun run build

## Runtime image: keep only the built artifacts
FROM oven/bun:latest AS runner
WORKDIR /app

# Copy built server bundle and client assets
COPY --from=builder /app/dist ./dist

# Optional: copy package.json for metadata (not strictly required)
COPY package.json ./

ENV NODE_ENV=production
EXPOSE 5000

# Run the built server bundle
CMD ["bun", "dist/index.js"]


