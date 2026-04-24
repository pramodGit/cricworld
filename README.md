# 🏏 CricWorld – Real-Time Cricket Scoring System

A scalable, real-time cricket scoring application inspired by Cricbuzz. Built using Node.js, React, Redis, WebSockets, and Nginx.

---

# 🚀 Features

* ⚡ Real-time score updates (WebSocket)
* 🧠 Redis-based pub/sub for live fanout
* 📡 Scorer UI to update runs & wickets
* 📺 Viewer UI (live score display)
* 🔄 Multi-match support (live matches list)
* 🌐 Nginx reverse proxy
* ⚙️ PM2 process management

---

# 🏗️ Architecture

```
Scorer UI
   ↓
Nginx
   ↓
Backend API (Node.js)
   ↓
Redis (Pub/Sub)
   ↓
WebSocket Server
   ↓
Viewer UI
```

---

# 📁 Project Structure

```
cricworld/
│
├── backend-api/        # Express APIs
├── websocket-server/   # WebSocket server (ws + Redis)
├── viewer-ui/          # React app (users view scores)
├── scorer-ui/          # React app (admin scorer panel)
├── .env
```

---

# ⚙️ Tech Stack

* **Frontend:** React (Vite)
* **Backend:** Node.js + Express
* **Realtime:** WebSocket (ws)
* **Cache/Event:** Redis
* **Process Manager:** PM2
* **Server:** Nginx

---

# 🛠️ Setup (Local / Server)

## 1️⃣ Clone Repo

```
git clone <your-repo-url>
cd cricworld
```

---

## 2️⃣ Install Dependencies

### Backend

```
cd backend-api
npm install
```

### WebSocket Server

```
cd ../websocket-server
npm install
```

### Frontend Apps

```
cd ../viewer-ui && npm install
cd ../scorer-ui && npm install
```

---

## 3️⃣ Setup Environment

Create `.env` in root:

```
PORT=5000
VITE_API_URL=http://your-domain/api
VITE_WS_URL=ws://your-domain/ws
```

---

## 4️⃣ Start Redis

```
redis-server
```

---

## 5️⃣ Run Services

### Backend

```
pm2 start backend-api/server.js --name backend
```

### WebSocket

```
pm2 start websocket-server/index.js --name websocket
```

---

## 6️⃣ Build Frontend

```
cd viewer-ui
npm run build

cd ../scorer-ui
npm run build
```

---

# 🌐 Nginx Config (Important)

```
# ================================
# cricworld.pramod.click - viewer
# ================================
upstream backend_cluster {
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
}
server {
    listen 80;
    server_name cricworld.pramod.click;

    root /opt/app/cricworld/viewer-ui/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # 🔥 Load balanced API
    location /api/ {
        proxy_pass http://backend_cluster;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 🔥 WebSocket (separate server)
    location /ws {
        proxy_pass http://localhost:6000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# ================================
# scorer.cricworld.pramod.click
# ================================
server {
    listen 80;
    server_name scorer.cricworld.pramod.click;

    root /opt/app/cricworld/scorer-ui/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
---

# 📺 Usage

### Viewer UI

```
http://your-domain
```

### Scorer UI

```
http://scorer.your-domain
```

---

# 🔮 Future Enhancements

* Kafka integration (event streaming)
* MySQL for match history
* Player statistics
* Ball-by-ball commentary
* Authentication (admin scorer)

---

# 👨‍💻 Author

Pramod Kumar

---

# ⭐ If you like this project

Give it a star on GitHub ⭐
