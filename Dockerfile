FROM node:8.9.4

COPY ./package.json /package.json
COPY ./.babelrc /.babelrc
COPY ./app /app
COPY ./config /config

WORKDIR /
RUN git clone https://github.com/pandoraboxchain/pandora-abi ./pandora-abi
RUN npm i pm2 -g --quiet
RUN npm i --quiet
RUN npx babel ./app --out-dir ./app-compiled --presets=es2015,stage-2 --source-maps

EXPOSE 1111
EXPOSE 1337
EXPOSE 5858

VOLUME ["/logs"]

CMD ["pm2-docker", "start", "app/pm2.config.json"]
