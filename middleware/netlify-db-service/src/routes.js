/**
 * API Routes for Apolaki Solar Platform
 * Uses Netlify Neon database with @netlify/neon
 */

import express from 'express';
import {
    assessments,
    contracts,
    finance,
    maintenanceLog,
    marketplace,
    monitoringData,
    performanceData,
    solarInstallations,
    users
} from './db.js';

const router = express.Router();

// ============================================
// USER ROUTES
// ============================================

/**
 * POST /api/users
 * Create a new user
 */
router.post('/users', async (req, res) => {
  try {
    const { email, passwordHash, firstName, lastName, role } = req.body;

    if (!email || !passwordHash) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await users.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/users
 * Get all users
 */
router.get('/users', async (req, res) => {
  try {
    const allUsers = await users.getAll();
    res.json({
      success: true,
      count: allUsers.length,
      data: allUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await users.getById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, role, active } = req.body;
    const user = await users.update(req.params.id, {
      firstName,
      lastName,
      role,
      active
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// SOLAR INSTALLATION ROUTES
// ============================================

/**
 * POST /api/installations
 * Create a new solar installation
 */
router.post('/installations', async (req, res) => {
  try {
    const {
      userId,
      name,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      capacity,
      panelCount,
      inverterType
    } = req.body;

    if (!userId || !name) {
      return res.status(400).json({
        error: 'User ID and installation name are required'
      });
    }

    const installation = await solarInstallations.create({
      userId,
      name,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      capacity,
      panelCount,
      inverterType
    });

    res.status(201).json({
      success: true,
      message: 'Installation created successfully',
      data: installation
    });
  } catch (error) {
    console.error('Error creating installation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/installations/:id
 * Get installation by ID
 */
router.get('/installations/:id', async (req, res) => {
  try {
    const installation = await solarInstallations.getById(req.params.id);

    if (!installation) {
      return res.status(404).json({
        success: false,
        error: 'Installation not found'
      });
    }

    res.json({
      success: true,
      data: installation
    });
  } catch (error) {
    console.error('Error fetching installation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/users/:userId/installations
 * Get all installations for a user
 */
router.get('/users/:userId/installations', async (req, res) => {
  try {
    const installations = await solarInstallations.getByUserId(req.params.userId);

    res.json({
      success: true,
      count: installations.length,
      data: installations
    });
  } catch (error) {
    console.error('Error fetching installations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/installations/:id
 * Update installation
 */
router.put('/installations/:id', async (req, res) => {
  try {
    const { name, status, capacity, panelCount } = req.body;
    const installation = await solarInstallations.update(req.params.id, {
      name,
      status,
      capacity,
      panelCount
    });

    if (!installation) {
      return res.status(404).json({
        success: false,
        error: 'Installation not found'
      });
    }

    res.json({
      success: true,
      message: 'Installation updated successfully',
      data: installation
    });
  } catch (error) {
    console.error('Error updating installation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// MONITORING DATA ROUTES
// ============================================

/**
 * POST /api/installations/:installationId/monitoring
 * Record monitoring data
 */
router.post('/installations/:installationId/monitoring', async (req, res) => {
  try {
    const {
      powerOutput,
      voltageAc,
      currentAc,
      frequency,
      temperature,
      efficiency,
      status,
      errorCode
    } = req.body;

    const data = await monitoringData.create({
      installationId: req.params.installationId,
      powerOutput,
      voltageAc,
      currentAc,
      frequency,
      temperature,
      efficiency,
      status,
      errorCode
    });

    res.status(201).json({
      success: true,
      message: 'Monitoring data recorded',
      data
    });
  } catch (error) {
    console.error('Error recording monitoring data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/installations/:installationId/monitoring
 * Get latest monitoring data
 */
router.get('/installations/:installationId/monitoring', async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const data = await monitoringData.getLatest(req.params.installationId, limit);

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// PERFORMANCE DATA ROUTES
// ============================================

/**
 * POST /api/installations/:installationId/performance
 * Record performance data
 */
router.post('/installations/:installationId/performance', async (req, res) => {
  try {
    const {
      date,
      energyGenerated,
      peakPower,
      avgEfficiency,
      downtimeMinutes
    } = req.body;

    const data = await performanceData.create({
      installationId: req.params.installationId,
      date,
      energyGenerated,
      peakPower,
      avgEfficiency,
      downtimeMinutes
    });

    res.status(201).json({
      success: true,
      message: 'Performance data recorded',
      data
    });
  } catch (error) {
    console.error('Error recording performance data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/installations/:installationId/performance
 * Get performance data for installation
 */
router.get('/installations/:installationId/performance', async (req, res) => {
  try {
    const limit = req.query.limit || 30;
    const data = await performanceData.getByInstallation(
      req.params.installationId,
      limit
    );

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// MAINTENANCE LOG ROUTES
// ============================================

/**
 * POST /api/installations/:installationId/maintenance
 * Create maintenance log entry
 */
router.post('/installations/:installationId/maintenance', async (req, res) => {
  try {
    const {
      maintenanceType,
      description,
      performedDate,
      cost,
      technician,
      notes
    } = req.body;

    const record = await maintenanceLog.create({
      installationId: req.params.installationId,
      maintenanceType,
      description,
      performedDate,
      cost,
      technician,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance record created',
      data: record
    });
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/installations/:installationId/maintenance
 * Get maintenance logs
 */
router.get('/installations/:installationId/maintenance', async (req, res) => {
  try {
    const logs = await maintenanceLog.getByInstallation(req.params.installationId);

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// CONTRACT ROUTES
// ============================================

/**
 * POST /api/contracts
 * Create a contract
 */
router.post('/contracts', async (req, res) => {
  try {
    const {
      userId,
      contractType,
      startDate,
      endDate,
      termMonths,
      amount,
      currency,
      metadata
    } = req.body;

    const contract = await contracts.create({
      userId,
      contractType,
      startDate,
      endDate,
      termMonths,
      amount,
      currency,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Contract created successfully',
      data: contract
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/users/:userId/contracts
 * Get user contracts
 */
router.get('/users/:userId/contracts', async (req, res) => {
  try {
    const userContracts = await contracts.getByUserId(req.params.userId);

    res.json({
      success: true,
      count: userContracts.length,
      data: userContracts
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// ASSESSMENT ROUTES
// ============================================

/**
 * POST /api/assessments
 * Create an assessment
 */
router.post('/assessments', async (req, res) => {
  try {
    const {
      userId,
      address,
      city,
      state,
      zipCode,
      roofCondition,
      roofArea,
      annualUsage,
      sunExposure,
      obstructionLevel,
      recommendedCapacity,
      estimatedCost,
      savingsEstimate
    } = req.body;

    const assessment = await assessments.create({
      userId,
      address,
      city,
      state,
      zipCode,
      roofCondition,
      roofArea,
      annualUsage,
      sunExposure,
      obstructionLevel,
      recommendedCapacity,
      estimatedCost,
      savingsEstimate
    });

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/assessments/:id
 * Get assessment by ID
 */
router.get('/assessments/:id', async (req, res) => {
  try {
    const assessment = await assessments.getById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/users/:userId/assessments
 * Get user assessments
 */
router.get('/users/:userId/assessments', async (req, res) => {
  try {
    const userAssessments = await assessments.getByUserId(req.params.userId);

    res.json({
      success: true,
      count: userAssessments.length,
      data: userAssessments
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// MARKETPLACE ROUTES
// ============================================

/**
 * GET /api/marketplace/products
 * Get all marketplace products
 */
router.get('/marketplace/products', async (req, res) => {
  try {
    const products = await marketplace.getAll();

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/marketplace/products/:id
 * Get product by ID
 */
router.get('/marketplace/products/:id', async (req, res) => {
  try {
    const product = await marketplace.getById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/marketplace/products/category/:category
 * Get products by category
 */
router.get('/marketplace/products/category/:category', async (req, res) => {
  try {
    const products = await marketplace.getByCategory(req.params.category);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// FINANCE ROUTES
// ============================================

/**
 * POST /api/finance/transactions
 * Create financial transaction
 */
router.post('/finance/transactions', async (req, res) => {
  try {
    const {
      userId,
      transactionId,
      amount,
      currency,
      type,
      category,
      transactionDate,
      description,
      metadata
    } = req.body;

    const transaction = await finance.create({
      userId,
      transactionId,
      amount,
      currency,
      type,
      category,
      transactionDate,
      description,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Transaction recorded',
      data: transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/users/:userId/finance/transactions
 * Get user transactions
 */
router.get('/users/:userId/finance/transactions', async (req, res) => {
  try {
    const transactions = await finance.getByUserId(req.params.userId);

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/users/:userId/finance/summary
 * Get finance summary for user
 */
router.get('/users/:userId/finance/summary', async (req, res) => {
  try {
    const summary = await finance.getSummary(req.params.userId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'apolaki-netlify-db-service',
    timestamp: new Date().toISOString()
  });
});

export default router;
