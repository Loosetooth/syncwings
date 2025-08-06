# Syncthing Multi-User Manager (Next.js)

This project provides a simple web interface and backend for managing multiple Syncthing instances, one per user. It is designed for small-scale, self-hosted setups where each user gets their own isolated Syncthing container, managed via Docker Compose.

## Features
- User registration and login (file-based, no database required)
- Each user is linked to a unique Syncthing instance
- Admin can add or remove users

## Environment Variables
- `DATA_DIR` (optional):
  - Set this to specify a custom directory for storing the `users.json` file (user database) and user's syncthing data.
  - If not set, the project root directory is used by default.
  - Example usage:
    ```sh
    DATA_DIR=/opt/syncthing-multiuser-data npm start
    ```
- `PORT` (optional):
  - Set this to specify the port the Next.js app should listen on (default: 3000).
  - Useful if port 3000 is already in use on your server.
  - Example usage:
    ```sh
    PORT=3001 npm start
    ```


## Usage

### Local Development
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```
3. The app will be available at `http://localhost:3000` by default.

### Docker
To build the Docker image:
```sh
docker build -t syncthing-multi-user .
```

To run the app using Docker Compose, use the provided `docker-compose.yml` as an example:
```sh
docker compose up
```

**Important Notes:**

1. The Docker container must be run with a group that has permissions to access the Docker socket (usually the `docker` group on your host). Set the `user:` field in your `docker-compose.yml` to use a group ID (GID) that matches the Docker group on your system. You can find the GID with:
   ```sh
   getent group docker
   ```
   Then update the `user:` field, e.g. `user: "1000:999"` if the Docker group GID is 999.

2. The mounted `DATA_DIR` folder (e.g. `./data`) must be created in advance and owned by the user specified in the `docker-compose.yml` file. For example, if you use `user: "1000:999"`, run:
   ```sh
   mkdir -p ./data
   chown 1000:999 ./data
   ```
   This ensures the app can write to the data directory without permission issues.

Adjust the compose file and permissions as needed for your environment.

## Notes
- This project is intended for Linux environments.
- All user and instance data is stored in a single JSON file for simplicity.
- For production, secure the backend and restrict access to Docker management features.

---

Feel free to modify or extend for your own use case!
