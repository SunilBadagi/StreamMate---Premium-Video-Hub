import dotenv from "dotenv";
// Load environment variables
dotenv.config();

import express from "express";
import cors from "cors";
import paymentRoutes from "./routes/payment";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5001;

// ✅ Enable CORS to allow frontend to communicate with backend
app.use(
  cors({
    origin: "*", // Allow requests from any origin (can be restricted later)
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// ✅ Middleware
app.use(express.json());

// ✅ Content Security Policy (CSP) Fix
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );
  next();
});

// ✅ Routes
app.use("/api", paymentRoutes);

// ✅ Health Check Endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
