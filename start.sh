#!/bin/bash
clear

while true
do
  git reset --hard
  git pull
  node index.js
  sleep 5
done
