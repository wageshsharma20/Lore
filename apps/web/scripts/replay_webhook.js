// scripts/replay_webhook.js
// A testing utility to simulate a GitHub Pull Request webhook payload
// hitting the FastAPI backend webhook receiver.

const API_WEBHOOK_URL = process.env.API_URL || 'http://localhost:8000/api/webhook';

const mockWebhookPayload = {
  action: 'closed',
  pull_request: {
    number: 123,
    title: 'feat: Replace Tailwind with pure CSS',
    body: '## Architectural Decision\\n\\nWe removed Tailwind CSS because it was causing severe bundle bloat and class conflicts across our micro-frontends.\\n\\nJira: LORE-404',
    html_url: 'https://github.com/tarot-club-hackathons/lore/pull/123',
    merged: true,
    user: {
      login: 'alice-dev'
    },
    merged_at: new Date().toISOString()
  },
  repository: {
    full_name: 'tarot-club-hackathons/lore'
  }
};

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
