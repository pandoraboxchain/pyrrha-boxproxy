### Resolve git dependencies
```
git submodule update --init --recursive
```

### Build a container
```
docker build -t pyrrha-boxproxy -f ./Dockerfile .
```

or just...
### Run a container
```
docker-compose up --build
```
