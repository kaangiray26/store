# store
Simple Object Storage

## About
**store** is a simple object storage system built with Node.js and PostgreSQL for basic needs. You can use it to get, add, replace, list and delete objects. Files are placed in a directory and their metadata are kept in a database. All files have a unique ID and can be accessed by it. This allows us to use **store** as a content-delivery network (CDN) for static files.

## Installation
We have docker images for the server and it can be run with docker-compose. You can also take a Raspberry Pi and run it on it.

First, get the `docker-compose.yml` file:
```
curl -O https://kaangiray26.github.io/strore/docker-compose.yml
```

Then, run the server:
```
docker-compose up -d
```

On the first run, the server will create a user account for you. It will print the username and password to the console, which you can use for file operations.

## Usage
You can do basic file operations with our python script. It is just a wrapper for the REST API. You can also use the REST API directly. You can install the python script from [here](https://github.com/kaangiray26/store-py)

You can either use the `config.json` file to store your server url, username and password or you can pass them as arguments.

```
usage: main.py [-h] [-a file_path] [-d file_id] [-l] [-r file_id file_path] [-g file_id] [-s server_url] [-u username] [-p password]

kaangiray26/store-py

options:
  -h, --help            show this help message and exit
  -a file_path, --add file_path
                        Add file to the store
  -d file_id, --delete file_id
                        Delete file from the store
  -l, --list            List files in the store
  -r file_id file_path, --replace file_id file_path
                        Replace file in the store
  -g file_id, --get file_id
                        Get file from the store
  -s server_url, --server server_url
                        Server
  -u username, --username username
                        Username
  -p password, --password password
                        Password
```

### Here are some examples:
Add `file.txt` to the store:
```
./store -u username -p password -s http://localhost:3000 -a file.txt
```

Get `efb1c2d3-4a5b-6c7d-8e9f-0a1b2c3d4e5f` from the store:
```
./store -u username -p password -s http://localhost:3000 -g efb1c2d3-4a5b-6c7d-8e9f-0a1b2c3d4e5f
```

Delete `efb1c2d3-4a5b-6c7d-8e9f-0a1b2c3d4e5f` from the store:
```
./store -u username -p password -s http://localhost:3000 -d efb1c2d3-4a5b-6c7d-8e9f-0a1b2c3d4e5f
```

List files owned by me:
```
./store -u username -p password -s http://localhost:3000 -l
```

Replace `efb1c2d3-4a5b-6c7d-8e9f-0a1b2c3d4e5f` with `file.txt`:
```
./store -u username -p password -s http://localhost:3000 -r efb1c2d3-4a5b-6c7d-8e9f-0a1b2c3d4e5f file.txt
```