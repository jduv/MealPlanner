#!/bin/bash
DEPLOY_DIR="${HOME}/Sites/MealPlanner"

# Check to see if the directory exists.
if [ ! -d "$DEPLOY_DIR" ]; then
	mkdir "$DEPLOY_DIR"
fi

# Copy everything over.
cp -rf Ui/* "$DEPLOY_DIR"

open -a "Google Chrome" "http://localhost/~jduv/MealPlanner/index.html"