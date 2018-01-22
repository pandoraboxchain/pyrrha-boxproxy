FROM node:8.9.4

COPY ./package.json /package.json
COPY ./app /app
COPY ./config /config
COPY ./pandora-abi /pandora-abi

WORKDIR /
RUN npm i

CMD [ "npm", "start" ]

EXPOSE 1111 1337
