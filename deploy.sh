#!/bin/bash
echo "$SERVER_PASSWORD" | sudo su
cd /home/orlovsky/pyrrha
git reset --hard
git pull
cd /home/orlovsky/pyrrha/containers
docker-compose pull
docker-compose down
docker-compose up -d
