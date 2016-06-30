#!/usr/bin/env bash
set -e
cd "$(dirname $0)/.."
rm -rf tmp
mkdir tmp
node_modules/.bin/intern-client config=tests/intern reporters=Console
