#!/bin/bash

# Kill processes using ports 3001-3010
for port in {3001..3010}; do
  pid=$(lsof -ti:$port)
  if [ ! -z "$pid" ]; then
    echo "Killing process using port $port (PID: $pid)"
    kill -9 $pid
  fi
done

# Kill processes using ports 5173-5180
for port in {5173..5180}; do
  pid=$(lsof -ti:$port)
  if [ ! -z "$pid" ]; then
    echo "Killing process using port $port (PID: $pid)"
    kill -9 $pid
  fi
done 