import express from "express";
import cors from "cors";
import cilentRoutes from "./routes/cilentRoute.js"; 

const app = express();

// Enable CORS for frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

//Routes
app.use('/', cilentRoutes);

app.listen(5000, () => {
    console.log("Server started at http://localhost:5000");
});
