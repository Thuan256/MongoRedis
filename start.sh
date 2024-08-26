#!/bin/bash
clear

while true
do
  git checkout HEAD^ .
  git pull
  node index.js
  sleep 5
done
