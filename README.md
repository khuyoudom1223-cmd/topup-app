# Mobile Legends Top-Up App

React + Vite frontend with a Node.js backend for game top-up flows.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start frontend + backend together:

```bash
npm run dev
```

3. Open the app:

http://localhost:5173

## Useful Scripts

- `npm run dev`: Runs Vite and backend server concurrently.
- `npm run build`: Builds production frontend bundle.
- `npm run preview`: Serves built frontend for preview.
- `npm run server`: Starts backend API only.
- `npm run lint`: Runs ESLint.
- `npm run test`: Starts Vitest in interactive mode.
- `npm run test:watch`: Runs Vitest watch mode.
- `npm run test:run`: Runs tests once (CI style).
- `npm run test:ci`: Runs scoped lint for the Mobile Legends top-up flow, then the test suite.
- `npm run api:player:check`: Validates strict `/api/player` success and error JSON contract.
- `npm run api:player:postman`: Runs Postman collection assertions via Newman.
- `npm run api:player:postman:ci`: CI-friendly Newman run output.
- `npm run api:player:verify`: Runs both Node contract checks and Newman collection checks.

Player API utility endpoints:

- `GET /api/player/health`
- `GET /api/player?userId=...&serverId=...`

Postman:

- Import [postman/TopUpGG-Player-API.postman_collection.json](postman/TopUpGG-Player-API.postman_collection.json)
- Optional environment file: [postman/local.postman_environment.json](postman/local.postman_environment.json)
- Default variable: `baseUrl = http://localhost:3001`

## Testing

The project uses Vitest + Testing Library with JSDOM.

Current focused coverage includes:

- Input sanitization behavior for User ID and Zone ID.
- Verification timeout and retry flow.
- Keyboard navigation for selection radio groups.

Run all tests once:

```bash
npm run test:run
```

Run CI validation locally:

```bash
npm run test:ci
```
