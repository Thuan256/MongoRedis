#!/bin/bash
clear

while true
do
  git reset --hard
  git pull
  redis-server --daemonize yes
  redis-server --port 1609
  node index.js
  sleep 5
done
