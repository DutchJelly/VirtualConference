Link to install docker:
- https://docs.docker.com/engine/install/ubuntu/
Link I used for dockerfiles:
- https://vuejs.org/v2/cookbook/dockerize-vuejs-app.html

Commandos:
"sudo dockerd" <- to run docker as a daemon if it does not do it automatically.
"sudo docker run hello-world" <- to test if docker is correctly installed.
"sudo docker build -t vuejs-cookbook/dockerize-vuejs-app ."  <- to build the docker.
"sudo docker run -it -p 8080:8080 --rm --name dockerize-vuejs-app-1 vuejs-cookbook/dockerize-vuejs-app" <- to run docker.
