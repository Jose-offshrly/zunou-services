/**
 * MeetBot Scaling API Module
 * 
 * This module contains all scaling-related endpoints and middleware.
 * Separated from main index.js for better code organization.
 * 
 * AWS Authentication: Uses IAM role-based authentication when running in ECS,
 * falls back to explicit credentials for local development.
 */

const { ECSClient, DescribeServicesCommand } = require('@aws-sdk/client-ecs')
const AWS = require('aws-sdk')

// Initialize ECS client
// Use IAM role-based authentication when running in ECS, fall back to env vars for local dev
const ecsClientConfig = {
  region: process.env.AWS_REGION || 'us-east-1'
}

// Only add explicit credentials if they exist (for local development)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  ecsClientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
}

const ecsClient = new ECSClient(ecsClientConfig)

// Configuration
const SCALING_API_KEY = process.env.SCALING_API_KEY
const ALLOWED_IPS = process.env.SCALING_ALLOWED_IPS?.split(',') || ['127.0.0.1', '::1']
const MAX_INSTANCES = parseInt(process.env.MAX_INSTANCES) || 10
const MIN_INSTANCES = parseInt(process.env.MIN_INSTANCES) || 0

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Simple IP range check function
function isIPInRange(ip, range) {
  // Handle IPv4-mapped IPv6 addresses (::ffff:x.x.x.x)
  let normalizedIP = ip
  if (ip.startsWith('::ffff:')) {
    normalizedIP = ip.substring(7) // Remove '::ffff:' prefix
  }
  
  if (range.includes('/')) {
    // CIDR notation (basic implementation)
    const [rangeIP, prefixLength] = range.split('/')
    
    // Skip IPv6 ranges if we have an IPv4 address
    if (normalizedIP.includes('.') && rangeIP.includes(':')) {
      return false
    }
    
    // Skip IPv4 ranges if we have an IPv6 address
    if (normalizedIP.includes(':') && rangeIP.includes('.')) {
      return false
    }
    
    // Handle IPv4 CIDR
    if (normalizedIP.includes('.') && rangeIP.includes('.')) {
      const ipParts = normalizedIP.split('.').map(Number)
      const rangeParts = rangeIP.split('.').map(Number)
      
      const prefixLen = parseInt(prefixLength)
      const mask = (-1 << (32 - prefixLen)) >>> 0
      
      const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]
      const rangeNum = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3]
      
      return (ipNum & mask) === (rangeNum & mask)
    }
    
    // For IPv6 CIDR, just do basic comparison (could be enhanced)
    return normalizedIP.startsWith(rangeIP.split('/')[0])
  } else {
    // Exact match - compare normalized IP with range
    return normalizedIP === range || ip === range
  }
}

// Security middleware for scaling endpoints
function requireScalingAuth(req, res, next) {
  try {
    // Check API key
    const apiKey = req.headers['x-api-key'] || req.query.api_key
    
    // Log authentication attempt for security audit
    console.log(`[AUTH] API key validation for ${req.ip}`)
    
    if (!apiKey || apiKey !== SCALING_API_KEY) {
      console.warn(`[SECURITY] Invalid API key from ${req.ip}`)
      return res.status(401).json({ 
        error: 'Invalid or missing API key',
        message: 'Use X-API-Key header or api_key query parameter'
      })
    }
    
    // Check IP allowlist
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress
    
    // Normalize IPv6-mapped IPv4 addresses (::ffff:192.168.65.1 -> 192.168.65.1)
    const normalizedClientIP = clientIP.replace(/^::ffff:/, '')
    
    if (!ALLOWED_IPS || ALLOWED_IPS.length === 0) {
      console.warn('[SECURITY] No allowed IPs configured - allowing all IPs')
    } else {
      const isAllowed = ALLOWED_IPS.some(allowedIP => {
        const trimmedAllowedIP = allowedIP.trim()
        // Check both original and normalized IP
        return isIPInRange(clientIP, trimmedAllowedIP) || 
               isIPInRange(normalizedClientIP, trimmedAllowedIP)
      })
      
      if (!isAllowed) {
        console.warn(`[SECURITY] Blocked scaling request from IP: ${clientIP} (normalized: ${normalizedClientIP})`)
        return res.status(403).json({ 
          error: 'IP not authorized for scaling operations',
          clientIP: clientIP,
          normalizedClientIP: normalizedClientIP,
          allowedIPs: ALLOWED_IPS
        })
      }
    }
    
    // Log successful auth
    console.log(`[SCALING AUTH] Authorized request from ${clientIP}`)
    next()
    
  } catch (error) {
    console.error('[SECURITY] Auth middleware error:', error)
    return res.status(500).json({ error: 'Authentication error' })
  }
}

// Audit logging middleware
function auditLog(req, res, next) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    apiKeyUsed: req.headers['x-api-key'] ? 'yes' : 'no'
  }
  
  console.log('[AUDIT] Scaling request:', JSON.stringify(logEntry))
  next()
}

// ============================================================================
// SCALING UTILITY FUNCTIONS
// ============================================================================

// Get current ECS task count for a service
async function getCurrentECSTaskCount(environment = 'staging') {
  try {
    const clusterName = `primary-${environment}`
    const serviceName = `meet-bot-${environment}`
    
    const command = new DescribeServicesCommand({
      cluster: clusterName,
      services: [serviceName]
    })
    
    const result = await ecsClient.send(command)
    
    if (!result.services || result.services.length === 0) {
      throw new Error(`Service ${serviceName} not found in cluster ${clusterName}`)
    }
    
    const service = result.services[0]
    return {
      desired: service.desiredCount,
      running: service.runningCount,
      pending: service.pendingCount,
      serviceName: serviceName,
      clusterName: clusterName,
      status: service.status
    }
    
  } catch (error) {
    console.error(`[ECS] Error getting task count for ${environment}:`, error)
    throw error
  }
}

// Call the existing scaling Lambda function
async function callScalingLambda(environment, desiredCount) {
  try {
    // Configure Lambda client - use IAM role-based auth when available
    const lambdaConfig = {
      region: process.env.AWS_REGION,
    }
    
    // Only add explicit credentials if they exist (for local development)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      lambdaConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID
      lambdaConfig.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    }
    
    const lambdaClient = new AWS.Lambda(lambdaConfig)
    
    const clusterName = `primary-${environment}`
    const serviceName = `meet-bot-${environment}`
    
    const payload = {
      cluster: clusterName,
      service: serviceName,
      desired_count: desiredCount
    }
    
    console.log(`[SCALING] Calling Lambda with payload:`, payload)
    
    const result = await lambdaClient.invoke({
      FunctionName: process.env.ECS_SCALER_LAMBDA_NAME || `ecs-scaler-${environment}`,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload)
    }).promise()
    
    const response = JSON.parse(result.Payload)
    
    if (result.StatusCode !== 200 || response.statusCode !== 200) {
      throw new Error(`Lambda scaling failed: ${JSON.stringify(response)}`)
    }
    
    console.log(`[SCALING] Lambda response:`, response)
    return response
    
  } catch (error) {
    console.error(`[SCALING] Lambda call failed:`, error)
    throw error
  }
}

// ============================================================================
// SCALING API ENDPOINTS
// ============================================================================

function setupScalingRoutes(app, getActiveInstanceCount) {
  // Middleware stack for all scaling endpoints
  const scalingMiddleware = [
    requireScalingAuth,
    auditLog
  ]
  
  // Get current scaling status
  app.get('/scale/status', ...scalingMiddleware, async (req, res) => {
    try {
      const environment = req.query.environment || process.env.ENVIRONMENT || 'staging'
      
      const ecsStatus = await getCurrentECSTaskCount(environment)
      const { activeCount, totalRecordings } = await getActiveInstanceCount()
      
      res.json({
        success: true,
        environment: environment,
        timestamp: new Date().toISOString(),
        ecs: ecsStatus,
        meetings: {
          active: activeCount,
          total: totalRecordings
        },
        capacity: {
          maxInstances: MAX_INSTANCES,
          utilizationPercentage: ecsStatus.desired > 0 ? Math.round((activeCount / ecsStatus.desired) * 100) : 0
        }
      })
      
    } catch (error) {
      console.error('[SCALING] Status error:', error)
      res.status(500).json({ 
        success: false,
        error: 'Failed to get scaling status',
        message: error.message 
      })
    }
  })
  
  // Main scaling endpoint
  app.post('/scale', ...scalingMiddleware, async (req, res) => {
    try {
      const { direction, environment = process.env.ENVIRONMENT || 'staging' } = req.body
      
      // Validation
      if (!direction) {
        return res.status(400).json({
          success: false,
          error: 'Missing direction parameter',
          message: 'Provide direction: "up", "down", or a specific number (0-10)'
        })
      }
      
      // Get current status
      const currentStatus = await getCurrentECSTaskCount(environment)
      const currentCount = currentStatus.desired
      
      let newCount
      
      if (direction === 'up') {
        newCount = Math.min(currentCount + 1, MAX_INSTANCES)
      } else if (direction === 'down') {
        newCount = Math.max(currentCount - 1, MIN_INSTANCES)
      } else if (!isNaN(parseInt(direction))) {
        newCount = Math.max(MIN_INSTANCES, Math.min(parseInt(direction), MAX_INSTANCES))
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid direction',
          message: 'Direction must be "up", "down", or a number between ' + MIN_INSTANCES + ' and ' + MAX_INSTANCES
        })
      }
      
      // Check if scaling is needed
      if (newCount === currentCount) {
        return res.json({
          success: true,
          message: `No scaling needed - already at ${currentCount} instances`,
          environment: environment,
          current: currentStatus,
          requested: newCount
        })
      }
      
      // Perform scaling
      console.log(`[SCALING] ${environment}: ${currentCount} -> ${newCount} instances`)
      
      const scalingResult = await callScalingLambda(environment, newCount)
      
      // Get updated status
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds for AWS to update
      const updatedStatus = await getCurrentECSTaskCount(environment)
      
      res.json({
        success: true,
        message: `Successfully scaled from ${currentCount} to ${newCount} instances`,
        environment: environment,
        scaling: {
          from: currentCount,
          to: newCount,
          direction: direction
        },
        before: currentStatus,
        after: updatedStatus,
        lambdaResponse: scalingResult
      })
      
    } catch (error) {
      console.error('[SCALING] Scale operation failed:', error)
      res.status(500).json({
        success: false,
        error: 'Scaling operation failed',
        message: error.message,
        environment: req.body.environment || process.env.ENVIRONMENT
      })
    }
  })
  
  // Scaling configuration info endpoint
  app.get('/scale/config', ...scalingMiddleware, (req, res) => {
    res.json({
      success: true,
      configuration: {
        maxInstances: MAX_INSTANCES,
        allowedIPs: ALLOWED_IPS,
        environments: ['development', 'staging', 'production'],
        securityFeatures: [
          'API Key Authentication',
          'IP Allowlisting',
          'Audit Logging',
          'Input Validation'
        ]
      },
      timestamp: new Date().toISOString()
    })
  })
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  setupScalingRoutes,
  getCurrentECSTaskCount,
  callScalingLambda,
  requireScalingAuth,
  auditLog,
  
  // For testing
  isIPInRange,
  SCALING_API_KEY,
  ALLOWED_IPS,
  MAX_INSTANCES
}
