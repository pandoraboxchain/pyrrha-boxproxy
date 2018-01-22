### Resolve git dependencies
```
git submodule update --init --recursive
```

### Build a container
```
docker build -t pyrrha-boxproxy -f ./Dockerfile .
```

### Run a container
```
docker run pyrrha-boxproxy
```
