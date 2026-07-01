# CareBridge System

A Laravel backend paired with a React/Vite frontend.

## Repository structure

- `backend/` — Laravel application, PHP backend, APIs, routes, views, and server logic.
- `frontend/` — React/Vite application, UI source code, frontend assets, and build config.
- `ai/` — Python AI service used by the application.
- `frontend/scripts/` — helper scripts for setup, testing, backup, and scheduler tasks.

## Requirements

- PHP 8.2+
- Composer
- Node.js 18+
- npm
- MySQL
- Python 3.11+ (for the AI service)
- Windows PowerShell for the provided `.ps1` helper scripts

## Setup

1. Open a PowerShell terminal in the project root.
2. Run the backend setup and install Composer dependencies:

   ```powershell
   cd backend
   composer install
   ```

3. Create the Laravel environment file if it does not exist:

   ```powershell
   cd backend
   copy .env.example .env
   php artisan key:generate
   ```

4. Install frontend dependencies:

   ```powershell
   cd frontend
   npm install
   ```

5. Install Python dependencies for the AI service:

   ```powershell
   cd ai
   python -m pip install -r requirements.txt
   ```

6. Run database migrations and seed demo data:

   ```powershell
   cd backend
   php artisan migrate --force
   php artisan db:seed --force
   ```

## Run the system

Start the Laravel web application and React frontend together:

```powershell
cd backend
composer run dev
```

This starts:

- Laravel app on `http://127.0.0.1:8000`
- Vite frontend dev server via the backend dev script

If you want to run only the frontend dev server:

```powershell
cd frontend
npm run dev
```

If you want to build the frontend for production:

```powershell
cd frontend
npm run build
```

## Optional helpers

The helper scripts are now located in `frontend/scripts/`.

- `frontend/scripts/setup.ps1` — one-time setup helper for backend, frontend, AI service, and storage directories.
- `frontend/scripts/install-scheduled-tasks.ps1` — register Windows scheduled tasks for backups and follow-up actions.
- `frontend/scripts/full_business_flow_test.ps1` — API business flow test script.

## Notes

- `backend/` contains the Laravel server and should remain separate from the frontend code.
- `frontend/` contains the React application and Vite configuration.
- If you use the helper scripts, run them from the project root or their new location in `frontend/scripts/`.
  