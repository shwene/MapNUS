import express from "express";
import cors from "cors";
import cilentRoutes from "./routes/cilentRoute.js"; 

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

//Routes
app.use('/', cilentRoutes);

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
