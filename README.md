# 🧠 Lore: Engineering Historian

<div align="center">
  <p><strong>Your codebase's memory.</strong></p>
  <p>An AI-powered graph engine that automatically extracts, tracks, and visualizes architectural decisions from Pull Requests, Jira, and Slack.</p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.103.1-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Neo4j](https://img.shields.io/badge/Neo4j-5.x-008CC1?logo=neo4j)](https://neo4j.com/)
</div>

---

## 🚀 The Problem
In fast-moving engineering teams, **why** a decision was made is often lost. Documentation goes stale, Slack messages disappear, and institutional knowledge gets trapped in "silos" (single developers). When those developers leave or shift teams, the context is lost forever, leading to architectural drift and repeated mistakes.

## 💡 The Solution: Lore
Lore connects directly to your team's workflow (GitHub, Jira, Slack) and uses LLMs to passively listen and build a **Knowledge Graph** of your architecture.

Whenever an engineer merges a PR with a significant architectural change, Lore:
1. **Extracts** the context (Why, What, Who).
2. **Drafts** a Markdown Architecture Decision Record (MADR) automatically.
3. **Graphs** the decision against your modules and dependencies in Neo4j.
4. **Protects** your codebase by blocking future PRs that violate previous decisions.

## ✨ Key Features
- **Auto-ADR Generation**: Merging a PR automatically drafts a professional ADR using Gemini 1.5 Pro.
- **The PR Interceptor**: GitHub Actions integration that blocks PRs attempting to violate active architectural contracts.
- **Knowledge Silo Heatmap**: A D3-powered treemap that visually flags "At Risk" modules where only one developer holds the context.
- **Ask Lore**: A conversational interface to chat with your engineering history (e.g., *"Why did we choose PostgreSQL?"*).

## 🛠️ Architecture

Lore is built as a highly scalable monorepo.

*   **Frontend**: Next.js 15 (App Router), TailwindCSS v4, shadcn/ui, D3.js.
*   **Backend**: Python FastAPI, LangChain, Neo4j (Graph Database), PostgreSQL (Relational Data).
*   **AI Engine**: Google Gemini 1.5 Pro (via `ai-sdk/google`).
*   **Infrastructure**: Upstash Redis (Rate Limiting), Docker, GitHub Actions.

## 🏃‍♂️ Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker (for Neo4j and PostgreSQL)

### 1. Clone & Install
```bash
git clone https://github.com/tarot-club-hackathons/lore.git
cd lore
```

### 2. Start the Frontend
```bash
cd apps/web
npm install
npm run dev
# The frontend will run on http://localhost:3000
```

### 3. Start the Backend (FastAPI)
*(Ensure Docker is running for the database containers)*
```bash
cd apps/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# The backend will run on http://localhost:8000
```

## ☁️ Deployment Modes (Day 9)

Lore supports a Dual Deployment architecture, meaning the **exact same codebase** powers both a fully open-source local environment and a massively scalable cloud environment. 

### 1. Cloud Mode (Production)
For live production, Lore uses Cognee Cloud.
Simply set the following environment variables:
`COGNEE_MODE=cloud`
`COGNEE_API_KEY=your_key`
`COGNEE_CLOUD_URL=https://api.cognee.ai`

Then run:
```bash
docker-compose -f docker-compose.prod.cloud.yml up -d
```

### 2. Local Mode (On-Premise Privacy)
For strict data privacy, Lore can run Cognee entirely locally (zero external dependencies). This uses the open-source python package to build the knowledge graph on your own Neo4j instance.
Simply set `COGNEE_MODE=local` and run:
```bash
docker-compose -f docker-compose.prod.local.yml up -d
```
*Note: This spins up a local Neo4j container automatically.*

## 🤝 Contributing
For the Hackathon, please ensure any architectural changes you make are tagged with the relevant Jira ticket in your PR description so Lore can track it!

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
