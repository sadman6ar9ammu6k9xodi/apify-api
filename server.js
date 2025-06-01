const express = require("express");
const axios = require("axios");
const app = express();

const APIFY_API_TOKEN = "apify_api_WJR2KNUyBecHUQJg4okbioDnnc6V241WQu9i"; // তোমার আসল টোকেন
const ACTOR_ID = "hVlkT1FrZB15YsUDo"; // তোমার Apify Actor ID

app.get("/", (req, res) => {
  res.send("✅ Apify Downloader API is Running!");
});

app.get("/download", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    // Run the Apify actor
    const run = await axios.post(
      `https://api.apify.com/v2/actor-tasks/${ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`,
      {
        memory: 2048,
        timeoutSecs: 120,
        input: { startUrls: [{ url }] }
      }
    );

    const runId = run.data.data.id;

    // Wait for the actor to finish
    let finished = false, result;
    while (!finished) {
      const status = await axios.get(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`);
      const runData = status.data.data;
      if (runData.status === "SUCCEEDED") {
        finished = true;
        result = await axios.get(`https://api.apify.com/v2/datasets/${runData.defaultDatasetId}/items?token=${APIFY_API_TOKEN}`);
      } else if (runData.status === "FAILED") {
        return res.status(500).json({ error: "Actor failed" });
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    res.json(result.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to download media" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
