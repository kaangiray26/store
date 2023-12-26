FROM node:19-alpine
WORKDIR /store

# Copy files
ADD js ./js
ADD package.json ./
ADD server.js ./

# Create directories
RUN mkdir -p ./uploads

# RUN npm install
RUN npm install

EXPOSE 3000

CMD ["node", "server.js"]