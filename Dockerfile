# Stage 1: Build Vue frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Go backend
FROM golang:1.24-alpine AS backend-builder
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -o /server .

# Stage 3: Runtime
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai
COPY --from=backend-builder /server /app/server
COPY --from=frontend-builder /app/dist /app/dist
COPY frontend/content/ /app/content/
ENV DIST_DIR=/app/dist
ENV CONTENT_DIR=/app/content
EXPOSE 8080
CMD ["/app/server"]
