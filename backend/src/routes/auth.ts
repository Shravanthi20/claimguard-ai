import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db";
import { authenticateToken, generateToken } from "../middleware/authMiddleware";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Email, password, and name are required fields.",
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({
        error: "USER_EXISTS",
        message: "An account with this email address already exists.",
      });
      return;
    }

    const validRole = role && ["CUSTOMER", "INVESTIGATOR", "ADMIN"].includes(role.toUpperCase())
      ? role.toUpperCase()
      : "CUSTOMER";

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        name: name.trim(),
        role: validRole,
      },
    });

    // Create a default demo policy if registering as CUSTOMER
    if (validRole === "CUSTOMER") {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      await prisma.policy.create({
        data: {
          policyNumber: `POL-AUTO-${randomNum}`,
          userId: user.id,
          policyType: "Comprehensive Auto Policy",
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          coverageAmount: 50000,
        },
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    res.status(500).json({
      error: "SERVER_ERROR",
      message: "An error occurred while creating your account.",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Email and password are required.",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid email address or password.",
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid email address or password.",
      });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({
      error: "SERVER_ERROR",
      message: "An error occurred during authentication.",
    });
  }
});

// GET /api/auth/me
router.get("/me", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        policies: true,
      },
    });

    if (!user) {
      res.status(444).json({ error: "USER_NOT_FOUND", message: "User account not found." });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Me endpoint error:", error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch user profile." });
  }
});

export default router;
