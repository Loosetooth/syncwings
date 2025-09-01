# Syncthing Multi-User

<p align="center">
  <img src="public/logo.svg" alt="Project Logo" height="120">
</p>

This project provides a simple web interface and backend for managing multiple [Syncthing](https://syncthing.net/) (and optionally, [FileStash](https://www.filestash.app/)) instances, one per user. It is designed for small-scale, self-hosted setups where each user gets their own isolated Syncthing container, managed via Docker Compose.

## Features
- User registration and login (file-based, no database required)
- Each user is linked to a unique Syncthing instance
- Admin can add or remove users
- Optional [FileStash](https://www.filestash.app/) integration for file management
- AMD64 and ARM64 support

## Getting Started

### Requirements
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your server
- A Linux environment (the project is designed for Linux hosts)

### Sample `docker-compose.yml`

```yaml
services:
  syncthing-multi-user:
    image: loosetooth/syncthing-multi-user:latest
    environment:
      # Set the data directory inside the container
      - DATA_DIR=/data
      # Set the external data directory (adjust this path as needed)
      # This has to be equal to the bind mount for the DATA_DIR in the volumes section below
      - DATA_DIR_EXTERNAL=/path/to/large/disk/syncthing-multi-user/data
      # Optionally set the port for the Next.js app (default: 3000)
      - PORT=3001
      # Set the session secret from the .env file
      - SESSION_SECRET=${SESSION_SECRET}
    # The ./data directory must be created and owned by the same UID:GID as set below
    volumes:
      # The host path should be the same as DATA_DIR_EXTERNAL
      - /path/to/large/disk/syncthing-multi-user/data:/data
      # Mount the Docker socket to allow spawning Syncthing and FileStash containers
      - /var/run/docker.sock:/var/run/docker.sock
    # Set to UID:GID where GID matches the docker group on your host
    # UID HAS TO BE "1000" because FileStash uses this UID internally
    user: "1000:131"
    restart: unless-stopped
    network_mode: host
```

Place the above `docker-compose.yml` in a directory on your server.
Adjust `/path/to/large/disk/syncthing-multi-user/data` to a suitable location on your host with enough space for user data.
Currently, all user data, including Syncthing's `config` folder and database files, are stored in this directory.

### Secret Generation
Generate a strong session secret for signing cookies:
```sh
openssl rand -base64 64 | tr -d '\n'; echo
```

Create a `.env` file next to your `docker-compose.yml` and add the generated secret:
```env
SESSION_SECRET=your-very-secret-string
```
Replace `your-very-secret-string` with the output from the command above.
Make sure to keep this secret safe and do not share it publicly.

### Starting the service
From the directory containing your `docker-compose.yml` and `.env` file, run:
```sh
docker compose up -d
```

The app will be available at `http://localhost:3000` (or the port you specified in the `PORT` environment variable).
The first user to register will be an administrator by default.

### Next Steps

1. Set up a [reverse proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/) on your webserver (e.g., Nginx, Apache, Caddy) to handle HTTPS and domain routing.
2. Configure firewall rules and/or Port Forwarding to allow:
   - accessing the syncthing-multi-user UI
   - allow Syncthing instances to create direct connections

#### Port ranges

In order to allow multiple instances of Syncthing to run on the same host, each instance is configured to use a unique port range based on the user's ID.
Depending on the number of users, you need to open the following ports in your firewall and/or router:

- TCP/UDP ports: `22003-22053` (for Syncthing device connections)

If these ports are not opened, Syncthing connections will still work via relays, but direct connections will not be possible.
This might result in slower sync speeds.

## Environment Variables
- `SESSION_SECRET` (required):
  - Secret key used to sign and verify session cookies (JWTs). Must be set to a long, random string in production.
  - Generate with `openssl rand -base64 64` and remove the newline from the output.

- `DATA_DIR` (optional):
  - Set this to specify a custom directory for storing the `users.json` file (user database) and user's syncthing data.
  - If not set, the project root directory is used by default.

- `DATA_DIR_EXTERNAL` (recommended for Docker Compose):
  - Set this to specify the absolute host path for user Syncthing data and config directories when generating Docker Compose files.
  - Ensures that Syncthing containers mount user data/config from a fixed location on the host (e.g., `/opt/syncthing-multiuser-data`).
  - If not set, defaults to `DATA_DIR` if it is set, otherwise falls back to `/data`.

- `SYNCTHING_CONTAINER_TAG` (optional):
  - Set this to specify the tag/version of the Syncthing container image used for each user instance (default: `2.0.1`).
  - The container used is [`syncthing/syncthing`](https://hub.docker.com/r/syncthing/syncthing).

- `PORT` (optional):
  - Set this to specify the port the Next.js app should listen on (default: 3000).
  - Useful if port 3000 is already in use on your server.

- `NEXT_PUBLIC_ENABLE_FILE_STASH` (optional):
  - Set this to `true` to enable the File Stash integration, allowing users to upload and manage files through the web interface.
  - Defaults to `true` if not set.

- `FILESTASH_CONTAINER_TAG` (optional):
  - Set this to specify the tag/version of the File Stash container image used. If not set, the default `FILESTASH_CONTAINER_DIGEST` is used. (See below.)
  - The container used is [`machines/filestash`](https://hub.docker.com/r/machines/filestash).

- `FILESTASH_CONTAINER_DIGEST` (optional):
  - Set this to specify the digest of the File Stash container image used. This ensures that a specific, immutable version of the image is used.
  - If not set, defaults to `sha256:29b785d6c7a362581c2254dcafbe91d76a20a73871a520dc85d7d970113bc965`.
  - If both `FILESTASH_CONTAINER_TAG` and `FILESTASH_CONTAINER_DIGEST` are set, the digest will be used.
  - Please include the `sha256:` prefix when setting this variable.

- `EXPLICITLY_LISTEN_TO_LOCAL_IP` (optional):
  - Set this to `true` to have Syncthing explicitly listen on the local IP address specified in `LOCAL_IP_ADDRESS`.
  - This is useful for LAN discovery, which might not work properly when Syncthing is inside a Docker container. (See [this github issue](https://github.com/syncthing/syncthing/issues/1234https://github.com/syncthing/syncthing/issues/8445) for more context.)
  - Needs to be set in combination with the `LOCAL_IP_ADDRESS` variable.
  - Be aware that this pollutes the logs with periodic failure messages because the local ip cannot be bound to.

- `LOCAL_IP_ADDRESS` (optional):
  - Set this to the local IP address of your server (e.g., `192.168.1.100`).
  - This needs to be set in combination with the above `EXPLICITLY_LISTEN_TO_LOCAL_IP` variable to ensure Syncthing listens on this IP address.

- `MAX_USERS` (optional):
  - Set this to limit the maximum number of users that can register. If not set, defaults to `10`.

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
- All user adata is stored in a single JSON file for simplicity.

---

Feel free to modify or extend for your own use case!
