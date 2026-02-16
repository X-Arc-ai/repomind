# RepoMind

**Understand any codebase in seconds, not weeks.**

RepoMind is an AI-powered repository exploration tool that loads entire codebases into Claude Opus 4.6's 1M token context window. Ask questions, get architecture diagrams, and truly understand any codebase instantly.

## Features

- **1M Token Context** — Entire codebases loaded at once, not fragmented chunks
- **Adaptive Thinking** — Claude Opus 4.6's extended thinking for deep reasoning
- **Interactive Architecture Diagrams** — Auto-generated diagrams showing module dependencies
- **Streaming Responses** — Watch reasoning happen in real-time with specific file:line references
- **Multi-Viewport Ready** — Responsive design works on desktop, tablet, and mobile

## Demo

Coming soon! The live demo will be available once deployed to Cloudflare Pages.

## Quick Start

### Prerequisites

- Node.js 18+ or 20.x
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/X-Arc-ai/repomind.git
cd repomind

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Production Build

```bash
npm run build
npm start
```

## Usage

1. **Load a Repository**
   - Paste any public GitHub URL, or
   - Use quick-start buttons (Express, React, Next.js)

2. **Ask Questions**
   - "How does routing work?"
   - "Find security issues"
   - "Explain the architecture"

3. **Generate Diagrams**
   - Click "Generate" in the Architecture tab
   - Optionally specify a focus area (e.g., "routing system")

## Deployment

### Cloudflare Pages

1. **Build Settings**:
   - Build command: `npm run build`
   - Output directory: `.next`
   - Framework: Next.js

2. **Environment Variables**:
   - `ANTHROPIC_API_KEY` — Your Claude API key
   - `NODE_VERSION` — `20` (optional)

### Other Platforms

RepoMind is a standard Next.js 16 app and can be deployed to any platform that supports Next.js:
- Vercel
- Netlify
- AWS Amplify
- Railway
- Self-hosted with Docker

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS, shadcn/ui
- **AI**: Claude Opus 4.6 via Anthropic API
- **Diagrams**: React Flow
- **Markdown**: react-markdown with syntax highlighting

## Architecture

RepoMind uses Claude Opus 4.6's 1M context window to load entire repositories:

1. **Repository Ingestion** — Clones the repo and loads all source files
2. **Context Assembly** — Builds a structured context document with file contents
3. **Session Management** — Maintains conversation state with full repo context
4. **Streaming Responses** — Uses Server-Sent Events for real-time output
5. **Diagram Generation** — Analyzes codebase structure and generates interactive visualizations

## Contributing

This project was built for the Cerebral Valley Hackathon 2026. Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Powered by Claude Opus 4.6
- Created for Cerebral Valley Hackathon 2026

---

**Made with ❤️ by X-Arc AI**
