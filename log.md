# OpenWhisk Setup Log

## Gameplan

** Adding the functionality **
1. Run OpenWhisk locally
2. Build the invoker from a local image
4. Modify the invoker to also invoke a Redis container if none has been launched previously
3. Modify the invoker to pass some extra environment variables to the nodejs function context
5. Build the nodejs function context from a local image
6. Modify the function context to make use of the passed variables and connect to the redis DB
7. Modify the function context to provide an API to the function code that lets you access the DB
8. Properly manage lifecycle hooks

** Evaluation **
1. Set up an external DB
2. Write some example functions that need caching
3. Add a fake delay from the user to the functions, and from the functions to the external DB
4. Design and run an initial set of benchmarks
5. Add shared caching over Redis
6. Run on modified version

## Getting OpenWhisk to Run

Get docker compose (v1.24.1, docker-py v3.7.3, CPython v3.6.8)
as a binary and put into path.
Get openwhisk CLI binary and save as "wsk" in path.

Edit `~/.wskprops` and enter:
```bash
APIHOST=https://localhost
AUTH=23bc46b1-71f6-4ed5-8c54-816aa4f8c502:123zO3xZCLrMN6v2BKK1dXYFpXlPkccOFqm12CdAsMgRU4VrNZ9lyGVCGuMDGIwP # cat openwhisk/ansible/files/auth.guest
```

```bash
sudo pip install pipenv
sudo pacman -S net-tools
sudo pacman -S zip
```

```bash
cd openwhisk-devtools/docker-compose
make run
```

When creating or running functions with `wsk` always use the `-i` property.

See [this](https://medium.com/openwhisk/how-to-contribute-to-openwhisk-6164c54134a6) for how to develop locally, skip the first few sections about contribution.

```bash
# OpenWhisk
./gradlew distDocker
# NodeJS Action
./gradlew core:nodejs10Action:distDocker
```




## Redis instances

Possible locations to spawn a Redis instance:
1. As a docker container with exposed ports started together with the Invoker
2. As a docker container with exposed ports started in the Invoker main() function
3. As a serverless function runtime without timeout that gets run as a task at the start of the Invoker execution

For now we'll use option (1). This means that we really only have to change the deployment configuration to also make a redis instance and make sure it's available from inside the spawned function contexts. Providing the Redis instance will be different for different deployment architectures:
- For local development over `openwhisk-devtools/docker-compose`, it will only require modification of the docker-compose.yml file.
- For actual deployments with multiple invokers, it depends. We might want to be able to deploy it to Kubernetes for testing. In that case we'll have to modify the ansible/kubernetes config used.

First we'll cover local development. As it turns out, a REDIS instance is already being spawned by docker-compose to be used by the API gateway, likely for session storage or similar. We'll add a link to the invoker, and the first task will be to investigate how we can give the spawned functions within the invoker access to the Redis instance.

Created test.py
```bash
wsk -i action create app app.py
wsk -i action invoke --result app --param port 8000

zip -r app.zip *
wsk -i action update app app.zip --kind nodejs:10
wsk -i action invoke app --result

rm app.zip && zip -r app.zip * && wsk -i action update app app.zip --kind nodejs:10 && wsk -i action invoke --result app --param get somestring

watch -n 0.2 "docker network inspect bridge"
watch -n 0.2 docker ps
```

Instead of creating a new network, I added the Redis instance to the default "bridge" network.
This allows all containers to access the network. To do this automatically the deployment code needs to be modified.

Runtimes manifest in `openwhisk-devtools/docker-compose/docker-whisk-controller.env`
Used to add new action images or modify location/params of existing ones.



## Authentication

+ Make redis and network change part of openwhisk devtools
+ Modify container code to generate binding to redis with unobtainable secret
	- There are alternatives that would require auth tokens to be assigned through container environment variables, that are generated on the Invoker.
		+ Alternative: Write a custom Redis container that proxies with auth. Actions get a random hash assigned by Invoker (environment) and 
		+ Alternative: Modify Invoker to provide an interface for Redis
+ Add auth to redis at container creation time and make sure the secret makes it to the nodejs action as an environment variable
+ Double check secret isn't available from inside the client code.


```bash
wsk -i action invoke test --result --param set a --param value b && wsk -i action invoke test --result --param get a
```

To "sandbox" redis we remove the environment variable that holds the password after extracting it into a variable that shouldn't be accessible from action scope.
To make sure access rights are not abused, we prefix the action name to all keys that are used in redis calls. We also need to set an expiry timer on keys to make sure that redis doesn't fill up too much over time.

Since my code gets executed before the user defined code, I think there might be a way to remove any trace of the environment variable. The code looks something like this.

```js
    const redis = Redis.createClient({host: "..."})
	const secret = process.env.SECRET
	const client = {get: (key) => get('userprefix-' + key)}
	delete process.env.SECRET

	redis.auth(secret, (err, res) => {
		userDefinedFunction(client);
	})
```

While the user function doesn't have access to the secret directly, it can e.g. read `/proc/1/environ` because it's running as root. This is a problem.

It turns out the first approach isn't sound because even masking the environment (https://unix.stackexchange.com/questions/302948/change-proc-pid-environ-after-process-start) doesn't prevent users from reading the secret in memory (`/proc/$pid/mem`).
Alternatives:
- Go back to other implementations
- Execute nodejs as non-root and mask `/proc/.../env`
```js
const data = cp.execSync('ps faux | grep node', {encoding: 'utf8'}).split('\n')
const data = cp.execSync('cat /proc/7/environ', {encoding: 'utf8'}).split('\n')
const data = cp.execSync('strings /proc/self/mem | grep Secret', {encoding: 'utf8'}).split('\n')
````




## Evaluation Setup

We'll construct a mini tileserver that has some of the properties we need.
Sadly OpenWhisk only supports returning base64 encoded strings for serving tile data, so maybe the transmission itself will be a major hurdle.




## K8s log

Follow [this](https://github.com/VaguelySerious/openwhisk-deploy-kube) in general.
[K8s Cheatsheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

```bash
openssl req -newkey rsa:2048 -nodes -keyout tls.key -x509 -days 365 -out tls.crt
cat tls.crt | base64 -w 0 >> mycluster.yaml
cat tls.key | base64 -w 0 >> mycluster.yaml
# re-arange mycluster.yaml to have keys at the right spot
sudo snap install kubectl
sudo snap install helm --channel=2.16/stable --classic
sudo snap install doctl

# in <gitdir>/openwhisk-deploy-kube
kubectl label nodes --all openwhisk-role=invoker
helm install owdev ./helm/openwhisk -n openwhisk -f ~/.kube/mycluster.yaml
# doesn't work because of namespace issues, so instead:
helm install owdev ./ -f ~/.kube/mycluster.yaml
helm uninstall owdev

# Creating a new user from SSH CLI
kubectl exec -it owdev-wskadmin -- bash
wskadmin user create admin
# Auth keys for use in values.yaml shoule be outputed here

# Quickly see which pods run on which nodes
kubectl get pod \
	-o=custom-columns=NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName \
	-n default | sort -k 3

# Gives ingress and DNS information
kubectl cluster-info

# AWS Setup, after online console setup and uploading certs after deploy-kube guide
aws eks --region eu-central-1 update-kubeconfig --name eks-ow-cluster
kubectl get svc
helm install owdev openwhisk-deploy-kube/helm/openwhisk -f ~/.kube/mycluster.yaml
kubectl get services -o wide # > use external-ip shown

# Deploy kubernetes dashboard, see https://docs.aws.amazon.com/eks/latest/userguide/dashboard-tutorial.html
DOWNLOAD_URL=$(curl -Ls "https://api.github.com/repos/kubernetes-sigs/metrics-server/releases/latest" | jq -r .tarball_url)
DOWNLOAD_VERSION=$(grep -o '[^/v]*$' <<< $DOWNLOAD_URL)
curl -Ls $DOWNLOAD_URL -o metrics-server-$DOWNLOAD_VERSION.tar.gz
mkdir metrics-server-$DOWNLOAD_VERSION
tar -xzf metrics-server-$DOWNLOAD_VERSION.tar.gz --directory metrics-server-$DOWNLOAD_VERSION --strip-components 1
kubectl apply -f metrics-server-$DOWNLOAD_VERSION/deploy/1.8+/
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-beta8/aio/deploy/recommended.yaml

# # Gcloud setup
# gcloud container clusters get-credentials ow-cluster
# kubectl config use-context gke_glass-crossing-237206_europe-west2-a_ow-cluster
# # deploy helm
# gcloud compute addresses create ow-ip --global
# gcloud compute addresses describe ow-ip --global

traffic?jk
```

```bash
# Dependency install with snap
sudo snap install kubectl
sudo snap install helm --channel=2.16/stable --classic
sudo snap install doctl

# Go to AWS and set up an EKS cluster and at least one node-group
# https://eu-central-1.console.aws.amazon.com/vpc/home?region=eu-central-1#subnets:sort=SubnetId to assign tags to subnets so that they can be used when creating a nodegroup

# From https://github.com/apache/openwhisk-deploy-kube/blob/master/docs/k8s-aws.md
aws iam upload-server-certificate --server-certificate-name ow-self-signed --certificate-body file://openwhisk-server-cert.pem --private-key file://openwhisk-server-key.pem
aws iam list-server-certificates # put this in mycluster.yaml
aws eks --region eu-central-1 update-kubeconfig --name ow-cluster
kubectl get svc

# kubectl label nodes --all openwhisk-role=invoker
kubectl get nodes
kubectl label nodes ip-172-31-21-143.eu-central-1.compute.internal openwhisk-role=core
kubectl label nodes ip-172-31-38-108.eu-central-1.compute.internal ip-172-31-22-215.eu-central-1.compute.internal ip-172-31-34-254.eu-central-1.compute.internal openwhisk-role=invoker
kubectl label nodes ip-172-31-38-108.eu-central-1.compute.internal invoker-index=0
kubectl label nodes ip-172-31-22-215.eu-central-1.compute.internal invoker-index=1
kubectl label nodes ip-172-31-34-254.eu-central-1.compute.internal invoker-index=2

helm install owdev ~/code/openwhisk-deploy-kube/helm/openwhisk -f ~/.kube/mycluster.yaml

zkubectl get services -o wide # Gives API endpoint for .wskprops, insert like "https://<url>:443"
kubectl exec -it owdev-wskadmin -- bash
wskadmin user create peter -ns default # This gives you your auth token for .wskprops

wsk -i list # to check if everything worked

# (optional) Deploy kubernetes dashboard, see https://docs.aws.amazon.com/eks/latest/userguide/dashboard-tutorial.html
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/download/v0.3.6/components.yaml
kubectl get deployment metrics-server -n kube-system
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-beta8/aio/deploy/recommended.yaml
DOWNLOAD_URL=$(curl -Ls "https://api.github.com/repos/kubernetes-sigs/metrics-server/releases/latest" | jq -r .tarball_url)
DOWNLOAD_VERSION=$(grep -o '[^/v]*$' <<< $DOWNLOAD_URL)
curl -Ls $DOWNLOAD_URL -o metrics-server-$DOWNLOAD_VERSION.tar.gz
mkdir metrics-server-$DOWNLOAD_VERSION
tar -xzf metrics-server-$DOWNLOAD_VERSION.tar.gz --directory metrics-server-$DOWNLOAD_VERSION --strip-components 1
kubectl apply -f metrics-server-$DOWNLOAD_VERSION/deploy/1.8+/
# Get yaml file
kubectl apply -f eks-admin-service-account.yaml
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep eks-admin | awk '{print $1}')
kubectl proxy &
eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlLXN5c3RlbSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJla3MtYWRtaW4tdG9rZW4tOGtueG0iLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiZWtzLWFkbWluIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiMzgyNjE4MmItZjJmYi00ZmU1LWExMzItZjhiZGU4ZDMxMTVmIiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50Omt1YmUtc3lzdGVtOmVrcy1hZG1pbiJ9.TRwXf-kAOjA9cBlFUPlAj8xkvhKLpvTZHYGFOlVxOG6ZQqkehi4TYLwUxyaNwObTx9gqDWeaMs4NZV3BnhZRqWjf0GpExtNbPH1A2gt4ODoWUTkiD_7pzY0XC0aQPtv6VNLOCHsBTbKs2aEfd1mBJe5EPHyL9PklNzFEAS2_9x6iY7qWfIoDC5XnJvuhZpf-hcJgUCqa30PtUSeD1eWuh2If-uZh-jA96DsQ2nuNy20Sc3CXPtc38sWaDYWaLNNB2c3a7uM16aG7Kwtn9zz7ytmQFmNjhlfrENJ1eW_JjzL91g2eJL3lhQs_PIKQimmJb4eoRmX8m4fNIyBj9Gz-CQ
# Got to http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/#!/login
# and use the auth token displayed from the previous command
```

```yaml
### mycluster.yaml

# Enable AWS Loadbalancer
whisk:
  ingress:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-internal: 0.0.0.0/0
      service.beta.kubernetes.io/aws-load-balancer-ssl-cert: arn:aws:iam::424794656258:server-certificate/ow-self-signed

# Disable persistence
k8s:
  persistence:
    enabled: false

```

Remember to configure LIMITS_ACTIONS_INVOKES_PERMINUTE and LIMITS_ACTIONS_INVOKES_CONCURRENT and other variables that I might not know about yet.
Mostly in values.yaml

## Meeting 2020-04-16

Circumvent Amazon Bursting by pre-heating > just run a lot and remove the first chunk
(https://stackoverflow.com/questions/11294611/logging-vmstat-data-to-file)

## EC2 Instance setup

*All*
`nohup vmstat -t 1 40000 > stats.txt &`
= 11 hours of vmstat logs with timestamps
`date` and check if it's the same across all

*Global*
```bash
# make sure redis.conf is in /home/ec2-user/
# from https://medium.com/@feliperohdee/installing-redis-to-an-aws-ec2-machine-2e2c4c443b68
# REDIS_AUTH="3f797c70216d0e548c34c2791537f304021ebc4b52bd486ac1b20d8b1f328085427422dabb8203f9610434dff4acd276097cd7f4cbd23f736eba53b55d712b6f"
sudo yum -y update
sudo yum -y install gcc make
cd /usr/local/src
sudo wget http://download.redis.io/releases/redis-5.0.8.tar.gz
sudo tar xzf redis-5.0.8.tar.gz
sudo rm redis-5.0.8.tar.gz
cd redis-5.0.8
sudo make distclean
sudo make
sudo mkdir /etc/redis
sudo chown ec2-user:ec2-user /etc/redis
sudo cp src/redis-server src/redis-cli /usr/local/bin
sudo cp /home/ec2-user/redis.conf /etc/redis/redis.conf
redis-server /etc/redis/redis.conf
```

*Local*
```bash
# daemonset, 4 services, functions select hostname based on vmID, hardcoded
kubectl apply -f redis.yaml
```

## Loadgen server

Get files "test.py" and "seq.txt"
```bash
sudo yum -y install python-pip
sudo pip install tornado
python test.py > out.py
```

## Fix not being able to delete node group due to dependencies
```
# delete all the load balancers and network groups of EC2 over the console
aws elb describe-load-balancers
aws eks list-clusters
aws eks delete-cluster --name ow-cluster
# also delete ec2 security groups and network interfaces over web UI
```


```bash
cat xx.txt | nn "a = a.split('\n').map(b => JSON.parse(b.split(' ')[2])).filter(x => x.logging).map(l=>l.logging.vmId); a.join('\n')" | sort | uniq -c

Math.floor(Date.now() / 1000 -fs.readFileSync('/proc/uptime').toString().split(' ')[0].split('.')[0]).toString(32).toUpperCase()

1F9TNV8
1F9TO4N
1F9TNNS
core: 1F9TODV
```

invoker index, vmID from container, vmID from redis
0, 1F9TO4M, 1f9tnv8a
1, 1F9TNNS | 1F9TNNT, 1f9to4na
2, 1F9TODV | 1F9TOE0, 1f9tnnsa


Histogramm:
cat xx.txt | nn "a = a.split('\n').map(b => JSON.parse(b.split(' ')[2])).filter(x => x.logging).map(l=>l.logging.downloadLat); b={}; a.forEach(n => {h = Math.floor(n / 10) * 10; b[h] = (b[h] || 0) + 1;}); b"

