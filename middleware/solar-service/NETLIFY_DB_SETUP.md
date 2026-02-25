# Netlify DB Setup Guide for Apolaki Solar Platform

## Overview

The Apolaki Solar Platform middleware uses **Netlify DB** with **GORM** ORM for data persistence. This document provides step-by-step instructions to set up and use Netlify DB in the Go middleware.

## Prerequisites

- Go 1.21 or higher
- PostgreSQL client (for manual testing)
- Netlify account (for production deployment)
- Environment variables configured

## Step 1: Install Dependencies

The required dependencies are already in `go.mod`:

```bash
cd middleware/solar-service

# Download dependencies
go mod download

# Verify dependencies
go mod tidy
```

Key packages:

- `gorm.io/gorm` - ORM framework
- `gorm.io/driver/postgres` - PostgreSQL driver
- `github.com/gin-gonic/gin` - Web framework

## Step 2: Configure Environment Variables

Create a `.env` file in the `middleware/solar-service` directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```
DATABASE_URL=postgresql://user:password@localhost:5432/apolaki_solar
PORT=8080
ENV=development
```

### For Netlify Production

Set environment variables in your Netlify dashboard under **Site Settings > Build & Deploy > Environment**.

## Step 3: Initialize Database Connection

In your `cmd/main.go`, add the database initialization:

```go
package main

import (
    "github.com/apolaki/solar-service/internal/database"
    "log"
)

func main() {
    // Initialize Netlify DB
    if err := database.InitNetlifyDB(); err != nil {
        log.Fatal("Failed to initialize database:", err)
    }
    defer database.CloseDB()

    // Run migrations
    if err := database.MigrateModels(); err != nil {
        log.Fatal("Migration failed:", err)
    }

    // Rest of your application code...
}
```

## Step 4: Define Data Models

Models are defined in `internal/database/models.go`. Each model represents a table in Netlify DB:

- **User** - User accounts
- **SolarInstallation** - Solar systems
- **MonitoringData** - Real-time monitoring
- **PerformanceData** - Analytics
- **MaintenanceLog** - Service records
- **Contract** - Service contracts
- **Assessment** - Solar assessments
- **MarketplaceProduct** - Products/Services
- **Finance** - Financial transactions

## Step 5: Run Migrations

Migrations are automatic when the application starts:

```go
if err := database.MigrateModels(); err != nil {
    log.Fatal("Migration failed:", err)
}
```

This creates all tables and relationships in Netlify DB.

## Step 6: Using GORM in Your Code

### Example: Create a User

```go
package main

import (
    "github.com/apolaki/solar-service/internal/database"
    "github.com/google/uuid"
)

func createUser() {
    db := database.GetDB()
    
    user := &database.User{
        ID:        uuid.New(),
        Email:     "user@example.com",
        Password:  "hashed_password",
        FirstName: "John",
        LastName:  "Doe",
        Role:      "customer",
    }
    
    if err := db.Create(user).Error; err != nil {
        log.Fatal("Failed to create user:", err)
    }
}
```

### Example: Query Users

```go
func getUsers() {
    db := database.GetDB()
    
    var users []database.User
    
    // Get all users
    if err := db.Find(&users).Error; err != nil {
        log.Fatal("Failed to fetch users:", err)
    }
    
    // Get specific user by email
    var user database.User
    if err := db.Where("email = ?", "user@example.com").First(&user).Error; err != nil {
        log.Fatal("User not found:", err)
    }
}
```

### Example: Update Installation

```go
func updateInstallation(installationID string) {
    db := database.GetDB()
    
    if err := db.Model(&database.SolarInstallation{}).
        Where("id = ?", installationID).
        Update("status", "maintenance").Error; err != nil {
        log.Fatal("Failed to update installation:", err)
    }
}
```

### Example: Delete with Soft Delete

```go
func deleteContract(contractID string) {
    db := database.GetDB()
    
    // Soft delete (sets DeletedAt timestamp)
    if err := db.Delete(&database.Contract{}, "id = ?", contractID).Error; err != nil {
        log.Fatal("Failed to delete contract:", err)
    }
    
    // To permanently delete:
    // if err := db.Unscoped().Delete(&database.Contract{}, "id = ?", contractID).Error != nil
}
```

## Step 7: Health Checks

Use the health check function in your health endpoint:

```go
router.GET("/health", func(c *gin.Context) {
    if err := database.HealthCheck(); err != nil {
        c.JSON(500, gin.H{
            "status": "unhealthy",
            "error": err.Error(),
        })
        return
    }
    c.JSON(200, gin.H{
        "status": "healthy",
    })
})
```

## Step 8: Testing

### Unit Tests with Mock Database

```go
package database

import (
    "testing"
    "gorm.io/gorm"
)

func TestUserCreation(t *testing.T) {
    // Use test database or mock
    db := setupTestDB()
    
    user := &User{
        Email: "test@example.com",
    }
    
    result := db.Create(user)
    if result.Error != nil {
        t.Fatalf("Failed to create user: %v", result.Error)
    }
}
```

## Deployment to Netlify

### 1. Connect Repository

Push code to GitHub and connect to Netlify.

### 2. Set Environment Variables

In Netlify dashboard:

1. Go to **Site Settings > Build & Deploy > Environment**
2. Add `DATABASE_URL` from Netlify DB
3. Add other required variables

### 3. Configure Build Command

In `netlify.toml` or dashboard:

```toml
[build]
  command = "cd middleware/solar-service && go build -o bin/solar-service ./cmd"
  functions = "middleware/solar-service/bin"
```

### 4. Deploy

Push changes to trigger automatic deployment:

```bash
git push origin main
```

## Troubleshooting

### Connection Issues

```bash
# Test PostgreSQL connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check environment variables
echo $DATABASE_URL
```

### Migration Failures

```bash
# Check table exists
\dt

# Drop all tables (CAUTION: development only)
db.Migrator().DropTable(&User{}, &SolarInstallation{}, ...)

# Re-run migrations
db.AutoMigrate(...)
```

### GORM Errors

Enable detailed logging:

```go
db.Logger = logger.Default.LogMode(logger.Info)
```

## Additional Resources

- [GORM Documentation](https://gorm.io)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Netlify DB Documentation](https://docs.netlify.com/datastore/overview/)
- [Go PostgreSQL Driver](https://github.com/lib/pq)

## Next Steps

1. ✅ Configure environment variables
2. ✅ Initialize database connection
3. ✅ Run migrations
4. ✅ Create API endpoints using GORM queries
5. ✅ Add input validation and error handling
6. ✅ Deploy to Netlify

For more details, see `NETLIFY_DB_CONFIG.md`.
