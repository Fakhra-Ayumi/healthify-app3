# Healthify

A full-stack fitness tracking app I built during my McGill Coding Bootcamp. Healthify helps you build workout routines, track your daily activity, set personal goals, and earn badges as you stay consistent.

## Project Overview

I wanted to build something that would actually help me stay on track with fitness goals. The main idea behind Healthify is consistency — the app encourages you to log workouts every day with a 20-day commitment challenge, and it rewards you with badges when you hit milestones.

There's a React frontend with Material UI for the interface and charts, and a Node.js/Express backend with MongoDB for data storage. Everything is written in TypeScript.

## Features

- **User Authentication** — Register and log in with JWT-based auth that persists across sessions
- **Profile Management** — Edit your name, purpose, and upload a profile image
- **Weekly & 3-Month Goals** — Set goals, lock them in so you can't change them, and track completion status
- **Workout Routine Builder** — Create and manage daily workout menus with activities and parameter sets
- **Parameter Tracking** — Track weight, distance, speed, time, reps, and more per set
- **Done for Today** — Mark workouts complete; all sets auto-reset the next day at midnight
- **Progressive Suggestions** — The app suggests increased values for your next session based on what you did
- **20-Day Commitment Challenge** — A visual streak tracker that records which days you were active over 20 days
- **Badge System** — Earn Bronze, Silver, and Gold badges for weekly goals, 3-month goals, and streaks
- **Milestones Page** — Line charts showing your progress over time and a pie chart for improvement rate
- **Workout History** — Every completed workout is logged so you can look back at your data

## Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local instance or MongoDB Atlas)
- npm

### Setup

1. Clone the repo:

   ```bash
   git clone <your-repo-url>
   cd my-healthify-app
   ```

2. Install server dependencies:

   ```bash
   cd server
   npm install
   ```

3. Install client dependencies:

   ```bash
   cd ../client
   npm install
   ```

4. Create a `.env` file in the `server/` folder:

   ```
   MONGODB_URI=mongodb://localhost:27017/healthify
   JWT_SECRET=your_secret_key_here
   PORT=8000
   ```

5. Start the backend server:

   ```bash
   cd server
   npm run dev
   ```

6. In a separate terminal, start the frontend:

   ```bash
   cd client
   npm run dev
   ```

The client runs on `http://localhost:5173` (or whichever port Vite assigns) and the server runs on `http://localhost:8000`.

## Usage

1. **Sign Up** — Create an account on the signup page
2. **Set Up Profile** — Add your name, purpose, and set your weekly/3-month goals in the Profile tab
3. **Build Routines** — Go to the Routine Builder to create workout menus for each day of the week
4. **Track Workouts** — Fill in your sets with actual values, mark them complete, and hit "Done for Today"
5. **Check Milestones** — Visit the Milestones tab to see your streak record and progress charts
6. **Earn Badges** — Lock in goals, complete them, and maintain streaks to unlock Bronze/Silver/Gold badges

## Technologies Used

### Frontend

- React 19
- TypeScript
- Vite
- Material UI 7 (MUI)
- Recharts (data visualization)
- React Router v7
- Axios

### Backend

- Node.js
- Express 5
- TypeScript
- MongoDB with Mongoose 9
- JSON Web Tokens (JWT)
- bcryptjs
- express-validator

### Testing

- Mocha
- Chai
- Supertest
- mongodb-memory-server
- tsx

## Running Tests

```bash
cd server
npm test                  # all tests (unit + integration)
npm run test:unit         # unit tests only
npm run test:integration  # integration tests only
```

The tests use an in-memory MongoDB instance so you don't need a running database.

## Future Improvements

- **Social Features** — Follow friends and compare streaks/progress
- **Workout Templates** — Pre-built routines for people who don't know where to start
- **Rest Timer** — Built-in countdown timer between sets
- **Dark Mode** — Full dark theme option
- **Mobile App** — A React Native version for iOS and Android
- **Export Data** — Download workout history as CSV or PDF
- **Push Notifications** — Reminders to log your workouts
- **AI Suggestions** — Smarter progressive overload recommendations based on your history
- **Calendar View** — Monthly calendar view showing which days you worked out
