FROM node:8.9.4

VOLUME [ "/app", "/config", "/pandora-abi" ]

COPY ./package.json /package.json

WORKDIR /
RUN npm i --global nodemon
RUN npm i --quiet

CMD [ "npm", "start" ]

EXPOSE 1111 1337
