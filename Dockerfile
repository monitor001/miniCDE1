# Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend .
RUN npx prisma generate
RUN npm run build
EXPOSE 5000
CMD ["npm", "run", "dev"] 