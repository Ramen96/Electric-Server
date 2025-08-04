# Electric-Server

Backend API that handles form submissions and sends emails using Twilio SendGrid.

➡️ The frontend code can be found here: [github.com/Ramen96/Electric](https://github.com/Ramen96/Electric)

---

## 🧰 Tech Stack

- Node.js  
- Express.js  
- Twilio SendGrid API  
- pm2

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22 (LTS) or later
- A SendGrid API key  

### Installation

```bash
git clone https://github.com/Ramen96/Electric-Server.git
cd Electric-Server
npm install
```

### Deployment

```bash
pm2 start server.js --name "email-server
```