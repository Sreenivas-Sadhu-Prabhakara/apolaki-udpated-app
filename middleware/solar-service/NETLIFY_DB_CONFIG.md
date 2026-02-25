# Netlify DB Configuration for Apolaki Solar Platform

## Environment Setup

### Development

```bash
# Use local PostgreSQL or Netlify DB Dev
export DATABASE_URL="postgresql://user:password@localhost:5432/apolaki_dev"
```

### Production

```bash
# Netlify DB Production (set via Netlify dashboard)
# The DATABASE_URL is automatically injected by Netlify
```

## Connection Details

- **ORM**: GORM (Go Object-Relational Mapping)
- **Driver**: PostgreSQL
- **Database Engine**: Netlify DB (PostgreSQL)

## Models

The database contains the following models (tables):

1. **User** - User accounts and profiles
2. **SolarInstallation** - Solar system installations
3. **MonitoringData** - Real-time monitoring data
4. **PerformanceData** - Performance metrics and analytics
5. **MaintenanceLog** - Maintenance records
6. **Contract** - Service contracts
7. **Assessment** - Solar assessments
8. **MarketplaceProduct** - Marketplace products/services
9. **Finance** - Financial transactions and records

## Migration

Migrations are automatically applied via GORM's `AutoMigrate` function in the initialization process.

To run migrations:

```go
import "github.com/apolaki/solar-service/internal/database"

if err := database.MigrateModels(); err != nil {
    log.Fatal(err)
}
```

## Usage in Application

```go
package main

import (
    "github.com/apolaki/solar-service/internal/database"
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

    // Get database instance
    db := database.GetDB()

    // Use GORM for queries
    var users []database.User
    db.Find(&users)
}
```

## Security

- All connections use SSL/TLS
- Credentials are stored in environment variables
- Never commit `.env` files with real credentials
- Use Netlify dashboard for production secrets

## Performance Optimization

- Connection pool: 100 max open connections, 10 idle connections
- Connection lifetime: 1 hour
- Indexes on foreign keys and frequently queried fields
- Soft deletes using `gorm.DeletedAt`

## Backup & Recovery

Netlify DB includes:

- Automatic daily backups
- Point-in-time recovery
- Data replication
- High availability setup

Refer to Netlify documentation for backup and recovery procedures.
