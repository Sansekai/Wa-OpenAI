FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN apk add --no-cache git

RUN mkdir -p /opt/app

WORKDIR /opt/app

RUN adduser -S app

COPY ./* .

RUN yarn global add pm2
RUN yarn install

RUN chown -R app /opt/app

USER app

EXPOSE 3000

CMD [ "pm2-runtime", "index.js" ]