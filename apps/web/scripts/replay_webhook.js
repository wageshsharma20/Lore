// scripts/replay_webhook.js
// A testing utility to simulate a GitHub Pull Request webhook payload
// hitting the FastAPI backend webhook receiver.

const fs = require('fs');
const path = require('path');

const API_WEBHOOK_URL = process.env.API_URL || 'http://localhost:8000/api/webhook';

const fixturePath = path.join(__dirname, 'fixtures', 'pr_merged.json');
const mockWebhookPayload = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

async function replayWebhook() {
  console.log(`🚀 Replaying mock GitHub webhook to ${API_WEBHOOK_URL}...`);
  
  try {
    const res = await fetch(API_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'pull_request'
      },
      body: JSON.stringify(mockWebhookPayload)
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✅ Webhook successfully accepted by the backend!');
      console.log('Response:', data);
    } else {
      console.error(`❌ Backend rejected webhook with status ${res.status}`);
      const text = await res.text();
      console.error('Error Details:', text);
    }
  } catch (error) {
    console.error('🚨 Connection failed. Is the FastAPI server running on port 8000?');
    console.error(error.message);
  }
}

replayWebhook();
