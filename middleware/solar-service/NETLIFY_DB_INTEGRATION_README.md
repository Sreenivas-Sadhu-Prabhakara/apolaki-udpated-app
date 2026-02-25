# Netlify DB Integration - Apolaki Solar Platform

## Overview

The Apolaki Solar Platform middleware has been successfully integrated with **Netlify DB** using **GORM**, a powerful Go Object-Relational Mapping (ORM) library.

### What's Been Set Up

✅ **Netlify DB Configuration** - PostgreSQL database integration  
✅ **GORM ORM** - Object-relational mapping for database operations  
✅ **Database Models** - 9 comprehensive data models for the solar platform  
✅ **Connection Management** - Automatic connection pooling and health checks  
✅ **Example Handlers** - Sample API endpoints demonstrating GORM usage  
✅ **Environment Configuration** - `.env.example` file for easy setup  
✅ **Documentation** - Complete setup and usage guides  

## Directory Structure

```
middleware/solar-service/
├── cmd/
│   └── main.go                          # Application entry point
├── internal/
│   ├── database/
│   │   ├── db.go                        # Database initialization & connection
│   │   └── models.go                    # 9 GORM models for all tables
│   └── handlers/
│       └── database_handlers.go         # Example API handlers
├── .env.example                         # Environment variables template
├── NETLIFY_DB_CONFIG.md                 # Configuration reference
├── NETLIFY_DB_SETUP.md                  # Complete setup guide
├── go.mod                               # Go module file (with GORM dependencies)
└── go.sum                               # Dependency checksums
```

## Database Models

The following 9 models are pre-configured for Netlify DB:

### 1. User

- User accounts and authentication
- Relationships: Has many Installations, Contracts
- Fields: ID, Email, Password, FirstName, LastName, Role, Active, Timestamps

### 2. SolarInstallation

- Solar system installations
- Relationships: Belongs to User, Has many MonitoringData, PerformanceData, MaintenanceLog
- Fields: ID, UserID, Name, Address, Capacity, PanelCount, InstallationDate, Status

### 3. MonitoringData

- Real-time system monitoring
- Relationships: Belongs to SolarInstallation
- Fields: PowerOutput, VoltageAC, CurrentAC, Temperature, Efficiency, Status

### 4. PerformanceData

- Daily/aggregated performance metrics
- Relationships: Belongs to SolarInstallation
- Fields: Date, EnergyGenerated, PeakPower, AvgEfficiency, DowntimeMinutes

### 5. MaintenanceLog

- Maintenance and service records
- Relationships: Belongs to SolarInstallation
- Fields: MaintenanceType, Description, PerformedDate, Cost, Status, Technician

### 6. Contract

- Service and maintenance contracts
- Relationships: Belongs to User
- Fields: ContractType, StartDate, EndDate, Amount, Status, RenewalOption

### 7. Assessment

- Solar assessments and feasibility studies
- Relationships: Belongs to User
- Fields: Address, RoofCondition, AnnualUsage, RecommendedCapacity, EstimatedCost

### 8. MarketplaceProduct

- Marketplace products and services
- Fields: Name, Category, Description, Price, Inventory, Rating

### 9. Finance

- Financial transactions and records
- Relationships: Belongs to User
- Fields: Amount, Type, Category, TransactionDate, Status

## Quick Start

### 1. Configure Environment Variables

```bash
cd middleware/solar-service
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/apolaki_solar
PORT=8080
ENV=development
```

### 2. Initialize Database

Update `cmd/main.go` to include database initialization:

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

    // Run migrations (creates tables)
    if err := database.MigrateModels(); err != nil {
        log.Fatal("Migration failed:", err)
    }

    // Rest of application...
}
```

### 3. Run the Application

```bash
go run ./cmd/main.go
```

## Using GORM in Your Code

### Example: Create a Record

```go
import (
    "github.com/apolaki/solar-service/internal/database"
    "github.com/google/uuid"
)

// Create a new user
user := &database.User{
    ID:        uuid.New(),
    Email:     "user@example.com",
    FirstName: "John",
    LastName:  "Doe",
    Active:    true,
}

db := database.GetDB()
if err := db.Create(user).Error; err != nil {
    log.Fatal("Failed to create user:", err)
}
```

### Example: Query Records

```go
// Get all users
var users []database.User
db.Find(&users)

// Get user by email
var user database.User
db.Where("email = ?", "user@example.com").First(&user)

// Get installations for a user
var installations []database.SolarInstallation
db.Where("user_id = ?", userID).Find(&installations)

// Get recent monitoring data
var monitoringData []database.MonitoringData
db.Where("installation_id = ?", installationID).
    Order("timestamp DESC").
    Limit(100).
    Find(&monitoringData)
```

### Example: Update Records

```go
db.Model(&database.SolarInstallation{}).
    Where("id = ?", installationID).
    Update("status", "maintenance")
```

### Example: Delete Records

```go
// Soft delete (sets DeletedAt timestamp)
db.Delete(&database.Contract{}, "id = ?", contractID)

// Hard delete (permanent)
db.Unscoped().Delete(&database.Contract{}, "id = ?", contractID)
```

## API Endpoints (Examples Included)

Pre-built handlers are in `internal/handlers/database_handlers.go`:

### User Endpoints
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/:id` - Get user
- `GET /api/v1/users` - List all users

### Solar Installation Endpoints
- `POST /api/v1/installations` - Create installation
- `GET /api/v1/installations/:id` - Get installation
- `GET /api/v1/users/:user_id/installations` - Get user's installations

### Monitoring Endpoints
- `POST /api/v1/installations/:installation_id/monitoring` - Record monitoring data

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Netlify DB connection string | `postgresql://user:pass@localhost:5432/apolaki_solar` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `JWT_SECRET` | JWT signing key | - |

## Deployment to Netlify

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Setup Netlify DB with GORM"
git push origin main
```

### 2. Connect to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **Add new site > Import an existing project**
3. Connect your GitHub repository

### 3. Configure Environment Variables

In Netlify dashboard:
1. Go to **Site Settings > Build & Deploy > Environment**
2. Add variables:
   - `DATABASE_URL` - Get from Netlify DB
   - `JWT_SECRET` - Your secret key
   - Other environment variables

### 4. Deploy

Push to trigger automatic deployment:

```bash
git push origin main
```

## Health Check Endpoint

```go
router.GET("/health", func(c *gin.Context) {
    if err := database.HealthCheck(); err != nil {
        c.JSON(500, gin.H{"status": "unhealthy", "error": err.Error()})
        return
    }
    c.JSON(200, gin.H{"status": "healthy", "database": "connected"})
})
```

## Testing

### Unit Test Example

```go
package database

import (
    "testing"
)

func TestUserCreation(t *testing.T) {
    db := setupTestDB()
    
    user := &User{Email: "test@example.com"}
    result := db.Create(user)
    
    if result.Error != nil {
        t.Fatalf("Failed: %v", result.Error)
    }
}
```

## Troubleshooting

### Connection Failed
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Migration Issues
```bash
# Check logs
go run ./cmd/main.go

# Enable debug logging in db.go:
// db.Logger = logger.Default.LogMode(logger.Info)
```

### UUID Issues
```bash
# Ensure PostgreSQL UUID extension is enabled
# GORM auto-enables it during migration
```

## Additional Resources

- 📚 [GORM Documentation](https://gorm.io)
- 📚 [PostgreSQL Docs](https://www.postgresql.org/docs/)
- 📚 [Netlify DB Docs](https://docs.netlify.com/datastore/overview/)
- 📚 [Go UUID Library](https://github.com/google/uuid)

## Files Overview

| File | Purpose |
|------|---------|
| `internal/database/db.go` | Database initialization, connection management |
| `internal/database/models.go` | 9 GORM model definitions |
| `internal/handlers/database_handlers.go` | Example API handlers |
| `.env.example` | Environment variables template |
| `NETLIFY_DB_CONFIG.md` | Configuration reference |
| `NETLIFY_DB_SETUP.md` | Complete setup guide |

## Next Steps

1. ✅ Review the models in `internal/database/models.go`
2. ✅ Configure `.env` with your database credentials
3. ✅ Integrate handlers into your main router
4. ✅ Create additional handlers for your API
5. ✅ Add input validation and error handling
6. ✅ Deploy to Netlify

## Support

For issues or questions:
1. Check `NETLIFY_DB_SETUP.md` for detailed setup instructions
2. Review `NETLIFY_DB_CONFIG.md` for configuration options
3. Check GORM documentation: https://gorm.io
4. Review example handlers in `internal/handlers/database_handlers.go`

---

**Netlify DB Integration Complete! 🚀**

Your Apolaki Solar Platform middleware is now ready to use a production-grade PostgreSQL database with GORM ORM.
