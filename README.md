# Adaptive Cognitive Ebook

A modern, microservice-based web application with an interactive frontend and distributed backend processing.

## Tech Stack
* **Frontend**: React, TypeScript, Vite
* **Backend**: Node.js, Express (Microservices Architecture)
* **Infrastructure**: Docker, Docker Compose
* **CI/CD**: GitHub Actions, AWS (ECR, EC2, SSM)

## How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/nandhakumar12/Cognitive-adaptive-Ebook.git
cd Cognitive-adaptive-Ebook
```

### 2. Configure Environment Variables
You need to set up your local environment variables before running the application. Use the provided example files as templates:
```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```
*(Make sure to open the `.env` files and add any required local keys or database connections if necessary).*

### 3. Start the Application
Run the entire microservice stack using Docker Compose. The `--build` flag ensures your images are freshly compiled.
```bash
docker-compose up --build -d
```
The frontend application will securely start and be accessible at `http://localhost`. The backend microservices (gateway, data-service, etc.) will run automatically in the background on their designated ports.

---

## Common Docker Commands

Here are the commands you will use most often while developing and testing the application:

* **Start all services in detached mode:**
  ```bash
  docker-compose up -d
  ```

* **Stop and remove all running containers:**
  ```bash
  docker-compose down
  ```

* **Rebuild and start containers (useful after installing new npm packages):**
  ```bash
  docker-compose up --build -d
  ```

* **View live logs for all services:**
  ```bash
  docker-compose logs -f
  ```

* **View live logs for a specific service (e.g., frontend):**
  ```bash
  docker-compose logs -f frontend
  ```

* **List all currently active Docker containers:**
  ```bash
  docker ps
  ```

---

## Common Git Commands

Here are the standard commands used to manage version control for this repository:

* **Check the current status of your files:**
  ```bash
  git status
  ```

* **Stage all modified files for a commit:**
  ```bash
  git add .
  ```

* **Create a new commit with a descriptive message:**
  ```bash
  git commit -m "Update frontend components"
  ```

* **Push your commits to the remote repository:**
  ```bash
  git push origin main
  ```

* **Pull the latest changes from the remote repository:**
  ```bash
  git pull origin main
  ```

* **View the recent commit history:**
  ```bash
  git log --oneline
  ```
