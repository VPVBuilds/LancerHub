# LancerHub — Backend API

Node.js + Express + MongoDB backend for the LancerHub freelancer marketplace.

---

## Tech Stack

| Layer       | Tech                              |
|-------------|-----------------------------------|
| Runtime     | Node.js                           |
| Framework   | Express.js                        |
| Database    | MongoDB + Mongoose                |
| Auth        | JWT (jsonwebtoken) + bcryptjs     |
| Real-time   | Socket.io                         |
| Payments    | Stripe                            |
| Email       | Nodemailer                        |
| File Upload | Multer + Cloudinary               |

---

## Project Structure

```
lancerhub-backend/
├── server.js                 ← Entry point, Express + Socket.io setup
├── config/
│   ├── db.js                 ← MongoDB connection
│   └── socket.js             ← Socket.io init + online user tracking
├── models/
│   ├── User.js               ← Users (freelancers + clients)
│   ├── Job.js                ← Job listings
│   ├── Proposal.js           ← Job proposals
│   ├── Message.js            ← Conversations + Messages
│   ├── Invoice.js            ← Invoices
│   └── Review.js             ← Reviews + ratings
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── jobController.js
│   ├── proposalController.js
│   ├── messageController.js
│   ├── invoiceController.js
│   ├── reviewController.js
│   ├── paymentController.js
│   └── uploadController.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── jobs.js
│   ├── proposals.js
│   ├── messages.js
│   ├── invoices.js
│   ├── reviews.js
│   ├── payments.js
│   └── uploads.js
├── middleware/
│   ├── auth.js               ← JWT protect + authorize
│   ├── errorHandler.js       ← Global error handler
│   └── upload.js             ← Multer config
└── utils/
    ├── email.js              ← Nodemailer templates
    └── seed.js               ← Sample data seeder
```

---

## Quick Start

### 1. Install dependencies
```bash
cd lancerhub-backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, Stripe keys, etc.
```

### 3. Start MongoDB
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas — just set MONGO_URI in .env
```

### 4. Seed sample data (optional)
```bash
npm run seed
```

### 5. Run the server
```bash
npm run dev      # development (nodemon, auto-restart)
npm start        # production
```

Server runs at: `http://localhost:5000`

---

## API Reference

### Auth — `/api/auth`
| Method | Route               | Access  | Description            |
|--------|---------------------|---------|------------------------|
| POST   | `/register`         | Public  | Register new user      |
| POST   | `/login`            | Public  | Login, returns JWT     |
| GET    | `/me`               | Private | Get current user       |
| PUT    | `/change-password`  | Private | Change password        |
| POST   | `/logout`           | Private | Logout                 |

### Users — `/api/users`
| Method | Route              | Access  | Description                |
|--------|--------------------|---------|----------------------------|
| GET    | `/`                | Public  | Browse freelancers (filter)|
| GET    | `/dashboard`       | Private | Get user dashboard stats   |
| GET    | `/:id`             | Public  | Get user profile           |
| GET    | `/:id/portfolio`   | Public  | Get portfolio items        |
| PUT    | `/profile`         | Private | Update profile             |
| PUT    | `/avatar`          | Private | Upload avatar              |

### Jobs — `/api/jobs`
| Method | Route   | Access         | Description              |
|--------|---------|----------------|--------------------------|
| GET    | `/`     | Public         | List & search jobs       |
| GET    | `/my`   | Private        | Client's own jobs        |
| GET    | `/:id`  | Public         | Get single job           |
| POST   | `/`     | Client only    | Create job               |
| PUT    | `/:id`  | Owner only     | Update job               |
| DELETE | `/:id`  | Owner only     | Delete job               |

### Proposals — `/api/proposals`
| Method | Route              | Access     | Description           |
|--------|--------------------|------------|-----------------------|
| POST   | `/`                | Freelancer | Submit proposal       |
| GET    | `/my`              | Private    | My proposals          |
| GET    | `/job/:jobId`      | Job owner  | Proposals for a job   |
| PUT    | `/:id/accept`      | Client     | Accept proposal       |
| PUT    | `/:id/reject`      | Client     | Reject proposal       |
| DELETE | `/:id`             | Freelancer | Withdraw proposal     |

### Messages — `/api/messages`
| Method | Route                    | Access  | Description             |
|--------|--------------------------|---------|-------------------------|
| GET    | `/conversations`         | Private | List conversations      |
| POST   | `/conversations`         | Private | Start conversation      |
| GET    | `/:conversationId`       | Private | Get messages (paginated)|
| POST   | `/:conversationId`       | Private | Send a message          |

### Invoices — `/api/invoices`
| Method | Route          | Access     | Description         |
|--------|----------------|------------|---------------------|
| GET    | `/`            | Private    | My invoices         |
| GET    | `/stats`       | Private    | Invoice summary     |
| GET    | `/:id`         | Private    | Get single invoice  |
| POST   | `/`            | Freelancer | Create invoice      |
| PUT    | `/:id`         | Owner      | Update invoice      |
| PUT    | `/:id/send`    | Freelancer | Send to client      |
| PUT    | `/:id/cancel`  | Freelancer | Cancel invoice      |

### Reviews — `/api/reviews`
| Method | Route             | Access  | Description        |
|--------|-------------------|---------|--------------------|
| POST   | `/`               | Private | Submit review      |
| GET    | `/user/:userId`   | Public  | User's reviews     |
| DELETE | `/:id`            | Admin   | Remove review      |

### Payments — `/api/payments`
| Method | Route              | Access  | Description              |
|--------|--------------------|---------|--------------------------|
| POST   | `/create-intent`   | Client  | Create Stripe intent     |
| POST   | `/webhook`         | Stripe  | Stripe webhook handler   |
| GET    | `/history`         | Private | Payment history          |

### Uploads — `/api/uploads`
| Method | Route          | Access  | Description          |
|--------|----------------|---------|----------------------|
| POST   | `/avatar`      | Private | Upload avatar        |
| POST   | `/portfolio`   | Private | Upload portfolio img |
| POST   | `/attachment`  | Private | Upload file          |

---

## Socket.io Events

### Client emits
| Event               | Payload                        | Description              |
|---------------------|--------------------------------|--------------------------|
| `conversation:join` | `conversationId`               | Join a chat room         |
| `message:send`      | `{ conversationId, message }`  | Send a message           |
| `typing:start`      | `{ conversationId }`           | Started typing           |
| `typing:stop`       | `{ conversationId }`           | Stopped typing           |

### Server emits
| Event                        | Payload                        | Description              |
|------------------------------|--------------------------------|--------------------------|
| `message:receive`            | `{ conversationId, message }` | New incoming message     |
| `typing:start`               | `{ userId }`                   | Someone is typing        |
| `typing:stop`                | `{ userId }`                   | Stopped typing           |
| `user:online`                | `{ userId }`                   | User came online         |
| `user:offline`               | `{ userId }`                   | User went offline        |
| `notification:new_proposal`  | `{ jobId, jobTitle, ... }`     | New proposal received    |
| `notification:proposal_accepted` | `{ jobTitle }`            | Your proposal accepted   |
| `notification:proposal_rejected` | `{ jobTitle }`            | Your proposal rejected   |

---

## Authentication

All protected routes require:
```
Authorization: Bearer <your_jwt_token>
```

Get the token from `/api/auth/login` or `/api/auth/register`.

---

## Connecting to the Frontend

In your HTML frontend, replace mock data with real API calls:

```javascript
const API = 'http://localhost:5000/api';

// Login
const res = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const { token, user } = await res.json();
localStorage.setItem('token', token);

// Fetch jobs (protected)
const jobs = await fetch(`${API}/jobs`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// Connect Socket.io (real-time messages)
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') },
});
socket.on('message:receive', ({ message }) => console.log(message));
```

---

## Deployment

### MongoDB Atlas (free cloud DB)
1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string → set as `MONGO_URI` in `.env`

### Deploy on Railway (free tier)
1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add all `.env` variables in Railway dashboard
4. Done — Railway gives you a live URL

### Deploy on Render (free tier)
1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo, set `npm start` as start command
4. Add environment variables
