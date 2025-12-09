# Ocean Frenzy Game

A fun ocean-themed game built with React, TypeScript, and Vite.

## Features

- Interactive ocean game mechanics
- Customizable assets and graphics
- Docker support for easy deployment

## Prerequisites

- Node.js 20+ (or use nvm with `.nvmrc`)
- Docker (for containerized deployment)

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your `GEMINI_API_KEY`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Docker Deployment

### Building the Docker Image

Build and push to Docker Hub:
```bash
./build_and_push.sh [tag]
```

If no tag is provided, `latest` will be used.

### Running with Docker

Deploy locally using the deployment script:
```bash
./deploy.sh start      # Start the game
./deploy.sh stop       # Stop the game
./deploy.sh restart    # Restart the game
./deploy.sh status     # Check status
./deploy.sh logs       # View logs
./deploy.sh pull       # Pull latest image
./deploy.sh remove     # Remove container
```

The game will be available at `http://localhost:8080` when running.

### Pulling from Docker Hub

If you want to run the pre-built image:
```bash
docker pull dhimarketer/oceanfrenzy:latest
docker run -d -p 8080:80 --name oceanfrenzy dhimarketer/oceanfrenzy:latest
```

## Project Structure

- `index.tsx` - Main application entry point
- `gameLogic.ts` - Core game logic
- `gameLoop.ts` - Game loop and rendering
- `graphics.ts` - Graphics and asset management
- `audio.ts` - Audio management
- `components.tsx` - React components
- `settings.tsx` - Settings and configuration UI

## License

This project is open source and available for public use.
