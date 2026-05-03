# All-in-one image for Railway: API + Socket.io + static SPA
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY frontend/ ./
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./public
RUN npx prisma generate
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node src/app.js"]
