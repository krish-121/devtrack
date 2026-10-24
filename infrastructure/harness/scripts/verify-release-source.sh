#!/bin/sh
set -eu

if [ -n "$(git status --porcelain)" ]; then
  echo 'Release requires a clean checkout.' >&2
  exit 1
fi

commit=$(git rev-parse --verify HEAD)
main_commit=$(git ls-remote --exit-code origin refs/heads/main | cut -f1)
if [ "$commit" != "$main_commit" ]; then
  echo 'Release requires the current reviewed main commit. No artifact was published.' >&2
  exit 1
fi

printf '%s\n' "$commit"
