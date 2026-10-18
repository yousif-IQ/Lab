# LabForge Real Web Labs

This directory contains the real vulnerable web applications used by the platform. They run on a private Docker bridge network and are exposed only on localhost.

## Included labs

| Lab | Local URL | Main focus |
|---|---|---|
| Mutillidae II | http://localhost:8081 | PHP web vulnerabilities |
| DVWA | http://localhost:8082 | OWASP fundamentals |
| bWAPP | http://localhost:8083 | Broad web vulnerability practice |
| XVWA | http://localhost:8084 | PHP vulnerability practice |
| VWA | http://localhost:8085 | Vulnerable web application testing |
| OWASP Juice Shop | http://localhost:3000 | Modern JavaScript web security |
| WebGoat | http://localhost:8086/WebGoat | Guided lessons |
| WebWolf | http://localhost:9090 | WebGoat companion tools |
| Apache Tomcat | http://localhost:8088 | Server configuration labs |
| OWASP WrongSecrets | http://localhost:8091 | Secrets and configuration mistakes |

## Start the real labs

Run from the repository root:

```powershell
docker compose -f labs/docker-compose.yml up --build -d
```

Check the containers:

```powershell
docker compose -f labs/docker-compose.yml ps
```

Follow a lab's logs:

```powershell
docker compose -f labs/docker-compose.yml logs -f dvwa
```

Stop the labs:

```powershell
docker compose -f labs/docker-compose.yml down
```

Remove lab database data too:

```powershell
docker compose -f labs/docker-compose.yml down -v
```

## Safety

Every application in this directory is intentionally vulnerable. Keep services bound to localhost and use them only in an isolated training environment. Do not expose these ports to the internet or a shared network.

Some images clone upstream repositories during the Docker build, so the first build needs internet access and may take several minutes. WebGoat and the Java-based labs need additional memory.
