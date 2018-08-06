FROM node:10

COPY ./package.json /package.json
COPY ./src /src
COPY ./config /config
COPY ./pyrrha-consensus /pyrrha-consensus
COPY ./pm2.config.json /pm2.config.json
COPY ./.gitmodules /.gitmodules
COPY ./.git /.git

WORKDIR /
RUN npm i pm2 -g --quiet
RUN npm i --quiet
RUN git submodule update --init --recursive --remote

EXPOSE 1111
ENV LOG_LEVEL=error

VOLUME ["/logs"]

CMD ["pm2-docker", "start", "pm2.config.json"]
