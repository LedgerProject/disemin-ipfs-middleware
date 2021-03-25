# AgroXM IPFS Companion Application

Middleware application that facilitates AgroxM hardware node transactions with IPFS.

## Intro

This Node.js application is a HTTP server that listens for weather telemetry data IPFS hashes and handles all IPFS file
operations required for proper data storage and retrieval.

### Endpoints

The following endpoints are currently available:

- `/ipfs/{cid}`: Returns the telemetry file contents for the given
  IPFS [CID](https://docs.ipfs.io/concepts/content-addressing/) hash.
- `/weather/{geohash}/latest`: Returns the latest weather telemetry stored in IPFS for the
  location's [geohash](https://en.wikipedia.org/wiki/Geohash).

## Prerequisites

You need [Node.js](https://nodejs.org) and [npm](https://www.npmjs.com/get-npm) installed, if you want to run directly
with node/npm. Alternatively, you need [Docker](https://docs.docker.com/engine/install/).

## Envinronment

Define the following environment variables:

- `IPFS_URL`: *Required*. The IPFS node url to perform all IPFS operations on.
- `HOST`: *Optional*. The host IP address the server will listen on. Defaults to `127.0.0.1`. Use `0.0.0.0` if you need
  to make the server publicly available.
- `PORT`: *Optional*. The host port the server will listen on. Defaults to `3001`.

## Deploy

The app is dockerized, so you can run with Docker.

1. Clone the source code and navigate to the cloned folder

   ```shell
   git clone <this-repo-url> agroxm-ipfs-middleware && cd ./agroxm-ipfs-middleware
   ```

2. Build docker image

   ```shell
   docker build -t agroxm-ipfs-middleware .
   ```

3. Run docker image

   ```shell
   docker run -p 3001:3001 -d --restart=unless-stopped agroxm-ipfs-middleware -e IPFS_URL=<your-ipfs-node-url> -e PORT=3001
   ```

   Alternatively, if you want to specify a different port for the server (e.g. `8080`) to run on in the container, and a
   different port for the host to expose (e.g. `5000`), run the following:

   ```shell
   docker run -p 5000:8080 -d --restart=unless-stopped agroxm-ipfs-middleware -e IPFS_URL=<your-ipfs-node-url> -e PORT=8080
   ```
