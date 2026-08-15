require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const API_TOKEN = process.env.API_TOKEN;
const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:8000'];

if (!API_TOKEN) {
  console.error('Missing API_TOKEN environment variable. Copy .env.example to .env and set API_TOKEN.');
  process.exit(1);
}

const app = express();
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS origin denied by policy'));
    },
    credentials: true
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

const eventLog = [];
const actionLog = [];

const allowedEventTypes = ['voice_command', 'system_event', 'operator_action', 'recommendation'];
const allowedActions = ['deploy_security', 'open_gate_3', 'close_gate_1', 'trigger_evacuation', 'redirect_crowd'];

function authorize(req, res, next) {
  const authHeader = req.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || match[1] !== API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function redactText(text) {
  if (!text || typeof text !== 'string') return '';
  const safe = text.trim().slice(0, 80);
  return safe.replace(/[aeiouAEIOU]/g, '*');
}

function validateEvent(body) {
  if (!body || typeof body !== 'object') return 'Payload must be an object.';
  const { eventType, level, details, source } = body;
  if (!allowedEventTypes.includes(eventType)) {
    return `Invalid eventType. Allowed values: ${allowedEventTypes.join(', ')}`;
  }
  if (!['info', 'warning', 'danger', 'system'].includes(level)) {
    return 'Invalid level. Allowed values: info, warning, danger, system.';
  }
  if (!source || typeof source !== 'string' || !source.trim()) {
    return 'Source is required.';
  }
  return null;
}

function validateAction(body) {
  if (!body || typeof body !== 'object') return 'Payload must be an object.';
  const { action, requester, confirmation } = body;
  if (!allowedActions.includes(action)) {
    return `Invalid action. Allowed values: ${allowedActions.join(', ')}`;
  }
  if (!requester || typeof requester !== 'string' || !requester.trim()) {
    return 'Requester is required.';
  }
  if (confirmation !== true) {
    return 'Action must be confirmed with confirmation: true.';
  }
  return null;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

app.post('/api/log', authorize, (req, res) => {
  const validationError = validateEvent(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { eventType, level, details, source } = req.body;
  const safeDetails = eventType === 'voice_command' ? redactText(details) : String(details || '').slice(0, 200);

  const entry = {
    id: eventLog.length + 1,
    timestamp: new Date().toISOString(),
    eventType,
    level,
    details: safeDetails,
    source
  };

  eventLog.push(entry);
  return res.status(202).json({ accepted: true, entryId: entry.id });
});

app.post('/api/action', authorize, (req, res) => {
  const validationError = validateAction(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { action, requester } = req.body;
  const entry = {
    id: actionLog.length + 1,
    timestamp: new Date().toISOString(),
    action,
    requester,
    status: 'queued'
  };

  actionLog.push(entry);
  return res.status(202).json({ accepted: true, actionId: entry.id, message: 'Action request queued.' });
});

app.get('/api/recommendations', authorize, (req, res) => {
  return res.json({
    recommendations: [
      {
        id: 'deploy_security',
        type: 'warning',
        title: 'Consider deploying security personnel',
        description: 'High crowd density has been detected in the main corridor.',
        importance: 'high'
      }
    ]
  });
});

app.get('/api/privacy', authorize, (req, res) => {
  return res.json({
    privacy: 'This backend stub redacts sensitive voice details, stores only minimal metadata, and uses bearer-token authorization.'
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`CrowdShield backend stub listening on http://localhost:${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
// backend/server.js
app.post('/api/predict', async (req, res) => {
    const { crowdData } = req.body;
    const features = extractFeatures(crowdData);
    const prediction = await mlModel.predict(features);
    
    res.json({
        crush_likelihood: prediction.crush_probability,
        stampede_risk: prediction.stampede_score,
        time_to_crush: prediction.estimated_minutes,
        panic_propagation: prediction.panic_spread_rate
    });
});
// backend/server.js
app.post('/api/recommendations', async (req, res) => {
    const { state } = req.body;
    const recommendations = recommendationEngine.generateRecommendations(state);
    res.json({ recommendations });
});

// Also add a GET endpoint for manual refresh
app.get('/api/recommendations', async (req, res) => {
    const currentState = getCurrentState();
    const recommendations = recommendationEngine.generateRecommendations(currentState);
    res.json({ recommendations });
});

// backend/server.js - Add this after your middleware

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            recommendations: '/api/recommendations',
            predict: '/api/predict',
            log: '/api/log',
            action: '/api/action'
        }
    });
});

// Also add the recommendations endpoint if missing
app.get('/api/recommendations', (req, res) => {
    res.json({
        recommendations: [
            {
                id: 1,
                action: 'MONITOR_SECTOR_A',
                message: 'Monitor Sector A - increasing density detected',
                priority: 'HIGH',
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                action: 'OPEN_EXIT_C',
                message: 'Consider opening Exit C to distribute crowd',
                priority: 'MEDIUM',
                timestamp: new Date().toISOString()
            }
        ]
    });
});s