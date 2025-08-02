const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Fix the trust proxy issue - be more specific about trusted proxies
// Only trust Railway's proxy if you're on Railway
if (process.env.RAILWAY_ENVIRONMENT) {
  app.set('trust proxy', 1); // Trust first proxy (Railway)
} else {
  app.set('trust proxy', false); // Don't trust any proxy in other environments
}

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Roblox API Proxy is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/universes/get-universe-containing-place', async (req, res) => {
  try {
    const placeId = req.query.placeid;
    
    if (!placeId) {
      return res.status(400).json({ error: 'placeid parameter is required' });
    }

    console.log(`Fetching universe ID for place: ${placeId}`);
    
    const response = await fetch(
      `https://apis.roblox.com/universes/v1/places/${placeId}/universe`,
      {
        headers: {
          'User-Agent': 'RobloxProxy/1.0'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`Roblox API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.universeId) {
      console.log(`Found universe ID: ${data.universeId}`);
      res.send(data.universeId.toString());
    } else {
      res.status(404).json({ error: 'Universe ID not found' });
    }

  } catch (error) {
    console.error('Error fetching universe ID:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch universe ID',
      details: error.message 
    });
  }
});

app.get('/v1/games/votes', async (req, res) => {
  try {
    const universeIds = req.query.universeIds;
    
    if (!universeIds) {
      return res.status(400).json({ error: 'universeIds parameter is required' });
    }

    console.log(`Fetching votes for universe: ${universeIds}`);

    const response = await fetch(
      `https://games.roblox.com/v1/games/votes?universeIds=${universeIds}`,
      {
        headers: {
          'User-Agent': 'RobloxProxy/1.0'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`Roblox API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Votes data:`, data);
    
    res.json(data);

  } catch (error) {
    console.error('Error fetching votes:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch votes',
      details: error.message 
    });
  }
});

app.get('/v1/games', async (req, res) => {
  try {
    const universeIds = req.query.universeIds;
    
    if (!universeIds) {
      return res.status(400).json({ error: 'universeIds parameter is required' });
    }

    console.log(`Fetching game info for universe: ${universeIds}`);

    const response = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${universeIds}`,
      {
        headers: {
          'User-Agent': 'RobloxProxy/1.0'
        },
        timeout: 10000
      }
    );

    if (!response.ok) {
      throw new Error(`Roblox API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Error fetching game info:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch game info',
      details: error.message 
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Roblox API Proxy running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/`);
});
