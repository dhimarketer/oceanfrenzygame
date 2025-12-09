# Ocean Frenzy Game

A fun ocean-themed game built with React, TypeScript, and Vite.

## Features

- Interactive ocean game mechanics
- Customizable assets and graphics
- Docker support for easy deployment
- Cross-platform support

## Quick Start (Easiest Method)

If you just want to run the game quickly using the pre-built Docker image:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dhimarketer/oceanfrenzygame.git
   cd oceanfrenzygame
   ```

2. **Make scripts executable:**
   ```bash
   chmod +x deploy.sh
   ```

3. **Start the game:**
   ```bash
   ./deploy.sh start
   ```
   
   The script will automatically:
   - Check if Docker is installed and running
   - Pull the latest image from Docker Hub if needed
   - Start the game container
   
4. **Access the game:**
   Open your browser and go to: `http://localhost:8080`

5. **Stop the game:**
   ```bash
   ./deploy.sh stop
   ```

## Prerequisites

- **Docker** (required for containerized deployment)
  - Install: https://docs.docker.com/get-docker/
  - Linux: `sudo apt-get update && sudo apt-get install docker.io`
- **Node.js 20+** (only needed for local development or building from source)
  - Use `nvm` with the included `.nvmrc` file: `nvm use`

## Installation & Running Options

### Option 1: Run Pre-built Docker Image (Recommended)

This is the easiest way - uses the pre-built image from Docker Hub:

```bash
# Clone the repository
git clone https://github.com/dhimarketer/oceanfrenzygame.git
cd oceanfrenzygame

# Make deploy script executable
chmod +x deploy.sh

# Start the game (will pull image automatically if needed)
./deploy.sh start
```

The game will be available at `http://localhost:8080`

### Option 2: Build from Source

If you want to build the Docker image yourself from the source code:

```bash
# Clone the repository
git clone https://github.com/dhimarketer/oceanfrenzygame.git
cd oceanfrenzygame

# Make scripts executable
chmod +x deploy.sh build_and_push.sh

# Build the Docker image
./deploy.sh build

# Start the game
./deploy.sh start
```

### Option 3: Local Development (Without Docker)

For development and testing:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your `GEMINI_API_KEY`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Deployment Script Usage

The `deploy.sh` script provides easy management of the game container:

```bash
./deploy.sh start      # Start the game (pulls image if not found)
./deploy.sh stop       # Stop the game
./deploy.sh restart    # Restart the game
./deploy.sh status     # Check if game is running
./deploy.sh logs       # View container logs (Press Ctrl+C to exit)
./deploy.sh pull       # Pull latest image from Docker Hub
./deploy.sh build      # Build image from local source code
./deploy.sh remove     # Remove the container
```

### What the Script Does

The `deploy.sh` script automatically:
- ✅ Checks if Docker is installed
- ✅ Checks if Docker daemon is running
- ✅ Verifies Docker permissions
- ✅ Checks network connectivity (for pulling images)
- ✅ Checks if port 8080 is available
- ✅ Pulls the image from Docker Hub if not found locally
- ✅ Starts the container with proper configuration

## Building and Pushing to Docker Hub

If you want to build and push your own version to Docker Hub:

```bash
# Make script executable
chmod +x build_and_push.sh

# Build and push (will ask for confirmation)
./build_and_push.sh [tag]

# Example with version tag
./build_and_push.sh v1.0.0
```

If no tag is provided, `latest` will be used.

**Note:** You need to be logged in to Docker Hub:
```bash
docker login
```

## Manual Docker Commands

If you prefer to use Docker commands directly:

### Pull and Run Pre-built Image
```bash
docker pull dhimarketer/oceanfrenzy:latest
docker run -d -p 8080:80 --name oceanfrenzy --restart unless-stopped dhimarketer/oceanfrenzy:latest
```

### Build from Source
```bash
docker build -t dhimarketer/oceanfrenzy:latest .
docker run -d -p 8080:80 --name oceanfrenzy --restart unless-stopped dhimarketer/oceanfrenzy:latest
```

## Project Structure

- `index.tsx` - Main application entry point
- `gameLogic.ts` - Core game logic
- `gameLoop.ts` - Game loop and rendering
- `graphics.ts` - Graphics and asset management
- `audio.ts` - Audio management
- `components.tsx` - React components
- `settings.tsx` - Settings and configuration UI
- `Dockerfile` - Docker build configuration
- `deploy.sh` - Deployment and management script
- `build_and_push.sh` - Build and push script for Docker Hub

## Troubleshooting

### Docker not found
```bash
# Install Docker
sudo apt-get update && sudo apt-get install docker.io

# Start Docker service
sudo systemctl start docker

# Add user to docker group (to run without sudo)
sudo usermod -aG docker $USER
# Then log out and log back in
```

### Port 8080 already in use
Edit `deploy.sh` and change `HOST_PORT=8080` to a different port (e.g., `HOST_PORT=3000`)

### Permission denied on scripts
```bash
chmod +x deploy.sh build_and_push.sh
```

### Image pull fails
- Check your internet connection
- Verify Docker Hub is accessible: `docker pull hello-world`
- Make sure you're logged in: `docker login`

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

This project is open source and available for public use.
