# Healthify
## Project Overview

A full-stack fitness tracking app built as a capstone project for the McGill Coding Bootcamp. Healthify is a simple fitness record-keeping app, built to create workout routines instantly, and track achievements visually.

## Background Story

This project started from  my brother's wish to have an app that would take less time in record activities and focus more on workout. Besides this main idea of the app is the app's motivational aspect — it encourages users to log workouts every day with a 20-day commitment challenge, and it rewards them with badges when they hit milestones.

## Features

- **User Authentication** — Register and log in with JWT-based authentication that persists across sessions.
- **Profile Management** — Edit your name, purpose, and upload a profile image
- **Weekly & 3-Month Goals** — Set and edit goals. Lock them in to both start the challenge and save the data in the database.
- **Workout Routine Builder** — Create and manage daily workout menus with customizable parameters, status, and suggested values.
- **Workout Status** — Mark workouts as complete. All sets auto-reset the next day at midnight.
- **Parameter Tracking** — Track the progress of each weight, distance, speed and time per day visually.
- **Progressive Suggestions** — The app suggests increased/decreased values for your next session based on your recorded data.
- **Streak Tracker** — Commitment challenge and weekly progress record the missed, active and relatively active days over 14-20 days.
- **Reward System** — Earn Bronze, Silver, and Gold badges for weekly goals, 3-month goals, and streaks upon accomplishments.
- **Milestones Page** — Weekly progress displays the completion rate of daily activities. Line charts display your how tour activity value progress over time and a pie chart shows the comparison of improvement rate between different parameters in a pie chart form.

## Note:
- This app is built with real time data tracking and is meant to be used daily. If you want to test the app without waiting for the next day, you can test it using the tests in the server folder, which use an in-memory MongoDB instance and mock the date to simulate the daily actions. Scroll down to see the instructions for running tests.

## Installation

### Prerequisites

- Node.js
- MongoDB (local instance or MongoDB Atlas)
- npm

### Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/Fakhra-Ayumi/healthify-app3.git
   cd my-healthify-app
   ```

2. In one terminal, install server dependencies:

   ```bash
   cd server
   npm install
   ```

3. In another terminal, install client dependencies:

   ```bash
   cd client
   npm install
   ```

4. Create a `.env` file in the `server/` folder:

   ```
   MONGODB_URI=mongodb+srv://fakhra_healthify:Fit_forever@cluster0.baeos7b.mongodb.net/healthify?appName=Cluster0
   JWT_SECRET=your_temporary_secret_key
   PORT=8000
   ```

5. Start the backend server:

   ```bash
   npm run dev
   ```

6. Start the frontend server:

   ```bash
   npm run dev
   ```

The client runs on `http://localhost:5173` and the server runs on `http://localhost:8000`.

## Usage

1. **Sign Up** — Create an account on the signup page
2. **Set Up Profile** — Add your name, purpose, and set your weekly/3-month goals in the Profile tab.
3. **Build Routines** — Visit the Routine Builder tab to create workout menus for every day of a week.
4. **Track Workouts** — Fill in your sets with actual values, mark their status, and hit "Done for Today" once done.
5. **Check Milestones** — Visit the Milestones tab to see your streak record and progress charts (the progress will only show up once you hit the "Done for Today" button).
6. **Earn Badges** — Lock in goals, complete them, and maintain streaks to unlock Bronze/Silver/Gold badges.

## Technologies Used

### Frontend

- React
- TypeScript
- Vite
- Material UI
- Recharts
- React Router
- Axios

### Backend

- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- JSON Web Tokens
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

The tests use an in-memory MongoDB instance; there is no need for a separate database.

## Future Improvements

- **App Logo** — Removing the background of the app logo currently displayed in the browser tab
- **Weekly Progress Order** - Flipping order of displaying the weekly progress from recent to the oldest
- **Customized Badges** - Replacing template badges with customized ones that better represent their description and fit the app's theme and design
- **Rest Timer** — Built-in countdown timer between sets
- **Light/Dark Mode** — Dark and light theme option and a better way to apply the theme colors to have stronger brand identity and a more cohesive design
- **Selective Display** - Giving users the option to display their preferred parameters to track and show in the Milestones page
- **Calendar View** — Monthly calendar view replacing the weekly progress bar in Milestones page for a better visualization of the progress
