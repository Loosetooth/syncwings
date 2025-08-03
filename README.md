# Syncthing Multi-User Manager (Next.js)

This project provides a simple web interface and backend for managing multiple Syncthing instances, one per user. It is designed for small-scale, self-hosted setups where each user gets their own isolated Syncthing container, managed via Docker Compose.

## Features
- User registration and login (file-based, no database required)
- Each user is linked to a unique Syncthing instance
- Admin can add or remove users

## Environment Variable
- `DATA_DIR` (optional):
  - Set this to specify a custom directory for storing the `users.json` file (user database) and user's syncthing data.
  - If not set, the project root directory is used by default.
  - Example usage:
    ```sh
    DATA_DIR=/opt/syncthing-multiuser-data npm start
    ```

## Usage
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```
3. The app will be available at `http://localhost:3000` by default.

## Notes
- This project is intended for Linux environments.
- All user and instance data is stored in a single JSON file for simplicity.
- For production, secure the backend and restrict access to Docker management features.

---

Feel free to modify or extend for your own use case!
