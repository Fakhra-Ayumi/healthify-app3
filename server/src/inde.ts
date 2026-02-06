import express from 'express';
import cors from 'cors';
import connectDB from './db';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json()); 

app.get('/', (req, res) => {
  res.send('Healthify API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});