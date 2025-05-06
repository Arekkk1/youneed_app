## Running the Project with Docker

This project is set up for local development and production using Docker and Docker Compose. The setup includes two main services: a Node.js backend and a React (Vite) frontend, each with its own Dockerfile and environment configuration.

### Project-Specific Docker Requirements
- **Node.js Version:** Both backend and frontend use `node:22.13.1-slim` (set via `ARG NODE_VERSION=22.13.1` in Dockerfiles).
- **Non-root User:** Both services run as a non-root user (`appuser`) for improved security.
- **Memory Limit:** `NODE_OPTIONS="--max-old-space-size=4096"` is set for both services to limit Node.js memory usage.

### Environment Variables
- **Backend:**
  - Environment variables are loaded from `./backend-node/.env` (ensure this file exists and is configured for your environment).
- **Frontend:**
  - Environment variables are loaded from `./frontend/.env` (ensure this file exists and is configured for your environment).

### Exposed Ports
- **Backend API:** `5000` (accessible at `localhost:5000`)
- **Frontend (Vite Preview):** `4173` (accessible at `localhost:4173`)

### Build and Run Instructions
1. **Ensure Docker and Docker Compose are installed.**
2. **Configure environment variables:**
   - Fill in the required values in `./backend-node/.env` and `./frontend/.env` before building.
3. **Build and start the services:**
   ```sh
   docker compose up --build
   ```
   This will build both the backend and frontend images and start the containers.

### Special Configuration Notes
- The frontend service depends on the backend (`depends_on`), ensuring the backend starts first.
- Both services are connected via a custom Docker network (`app-network`).
- If you add a database or other dependencies, update the `docker-compose.yml` accordingly and use `depends_on` as needed.

### Summary Table
| Service         | Dockerfile Location | Port  | Env File                |
|-----------------|--------------------|-------|-------------------------|
| node-backend    | ./backend-node     | 5000  | ./backend-node/.env     |
| node-frontend   | ./frontend         | 4173  | ./frontend/.env         |

---

_This section was updated to reflect the current Docker-based setup for this project. Please ensure your environment files are present and configured before running the containers._
"# YouNeed_app" 
