#!/bin/sh
set -eu

# Install the repository's exact toolchain in the isolated build workspace.
# Nothing is installed globally on the developer's machine.
node_version=$(tr -d '\r\n' < .nvmrc)
case "$node_version" in
  ''|*[!0-9.]*) echo 'Expected a numeric Node version in .nvmrc.' >&2; exit 1 ;;
esac
node_directory="$PWD/.ci/node"
node_archive="node-v${node_version}-linux-x64.tar.xz"
mkdir -p "$node_directory" "$PWD/.ci/downloads"
curl --fail --silent --show-error --location \
  "https://nodejs.org/dist/v${node_version}/${node_archive}" \
  --output "$PWD/.ci/downloads/$node_archive"
curl --fail --silent --show-error --location \
  "https://nodejs.org/dist/v${node_version}/SHASUMS256.txt" \
  --output "$PWD/.ci/downloads/SHASUMS256.txt"
(cd "$PWD/.ci/downloads" && sha256sum --check --ignore-missing SHASUMS256.txt)
tar --extract --xz --file "$PWD/.ci/downloads/$node_archive" \
  --directory "$node_directory" --strip-components=1
export PATH="$node_directory/bin:$PATH"
npm_version=$(node -p "require('./package.json').packageManager.split('@')[1]")
npm install --global --prefix "$node_directory" "npm@$npm_version"
node --version
npm --version
docker version --format '{{.Server.Version}}'
docker compose version
