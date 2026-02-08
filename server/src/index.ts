import express from 'express';
import cors from 'cors';
import connectDB from './db';
import authRoutes from './routes/authRoutes';

const app = express();
const PORT = process.env.PORT || 8000;

connectDB();

// Middleware
app.use(cors());
app.use(express.json()); 

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Healthify API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});