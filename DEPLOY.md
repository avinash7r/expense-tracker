# Deploying Expense Tracker on AWS (EC2 + RDS)

## Architecture
```
Internet → EC2 (Node.js backend + React static build)
                     ↓ (private subnet, SG allows only EC2)
                   RDS (PostgreSQL)
```

---

## Step 1 — SSH into your EC2

```bash
# Get IP from terraform output
ssh -i ~/.ssh/id_ed25519 ec2-user@<EC2_PUBLIC_IP>
```

---

## Step 2 — Install Node.js on EC2

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

node -v   # should be v20.x
npm -v
```

---

## Step 3 — Upload the app

**From your local machine:**
```bash
# Copy the project to EC2
scp -r -i ~/.ssh/id_ed25519 ./expense-tracker ec2-user@<EC2_IP>:~/
```

Or clone from GitHub if you push it there.

---

## Step 4 — Build the React frontend

```bash
# On EC2
cd ~/expense-tracker/frontend
npm install
REACT_APP_API_URL=http://<EC2_PUBLIC_IP>:3001 npm run build
# This creates frontend/build/ — static HTML/JS/CSS
```

---

## Step 5 — Configure and start the backend

```bash
cd ~/expense-tracker/backend
npm install

# Create .env from the example
cp .env.example .env
nano .env
```

Fill in your `.env`:
```
PORT=3001
JWT_SECRET=some-long-random-string-here
DB_HOST=<your-rds-endpoint>   # from terraform output rds_endpoint
DB_PORT=5432
DB_NAME=mydatabase
DB_USER=avi
DB_PASSWORD=Avi12345
DB_SSL=true
FRONTEND_URL=http://<EC2_PUBLIC_IP>
```

---

## Step 6 — Serve frontend from the backend

Add this to the end of `server.js` BEFORE `initDB().then(...)`:

```js
const path = require("path");
// Serve React build
app.use(express.static(path.join(__dirname, "../frontend/build")));
app.get("*", (_, res) =>
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"))
);
```

Then start:
```bash
node server.js
# Visit http://<EC2_IP>:3001
```

---

## Step 7 — Keep it running with PM2

```bash
sudo npm install -g pm2

cd ~/expense-tracker/backend
pm2 start server.js --name spendwise
pm2 save
pm2 startup   # follow the command it prints
```

---

## Step 8 — Open port 3001 in Terraform (optional)

Add to your `aws_security_group "sg"` ingress:
```hcl
ingress {
  from_port   = 3001
  to_port     = 3001
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}
```
Then `terraform apply`.

Or use nginx on port 80 to proxy to 3001 (see below).

---

## Bonus — nginx on port 80 (cleaner URL)

```bash
sudo amazon-linux-extras install nginx1 -y
sudo nano /etc/nginx/conf.d/spendwise.conf
```

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

Now visit `http://<EC2_IP>` — no port needed!

---

## What you're learning here

| Concept | Where it shows up |
|---|---|
| VPC isolation | RDS only reachable from EC2 security group |
| IAM roles | EC2 has RDS access via instance profile (not hardcoded keys) |
| Security groups | Layered — EC2 sg allows internet, RDS sg allows only EC2 sg |
| Public vs private subnets | EC2 in public, RDS in private subnets |
| Multi-AZ subnets | RDS subnet group spans ap-south-1b and 1c |
| DB_SSL=true | Encrypted in-transit to RDS |
