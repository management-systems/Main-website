# Management Systems — Deployment Guide

## Requirements

### Local Machine
- Node.js 18+ (for local development)
- Git
- Docker Desktop (optional, for local testing)

### EC2 Server (AWS)
- **OS:** Amazon Linux 2023 or Ubuntu 22.04
- **Instance:** t2.micro (free tier) or t3.micro
- **RAM:** 512MB minimum
- **Storage:** 8GB minimum
- **Ports to open (Security Group):**
  - 22 (SSH)
  - 80 (HTTP)
  - 443 (HTTPS)

### Software on EC2
- Docker
- Docker Compose
- Git
- Nginx (for reverse proxy + SSL)
- Certbot (for free HTTPS)

### Domain & Email
- Domain: managementsystems.in
- Email: admin@managementsystems.in (Google Workspace)
- SMTP App Password (from Google Workspace)

---

## Step-by-Step Deployment

### 1. Push to GitHub

```bash
cd e:\Extra\Company\websites\Management_systems
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/management-systems.git
git push -u origin main
```

### 2. Launch EC2 Instance

1. AWS Console → EC2 → Launch Instance
2. Name: `managementsystems`
3. AMI: Amazon Linux 2023
4. Instance type: t2.micro
5. Key pair: Create new → download .pem file
6. Security Group:
   - SSH (22) → My IP
   - HTTP (80) → Anywhere
   - HTTPS (443) → Anywhere
7. Storage: 8GB gp3
8. Launch

### 3. Allocate Elastic IP

1. EC2 → Elastic IPs → Allocate
2. Associate with your instance
3. Note the IP address

### 4. Point Domain DNS

In your domain registrar (where you bought managementsystems.in):
```
A Record → @ → YOUR_ELASTIC_IP
A Record → www → YOUR_ELASTIC_IP
```

### 5. SSH into EC2

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@YOUR_ELASTIC_IP
```

### 6. Install Everything on EC2

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx & Certbot
sudo yum install -y nginx certbot python3-certbot-nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Re-login for docker group
exit
```

SSH again:
```bash
ssh -i your-key.pem ec2-user@YOUR_ELASTIC_IP
```

### 7. Clone & Run with Docker

```bash
cd /home/ec2-user
git clone https://github.com/YOUR_USERNAME/management-systems.git
cd management-systems

# Create .env file for secrets
echo "SMTP_PASS=your_google_app_password" > .env

# Build and run
docker-compose up -d --build
```

### 8. Configure Nginx (Reverse Proxy)

```bash
sudo nano /etc/nginx/conf.d/managementsystems.conf
```

Paste this:
```nginx
server {
    listen 80;
    server_name managementsystems.in www.managementsystems.in;

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Get SSL Certificate (HTTPS)

```bash
sudo certbot --nginx -d managementsystems.in -d www.managementsystems.in
```

Follow prompts → select redirect HTTP to HTTPS.

Auto-renewal is set up automatically.

---

## How to Update Website

After making changes locally:

```bash
# Local
git add .
git commit -m "your update message"
git push

# On EC2
cd /home/ec2-user/management-systems
git pull
docker-compose up -d --build
```

---

## Useful Commands on EC2

```bash
# Check if running
docker ps

# View logs
docker logs managementsystems

# Restart
docker-compose restart

# Stop
docker-compose down

# Rebuild after code change
docker-compose up -d --build

# Check Nginx status
sudo systemctl status nginx

# Renew SSL manually
sudo certbot renew
```

---

## Admin Panel

- URL: https://managementsystems.in/admin
- Email: admin@managementsystems.in
- Password: Rewari@123

---

## Cost Summary

| Item | Monthly | Yearly |
|------|---------|--------|
| EC2 t2.micro (1st year) | FREE | ₹0 |
| EC2 t2.micro (after 1 year) | ~₹700 | ~₹8,400 |
| OR Lightsail (alternative) | ₹290 | ₹3,500 |
| Elastic IP | FREE (if attached) | ₹0 |
| Domain renewal | — | ₹700-900 |
| Google Workspace | ₹125 | ₹1,500 |
| SSL (Let's Encrypt) | FREE | ₹0 |
| **Total (1st year)** | | **~₹2,200** |
| **Total (after 1st year)** | | **~₹5,900-10,800** |
