# Multi-stage build for Go Solar Service
# Stage 1: Build
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Allow automatic toolchain upgrades if deps need a newer patch
ENV GOTOOLCHAIN=auto

# Copy go mod file (only direct deps, no go.sum needed)
COPY go.mod ./

# Copy source code
COPY . .

# Let Go resolve all dependencies fresh
ENV GONOSUMCHECK=*
ENV GOFLAGS=-mod=mod
RUN go mod tidy
RUN go mod download

# Build the application with optimizations
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o solar-service ./cmd/main.go

# Stage 2: Runtime
FROM alpine:latest

WORKDIR /home/solar

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

# Copy binary from builder
COPY --from=builder /app/solar-service .

# Create a non-root user and give ownership
RUN addgroup -g 1001 -S solr && adduser -S solar -u 1001 -G solr && chown solar:solr /home/solar/solar-service && chmod +x /home/solar/solar-service
USER solar

EXPOSE 8080
ENV PORT=8080

CMD ["./solar-service"]
