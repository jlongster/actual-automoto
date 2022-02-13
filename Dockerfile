# base node image
FROM node:16-bullseye-slim as base

# Install deps for puppeteer
RUN apt-get --fix-missing update && apt-get install -f
RUN apt-get install -y openssl curl gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation  libnss3 lsb-release xdg-utils wget libgbm-dev

RUN mkdir /app

WORKDIR /app
ENV NODE_ENV=production
ENV DATA_DIR=/data

ADD . .
RUN yarn install

CMD ["yarn", "serve"]