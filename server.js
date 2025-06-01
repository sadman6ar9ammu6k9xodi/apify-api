const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const APIFY_TOKEN = 'apify_api_WJR2KNUyBecHUQJg4okbioDnnc6V241WQu9i';
const ACTOR_ID = 'hVlkT1FrZB15YsUDo';

app.get('/', (req, res) => {
  res.send('Apify API is running!');
});

app.post('/run-apify', async (req, res) => {
  try {
    const input = req.body.input || {
      startUrls: [{ url: 'https://example.com' }]
    };

    // Run the actor
    const runRes = await axios.post(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      { input },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const runId = runRes.data.data.id;

    // Wait for actor to finish
    let status = 'RUNNING';
    while (status !== 'SUCCEEDED' && status !== 'FAILED') {
      await new Promise(r => setTimeout(r, 5000));
      const check = await axios.get(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
      );
      status = check.data.data.status;
    }

    if (status === 'FAILED') {
      return res.status(500).json({ success: false, error: 'Actor run failed.' });
    }

    const datasetId = runRes.data.data.defaultDatasetId;
    const result = await axios.get(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`
    );

    res.json({ success: true, result: result.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
