#!/bin/bash
cd /home/orlovsky/pyrrha
sudo git reset --hard
sudo git pull
cd /home/orlovsky/pyrrha/containers
sudo docker-compose pull
sudo docker-compose down
sudo docker-compose up -d
exit
