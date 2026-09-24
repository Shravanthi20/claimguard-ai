import express from "express";
import cors from "cors";
import claimRoutes from "./routes/claims";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ClaimGuard AI backend",
  });
});

app.use("/api/claims", claimRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});