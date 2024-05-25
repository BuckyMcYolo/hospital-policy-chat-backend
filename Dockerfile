FROM node:21.6.2

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json ./

RUN yarn install

# Bundle app source
COPY . .

EXPOSE 8000

# build then start

CMD ["yarn", "build", "start"]