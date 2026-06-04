# FriendlyDude 🕊️ (CodeAlpha Social Media Platform)

A vibrant, modern, glassmorphic social media application built using Node.js, Express, MongoDB, and Vanilla Javascript/CSS. **FriendlyDude** provides a platform for micro-connections, allowing users to share their vibes, comment on thoughts, discover new people, and follow other users.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Database](https://img.shields.io/badge/database-MongoDB%20Atlas-emerald.svg)](https://www.mongodb.com/atlas/database)
[![Style](https://img.shields.io/badge/styling-Vanilla%20CSS%20%26%20Glassmorphism-purple.svg)](public/style.css)

---

## ✨ Features

### 👤 User Authentication
- **Secure Credentials**: Password hashing using `bcryptjs` with salt round configuration.
- **JWT Authentication**: Token-based authentication with JSON Web Tokens (JWT) stored securely in client cookies (`httpOnly`, `secure`, dynamic `sameSite` policies).
- **Session Persistence**: Automatic page login validation via `/api/auth/me` on client startup.

### 📝 Micro-Blogging & Vibes
- **Interactive Feed**: A global stream displaying user posts in reverse-chronological order.
- **Post Composer**: Protected text area supporting up to 1000 characters with a live character counter.
- **Cascading Deletions**: Deleting a post automatically cleans up all associated comments in the database.

### 💬 Engagement & Interactions
- **Like/Unlike System**: Heart-pop toggle reactions on posts with live, dynamic count updates.
- **Threaded Comments**: Sequential commenting (oldest first) nested under post threads.

### 🌐 Social Graph
- **Follow System**: Unidirectional or bidirectional follow mechanics. Follow/unfollow directly updates user counts and recommended feed lists.
- **Discover Directory**: Discover tab featuring a grid of all registered users on the platform.

### 🎨 Visual Aesthetics & UI/UX
- **Dynamic Light/Dark Themes**: Integrated dark and light modes, immediately applied via inline blocking scripts to prevent page flash. Respects user selection (`localStorage`) and system settings (`prefers-color-scheme`).
- **Glassmorphic Layout**: Translucent overlays (`backdrop-filter: blur(16px)`), thin pastel borders, and subtle shadow systems.
- **Floating Mesh Glow Orbs**: Three colorful animated radial-gradient glow spheres floating gently in the background using CSS `@keyframes` animations.
- **Responsive Layout**: Fluid three-column design (User Summary, central Feed/Discovery, suggested followers widget) collapsing beautifully on tablet and mobile screens.

---

## 🛠️ Tech Stack

- **Backend**:
  - [Node.js](https://nodejs.org/) - Runtime environment
  - [Express](https://expressjs.com/) - Web framework
  - [Mongoose](https://mongoosejs.com/) - MongoDB object modeling (ODM)
  - [JSON Web Tokens (JWT)](https://jwt.io/) - Secure session communication
  - [BcryptJS](https://github.com/dcodeIO/bcrypt.js) - Password hashing
  - [Cookie-Parser](https://github.com/expressjs/cookie-parser) - Server-side cookie parsing and handling

- **Frontend**:
  - **HTML5**: Semantic tags, modals, layouts
  - **CSS3**: Design tokens (variables), CSS Grid, Flexbox, custom scrolls, dynamic theme mappings, keyframe animations
  - **ES6 Javascript**: Modular architecture, async/await fetch calls, responsive client-side routing, DOM-injection rendering

---

## 📂 Project Structure

```text
CodeAlpha_Social_Media_Platform/
├── middleware/
│   └── auth.js             # JWT verification and route protection middleware
├── models/
│   ├── Comment.js          # Mongoose schema for Comments
│   ├── Post.js             # Mongoose schema for Posts
│   └── User.js             # Mongoose schema for Users (including bcrypt hooks)
├── routes/
│   ├── auth.js             # Express router for register/login/logout/me
│   ├── posts.js            # Express router for CRUD posts, likes, comments
│   └── users.js            # Express router for profile updates, directory, follow
├── public/
│   ├── image/              # Static image assets and favicons
│   ├── js/
│   │   ├── api.js          # ES6 Module mapping and wrapping client Fetch API requests
│   │   └── ui.js           # Client UI rendering controller
│   ├── app.js              # Central client controller, events, and router
│   ├── index.html          # Main Single Page Application structure
│   └── style.css           # Premium Glassmorphic design system and styles
├── .env                    # Local configuration variables (git ignored)
├── package.json            # Node project configuration
├── server.js               # Application entry point, DB connector, and routes binder
└── README.md               # Documentation (This file)
```

---

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js**: `v18.0.0` or higher
- **MongoDB**: A running MongoDB Atlas instance or local MongoDB server

### 🔧 Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/CodeAlpha_Social_Media_Platform.git
   cd CodeAlpha_Social_Media_Platform
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   # Network settings
   PORT=5000
   NODE_ENV=development
   
   # Databases & Security
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_cryptographic_key

   # CORS Configuration (optional / fallback support)
   FRONTEND_URL=http://localhost:3000
   API_BASE_URL=
   ```

### ⚡ Running the Application

- **Development Mode** (with automated server reload via `nodemon`):
  ```bash
  npm run dev
  ```

- **Production Mode**:
  ```bash
  npm start
  ```

Once running, access the web client at [http://localhost:5000](http://localhost:5000) (or the port defined in your `.env`).

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Register user & receive authentication cookie |
| **POST** | `/api/auth/login` | Public | Authenticate user & receive cookie |
| **POST** | `/api/auth/logout` | Public | Clear JWT token cookie |
| **GET** | `/api/auth/me` | Private | Retrieve verified current user details |

### Posts (`/api/posts`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/posts` | Private | Create a new vibe post |
| **GET** | `/api/posts` | Public | Get all posts (Global feed, sorted newest first) |
| **GET** | `/api/posts/user/:username` | Public | Fetch timeline posts created by a specific user |
| **PUT** | `/api/posts/:id/like` | Private | Toggle like reaction on a post |
| **POST** | `/api/posts/:id/comments` | Private | Add comment on a post |
| **GET** | `/api/posts/:id/comments` | Public | Retrieve comments list for a post |
| **DELETE**| `/api/posts/:id` | Private | Delete own post (cascades comment deletion) |

### Users (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/users` | Public | Retrieve list of all users on platform |
| **GET** | `/api/users/profile/:username` | Public | Get profile details (including populated followers list) |
| **PUT** | `/api/users/profile` | Private | Update user bio |
| **PUT** | `/api/users/follow/:id` | Private | Toggle following state for target user ID |

---

## 💎 Customizing Themes & Tokens

The application visual configuration resides at the top of [`public/style.css`](public/style.css). You can configure accent colors, shadow depths, margins, and animation timings directly in the CSS `:root` or `[data-theme="dark"]` token objects:

```css
:root {
  --primary-color: #6366f1; /* Main button / branding */
  --secondary-color: #0ea5e9; /* Supporting accents */
  --accent-pink: #f43f5e; /* Like pop alerts */
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

---

## 📝 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
