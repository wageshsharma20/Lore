#!/bin/bash

# Exit on error
set -e

echo -e "\033[1;36m=========================================\033[0m"
echo -e "\033[1;36m🚀 STARTING LORE LIVE DEMO ENVIRONMENT 🚀\033[0m"
echo -e "\033[1;36m=========================================\033[0m"

# 1. Check for .env file
if [ ! -f .env ]; then
    echo -e "\033[1;31m❌ .env file is missing! Please copy .env.example to .env and add your ANTHROPIC_API_KEY and GITHUB_TOKEN.\033[0m"
    exit 1
fi

# 2. Get Smee URL
read -p "Enter your Smee.io webhook URL (Go to https://smee.io/ to generate one): " SMEE_URL
if [ -z "$SMEE_URL" ]; then
    echo -e "\033[1;31m❌ Smee URL is required for live GitHub webhooks.\033[0m"
    exit 1
fi

# Helper function to run processes in the background and log to a file
run_background() {
    local name=$1
    shift
    echo -e "\033[1;33mStarting $name...\033[0m"
    "$@" > "$name.log" 2>&1 &
    local pid=$!
    echo -e "\033[0;32m$name started (PID: $pid). Logs in $name.log\033[0m"
    echo $pid >> .demo_pids
}

# Clean up previous PIDs file
rm -f .demo_pids

echo -e "\n\033[1;33m[1/3] Starting FastAPI Server on port 3000...\033[0m"
run_background "uvicorn" uvicorn apps.api.main:app --port 3000 --reload

echo -e "\033[1;33m[2/3] Starting Celery Worker...\033[0m"
run_background "celery" celery -A apps.api.tasks worker --loglevel=info

echo -e "\033[1;33m[3/3] Starting Smee Webhook Forwarding...\033[0m"
echo -e "\033[0;32mForwarding webhooks from $SMEE_URL to http://127.0.0.1:3000/webhooks/github\033[0m"
run_background "smee" npx smee-client --url "$SMEE_URL" --path /webhooks/github --port 3000

echo -e "\n\033[0;32m✅ All services started in the background!\033[0m"
echo -e "\033[0;36mTo tail the logs, run: tail -f uvicorn.log celery.log smee.log\033[0m"
echo -e "\033[0;36mTo stop the services later, run: kill \$(cat .demo_pids)\033[0m"

echo -e "\n\033[1;36mNEXT STEPS:\033[0m"
echo -e "1. Go to your GitHub Repository -> Settings -> Webhooks"
echo -e "2. Add a new webhook:"
echo -e "   - Payload URL: $SMEE_URL"
echo -e "   - Content type: application/json"
echo -e "   - Events: Select 'Pull requests'"
echo -e "3. Create a test PR in GitHub to see the AI Historian in action!"
