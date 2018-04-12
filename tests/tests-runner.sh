#!/bin/sh

if [ "$WITH_COVERAGE" -eq 0 ]; then 
    echo "Running tests without coverage"
    npx mocha --require @babel/register -R spec --timeout 70000 ./tests/spec/**/*.test.js

else 
    echo "Running tests with coverage"
    npx istanbul cover _mocha --report lcovonly -- --require @babel/register -R spec --timeout 70000 ./tests/spec/**/*.test.js
    cat ./coverage/lcov.info | npx codacy-coverage --token ecb18a8ad15a42498b68baf016654812
fi
