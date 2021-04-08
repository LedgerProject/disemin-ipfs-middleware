# IPFS Middleware Application

IPFS is essentially a distributed file system. As a protocol, it allows many file operations (like copy, remove, etc) that typically exist in traditional file systems. These operations are exposed as commands via a CLI or via a HTTP RPC API. Both of these act on a specific IPFS node.

Although very powerful, this protocol requires multiple commands/HTTP API calls for storing data in a way that is meaningful to the “real world”, e.g. using appropriate file names, organizing files in folders with tree structure, publishing CIDs to IPNS, etc. Having an IoT sensor node perform all these operations on its own would be counterintuitive, as the node’s primary focus is data acquisition and storage, using minimal energy and data.

The EXM **IPFS Middleware** is a backend (Node.js) application that takes care of all the necessary file operations, after a sensor node stores a file on IPFS. It acts as a lightweight HTTP server that listens for requests from the sensor node. As its primary purpose, once it receives an IPFS CID from a sensor node, the middleware performs all the required IPFS file operations. The sensor node only needs to use a single HTTP API call.

## Functionality

The following endpoints are currently available:

- `GET /ipfs/{cid}`: Returns the file contents for the given IPFS [CID](https://docs.ipfs.io/concepts/content-addressing/) hash.

- `POST /ipfs/{cid}`: Triggers the necessary IPFS [CID](https://docs.ipfs.io/concepts/content-addressing/) file organizing operations. The method returns immediately with HTTP status 200 and empty body, and the operations take palce in the background.

- `GET /weather/{geohash}/latest`: Returns the latest weather telemetry stored in IPFS for the location's [geohash](https://en.wikipedia.org/wiki/Geohash).

- `POST /chainlink`: As the above, it returns the latest weather telemetry stored in IPFS for the location's [geohash](https://en.wikipedia.org/wiki/Geohash). However, this endpoint acts as a [Chainlink external adapter](https://docs.chain.link/docs/developers), using the appropriate request/response format. The geohash is passed to the adapter as a POST body, inside the request's `data` object. The weather telemetry is returned again in the `data` object of the response.

## Prerequisites

You need [Node.js](https://nodejs.org) and [npm](https://www.npmjs.com/get-npm) installed, if you want to run directly
with node/npm. Alternatively, you need [Docker](https://docs.docker.com/engine/install/).

## Envinronment

Define the following environment variables:

- `IPFS_URL`: *Required*. The IPFS node url to perform all IPFS operations on.
- `HOST`: *Optional*. The host IP address the server will listen on. Defaults to `0.0.0.0`. Use `127.0.0.1` if you need
  to make the server available only to localhost, or only to other containers if you run with docker.
- `PORT`: *Optional*. The host port the server will listen on. Defaults to `3001`.

## Deploy

The server is dockerized, so you can run with Docker.

1. Clone the source code and navigate to the cloned folder

   ```shell
   git clone <this-repo-url> ipfs-middleware && cd ./ipfs-middleware
   ```

2. Build docker image

   ```shell
   docker build -t ipfs-middleware .
   ```

3. Run docker image

   ```shell
   docker run -p 3001:3001 -d --restart=unless-stopped -e IPFS_URL=<your-ipfs-node-url> -e PORT=3001 ipfs-middleware
   ```

   Alternatively, if you want to specify a different port for the server (e.g. `8080`) to run on in the container, and a
   different port for the host to expose (e.g. `5000`), run the following:

   ```shell
   docker run -p 5000:8080 -d --restart=unless-stopped -e IPFS_URL=<your-ipfs-node-url> -e PORT=8080 ipfs-middleware
   ```
