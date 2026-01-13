#!/bin/bash

# Script to install dependencies and start the exam corrector application

echo "Installing dependencies..."
cd "$(dirname "$0")"
npm install

if [ $? -eq 0 ]; then
    echo "Dependencies installed successfully!"
    echo "Starting development server..."
    npm run dev
else
    echo "Error installing dependencies"
    exit 1
fi
