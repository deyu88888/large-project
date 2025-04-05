# Stage 1: Build the app
FROM node:22 AS build

WORKDIR /app

ARG VITE_API_URL
ARG VITE_APP_VERSION

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# Install dependencies
COPY package*.json ./

RUN npm cache clean --force
RUN npm install

# Fix esbuild version mismatch
RUN npm rebuild esbuild

# Copy the rest of the code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
