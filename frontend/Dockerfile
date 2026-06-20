# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --legacy-peer-deps

COPY . .

ARG REACT_APP_API_BASE_URL=http://localhost:8001
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
ENV NODE_ENV=production

WORKDIR /app/frontend
RUN npm run build

# ─── Runtime stage: alpine (smaller attack surface), non-root user ─────────────
FROM node:22-alpine AS runtime

# Patch OS-level CVEs before locking to non-root
RUN apk upgrade --no-cache \
    && npm install -g serve@14.2.4 \
    && npm cache clean --force

# Non-root user (alpine uses addgroup/adduser)
RUN addgroup -S -g 1001 appgroup \
    && adduser -S -u 1001 -G appgroup -H -D -s /sbin/nologin appuser

WORKDIR /app/frontend

COPY --from=build --chown=appuser:appgroup /app/frontend/build ./build

USER appuser

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const http=require('http'); http.get('http://127.0.0.1:3001', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["serve", "-s", "build", "-l", "3001"]
