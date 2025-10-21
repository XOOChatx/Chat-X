# Multi-stage build for Node + Chrome (Puppeteer) on Railway
# Stage 1: builder (installs deps, compiles TS)
FROM node:20-bullseye AS builder

WORKDIR /app

# Install OS deps needed for node-gyp and canvas/ffmpeg bindings at build time
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests first for better layer caching
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./

# Default to npm; Railway can also use pnpm/yarn. We'll infer based on lockfiles
RUN if [ -f pnpm-lock.yaml ]; then \
      corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
      corepack enable && corepack prepare yarn@stable --activate && yarn install --frozen-lockfile; \
    else \
      npm ci; \
    fi

# Copy the rest of the source
COPY . .

# Build TypeScript
RUN npm run build || (\
    if [ -f pnpm-lock.yaml ]; then pnpm run build; \
    elif [ -f yarn.lock ]; then yarn build; \
    else exit 1; fi)


# Stage 2: runtime with Google Chrome installed
FROM node:20-bullseye-slim AS runtime

WORKDIR /app

# Install Chrome and required runtime libraries for Puppeteer/Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    gnupg \
    ca-certificates \
    wget \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libgcc1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxau6 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    lsb-release \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome stable from Debian repo
RUN set -eux; \
    arch="$(dpkg --print-architecture)"; \
    wget -qO- https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /usr/share/keyrings/google-linux-signing-keyring.gpg; \
    echo "deb [arch=${arch} signed-by=/usr/share/keyrings/google-linux-signing-keyring.gpg] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends google-chrome-stable; \
    rm -rf /var/lib/apt/lists/*

# Copy only the runtime artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Puppeteer/Chrome environment for Railway
ENV NODE_ENV=production \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    CHROME_PATH=/usr/bin/google-chrome-stable \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    WA_HEADLESS=true \
    WA_CHROMIUM_NO_SANDBOX=true

# Expose service port (Railway will map dynamically, but good practice)
ENV PORT=3001
EXPOSE 3001

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get(`http://localhost:${process.env.PORT||3001}/health`, res=>{process.exit(res.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "dist/app.js"]


