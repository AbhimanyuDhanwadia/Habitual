# Running Habitual App

Welcome to Habitual, the Gamified Productivity & Wellness Hub! This project is a full-stack application with a React (Vite) frontend and a Node.js (Express + MongoDB) backend. 

Follow these detailed steps to get the application running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your system:
1. **Node.js** (v18.0.0 or higher recommended) - [Download Node.js](https://nodejs.org/)
2. **MongoDB** - You need a running MongoDB instance. You can either:
   - Install it locally: [Download MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Use a free cloud database via [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## Step 1: Backend Setup

The backend handles the API, authentication, database models, and gamification logic.

1. **Open a new terminal window** and navigate to the `server` directory:
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   The server requires a `.env` file to connect to the database and configure local API/CORS settings.
   Verify that `server/.env` exists and contains:
   ```env
   MONGODB_URI=mongodb://localhost:27017/habitual
   PORT=5001
   CLIENT_URL=http://localhost:5173
   ```
   *(Note: If you are using MongoDB Atlas, replace the `MONGODB_URI` with your Atlas connection string).*

4. **Seed the database (First run only):**
   This step populates the database with default habits and shop items.
   ```bash
   npm run seed
   ```
   *You should see a success message indicating that habits and shop items were seeded.*

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   *You should see a message: `🚀 Habitual API running on http://localhost:5001` and `✅ MongoDB connected`.*

---

## Step 2: Frontend Setup

The frontend is a modern React application built with Vite for lightning-fast development.

1. **Open a SECOND terminal window** (keep the backend running in the first one) and navigate to the `client` directory:
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   *You should see Vite start the server, typically on `http://localhost:5173`.*

---

## Step 3: Access the Application

1. Open your web browser and navigate to: **http://localhost:5173**
2. You will be greeted by the Landing page.
3. Click **Get Started** or **Create Free Account** to sign up.
   - *Tip:* Since you seeded the database, you'll receive a signup bonus of 50 coins and be able to select an initial avatar!
4. Explore the Dashboard, add some Daily Tasks, create phased To-Dos, and browse the Shop.

---

## Troubleshooting

- **MongoDB Connection Error (`ECONNREFUSED`):** Make sure your local MongoDB server is actually running. On Mac, if installed via Homebrew, you might need to run `brew services start mongodb-community`.
- **API Requests Failing / Network Errors:** Ensure the backend is running on port 5001 and the frontend is on port 5173. If your ports differ, set `VITE_API_BASE_URL` for the frontend and update the `CLIENT_URL` in `server/.env`.
- **Blank Page on Frontend:** Ensure you ran `npm install` in the `client` directory. If dependencies are missing, the React app won't render.
