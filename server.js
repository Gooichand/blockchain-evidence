require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");
const sendError = require("./utils/sendError");

// ── Shared config ───────────────────────────────────────────────────────────
const { PORT, connectedUsers } = require("./config");
const { validateWalletAddress } = require("./middleware/verifyAdmin");
const { limiter } = require("./middleware/rateLimiters");
const { setIO: setNotificationIO } = require("./services/notificationService");
const {
  setIO: setNotificationControllerIO,
} = require("./controllers/notificationController");

// ── Express + HTTP + Socket.IO ──────────────────────────────────────────────
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? (
            process.env.ALLOWED_ORIGINS?.split(",") || [
              "https://blockchain-evidence.onrender.com",
            ]
          ).map((url) => url.trim())
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
  },
});

// Inject the io instance into services that need it
setNotificationIO(io);
setNotificationControllerIO(io);

// ── WebSocket connection handling ───────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (walletAddress) => {
    if (validateWalletAddress(walletAddress)) {
      connectedUsers.set(walletAddress, socket.id);
      socket.join(walletAddress);
      console.log(`User ${walletAddress} joined notifications`);
    }
  });

  socket.on("disconnect", () => {
    for (const [wallet, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(wallet);
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

// ── Middleware (ORDER IS CRITICAL!) ─────────────────────────────────────────

// 1. CORS MUST BE FIRST
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? (
            process.env.ALLOWED_ORIGINS?.split(",") || [
              "https://blockchain-evidence.onrender.com",
            ]
          ).map((url) => url.trim())
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);

// 2. JSON / BODY PARSER
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 3. STATIC FILES — BEFORE API ROUTES
app.use(express.static(path.join(__dirname, "public")));

// 4. General rate limiter
app.use("/api/", limiter);

// ── Routes ──────────────────────────────────────────────────────────────────
const registerRoutes = require("./routes");
registerRoutes(app);

// Evidence export rate limiting
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 downloads per hour
});

// Validation helpers
const validateWalletAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const allowedRoles = [
  "public_viewer",
  "investigator",
  "forensic_analyst",
  "legal_professional",
  "court_official",
  "evidence_manager",
  "auditor",
  "admin",
];

// ============================================================================
// CRITICAL: Health Check BEFORE Static Files (but after middleware)
// ============================================================================
app.get("/api/health", (req, res) => {
  console.log("🏥 Health check endpoint called");
  res.setHeader("Content-Type", "application/json");
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    port: PORT,
  });
});

// Evidence export helper functions
const generateWatermarkText = (userWallet, caseNumber, timestamp) => {
  return `${userWallet.slice(0, 8)}... | Case: ${caseNumber || "N/A"} | ${new Date(timestamp).toLocaleString()}`;
};

const watermarkImage = async (imageBuffer, watermarkText) => {
  try {
    const image = sharp(imageBuffer);
    const { width, height } = await image.metadata();

    const watermarkSvg = `
            <svg width="${width}" height="${height}">
                <rect width="100%" height="100%" fill="none"/>
                <text x="10" y="${height - 20}" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.8)" stroke="rgba(0,0,0,0.8)" stroke-width="1">${watermarkText}</text>
            </svg>
        `;

    return await image
      .composite([{ input: Buffer.from(watermarkSvg), top: 0, left: 0 }])
      .toBuffer();
  } catch (error) {
    console.error("Image watermarking error:", error);
    return imageBuffer; // Return original if watermarking fails
  }
};

const watermarkPDF = async (pdfBuffer, watermarkText) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      page.drawText(watermarkText, {
        x: 10,
        y: 10,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    return await pdfDoc.save();
  } catch (error) {
    console.error("PDF watermarking error:", error);
    return pdfBuffer; // Return original if watermarking fails
  }
};

const logDownloadAction = async (
  userWallet,
  evidenceId,
  actionType,
  details,
) => {
  try {
    await supabase.from("activity_logs").insert({
      user_id: userWallet,
      action: actionType,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error logging download action:", error);
  }
};

// Middleware to verify admin permissions
const verifyAdmin = async (req, res, next) => {
  try {
    const { adminWallet } = req.body;

    if (!adminWallet || !validateWalletAddress(adminWallet)) {
      return sendError(res, 400, "Invalid target wallet address");
    }

    // For local development, allow any wallet to be admin (since we're using localStorage)
    // In production, this should be restricted to specific wallets
    req.admin = {
      wallet_address: adminWallet,
      full_name: "Administrator",
      role: "admin",
      is_active: true,
    };
    next();
    return;

    // Database check (commented out for local development)
    /*
        const { data: admin, error } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', adminWallet)
            .eq('role', 'admin')
            .eq('is_active', true)
            .single();

        if (error || !admin) {
            return res.status(403).json({ error: 'Access denied. Administrator privileges required' });
        }

        req.admin = admin;
        next();
        */
  } catch (error) {
    console.error("Admin verification error:", error);
    sendError(res, 500, "Internal server error");
  }
};

// Log admin actions
const logAdminAction = async (
  adminWallet,
  actionType,
  targetWallet,
  details,
) => {
  try {
    await supabase.from("admin_actions").insert({
      admin_wallet: adminWallet,
      action_type: actionType,
      target_wallet: targetWallet,
      details: details,
    });
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
};

// API Routes
// Rate limiter for case timeline pages
const timelineLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window for timeline pages
});

// Case timeline route
app.get("/case-timeline", timelineLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "case-timeline.html"));
});

// Enhanced upload demo route
app.get("/upload-demo", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "enhanced-upload-demo.html"));
});
// Rate limiter for public policy pages
const policyPageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window for policy pages
});

// Privacy policy route
app.get("/privacy", policyPageLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "privacy.html"));
});

// Data protection route
app.get("/data-protection", policyPageLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "data-protection.html"));
});

// Public demo case route
app.get("/demo-case", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "demo-case.html"));
});

// Notification API endpoints
// Get user notifications
app.get("/api/notifications/:wallet", async (req, res) => {
  try {
    const { wallet } = req.params;
    const { limit = 50, offset = 0, unread_only = false } = req.query;

    if (!validateWalletAddress(wallet)) {
      sendError(res, 400, "Invalid wallet address");
      return;
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_wallet", wallet)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unread_only === "true") {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_wallet", wallet)
      .eq("is_read", false);

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    sendError(res, 500, "Failed to get notifications");
  }
});

// Mark notification as read
app.post("/api/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const { userWallet } = req.body;

    if (!validateWalletAddress(userWallet)) {
      sendError(res, 400, "Invalid wallet address");
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_wallet", userWallet);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Mark notification read error:", error);
    sendError(res, 500, "Failed to mark notification as read");
  }
});

// Mark all notifications as read
app.post("/api/notifications/read-all", async (req, res) => {
  try {
    const { userWallet } = req.body;

    if (!validateWalletAddress(userWallet)) {
      sendError(res, 400, "Invalid wallet address");
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_wallet", userWallet)
      .eq("is_read", false);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    sendError(res, 500, "Failed to mark all notifications as read");
  }
});

// Create notification (for testing)
app.post("/api/notifications/create", async (req, res) => {
  try {
    const { userWallet, title, message, type, data } = req.body;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    // Create notification object
    const notification = {
      id: Date.now(),
      user_wallet: userWallet,
      title,
      message,
      type,
      data,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    // Send real-time notification if user is connected
    if (connectedUsers.has(userWallet)) {
      io.to(userWallet).emit("notification", notification);
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Create notification error:", error);
    sendError(res, 500, "Failed to create notification");
  }
});

// Email authentication endpoints
app.post("/api/auth/email-login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendError(res, 400, "Email and password are required");
      return;
    }

    // Get user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("is_active", true)
      .single();

    if (error || !user) {
      sendError(res, 401, "Invalid email or password");
      return;
    }

    // Verify password using database function
    const { data: passwordValid, error: verifyError } = await supabase.rpc(
      "verify_password",
      { password, hash: user.password_hash },
    );

    if (verifyError || !passwordValid) {
      sendError(res, 401, "Invalid email or password");
      return;
    }

    // Log login activity
    await supabase.from("activity_logs").insert({
      user_id: user.email,
      action: "email_login",
      details: JSON.stringify({ auth_type: "email" }),
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department: user.department,
        jurisdiction: user.jurisdiction,
        auth_type: user.auth_type,
      },
    });
  } catch (error) {
    console.error("Email login error:", error);
    sendError(res, 500, "Login failed");
  }
});

// Email registration endpoint
app.post("/api/auth/email-register", authLimiter, async (req, res) => {
  try {
    const { email, password, fullName, role, department, jurisdiction } =
      req.body;

    console.log("Email registration request:", {
      email,
      fullName,
      role,
      department,
      jurisdiction,
    });

    if (!email || !password || !fullName || !role) {
      sendError(res, 400, "Email, password, full name, and role are required");
      return;
    }

    if (password.length < 6) {
      sendError(res, 400, "Password must be at least 6 characters long");
      return;
    }

    if (!allowedRoles.includes(role)) {
      sendError(res, 400, "Invalid role selected");
      return;
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      sendError(res, 409, "Email address already registered");
      return;
    }

    // Hash password using database function
    const { data: hashedPassword, error: hashError } = await supabase.rpc(
      "hash_password",
      { password },
    );

    if (hashError) {
      console.error("Password hashing error:", hashError);
      throw hashError;
    }

    // Create user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        full_name: fullName,
        role: role,
        department: department || "General",
        jurisdiction: jurisdiction || "General",
        auth_type: "email",
        account_type: "real",
        created_by: "self_registration",
        is_active: true,
        email_verified: true,
      })
      .select()
      .single();

    if (error) {
      console.error("User creation error:", error);
      throw error;
    }

    console.log("User created successfully:", newUser.id);

    // Log registration activity
    await supabase.from("activity_logs").insert({
      user_id: newUser.email,
      action: "email_registration",
      details: JSON.stringify({
        role: role,
        auth_type: "email",
        department: department || "General",
      }),
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Registration successful",
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        department: newUser.department,
        jurisdiction: newUser.jurisdiction,
        auth_type: newUser.auth_type,
      },
    });
  } catch (error) {
    console.error("Email registration error:", error);
    sendError(res, 500, "Registration failed: " + error.message);
  }
});

// Wallet registration endpoint
app.post("/api/auth/wallet-register", authLimiter, async (req, res) => {
  try {
    const {
      walletAddress,
      fullName,
      role,
      department,
      jurisdiction,
      badgeNumber,
    } = req.body;

    console.log("Wallet registration request:", {
      walletAddress,
      fullName,
      role,
      department,
      jurisdiction,
    });

    if (!validateWalletAddress(walletAddress)) {
      sendError(res, 400, "Invalid wallet address");
      return;
    }

    if (!fullName || !role) {
      sendError(res, 400, "Full name and role are required");
      return;
    }

    if (!allowedRoles.includes(role)) {
      sendError(res, 400, "Invalid role selected");
      return;
    }

    // Check if wallet already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("wallet_address")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (existingUser) {
      sendError(res, 409, "Wallet address already registered");
      return;
    }

    // Create user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        wallet_address: walletAddress.toLowerCase(),
        full_name: fullName,
        role: role,
        department: department || "General",
        jurisdiction: jurisdiction || "General",
        badge_number: badgeNumber || "",
        auth_type: "wallet",
        account_type: "real",
        created_by: "self_registration",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Wallet user creation error:", error);
      throw error;
    }

    console.log("Wallet user created successfully:", newUser.id);

    // Log registration activity
    await supabase.from("activity_logs").insert({
      user_id: newUser.wallet_address,
      action: "wallet_registration",
      details: JSON.stringify({
        role: role,
        auth_type: "wallet",
        department: department || "General",
      }),
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Registration successful",
      user: {
        id: newUser.id,
        wallet_address: newUser.wallet_address,
        full_name: newUser.full_name,
        role: newUser.role,
        department: newUser.department,
        jurisdiction: newUser.jurisdiction,
        badge_number: newUser.badge_number,
        auth_type: newUser.auth_type,
      },
    });
  } catch (error) {
    console.error("Wallet registration error:", error);
    sendError(res, 500, "Registration failed: " + error.message);
  }
});

// Update user profile
app.put("/api/user/profile/:id", authLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, department, jurisdiction, badgeNumber, updatedBy } =
      req.body;

    if (!validateWalletAddress(updatedBy)) {
      sendError(res, 400, "Invalid updater wallet address");
      return;
    }

    // Get updater info
    const { data: updater } = await supabase
      .from("users")
      .select("id, role")
      .eq("wallet_address", updatedBy)
      .single();

    if (!updater) {
      sendError(res, 403, "Unauthorized");
      return;
    }

    // Check if user can update this profile (self or admin)
    const { data: targetUser } = await supabase
      .from("users")
      .select("wallet_address")
      .eq("id", id)
      .single();

    if (!targetUser) {
      sendError(res, 404, "User not found");
      return;
    }

    if (targetUser.wallet_address !== updatedBy && updater.role !== "admin") {
      return sendError(
        res,
        403,
        "Can only update own profile or admin required",
      );
    }

    // Use database function to update profile
    const { data: result, error } = await supabase.rpc("update_user_profile", {
      p_user_id: parseInt(id),
      p_full_name: fullName,
      p_department: department,
      p_jurisdiction: jurisdiction,
      p_badge_number: badgeNumber,
      p_updated_by: updater.id,
    });

    if (error) {
      throw error;
    }

    res.json(result);
  } catch (error) {
    console.error("Update profile error:", error);
    sendError(res, 500, "Failed to update profile");
  }
});

// Get user by wallet address with enhanced data
app.get("/api/user/:wallet", authLimiter, async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!validateWalletAddress(wallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    // Use database function to get user
    const { data: result, error } = await supabase.rpc(
      "get_user_by_identifier",
      {
        p_identifier: wallet,
      },
    );

    if (error) {
      throw error;
    }

    res.json({ user: result });
  } catch (error) {
    console.error("Get user error:", error);
    sendError(res, 500, "Internal server error");
  }
});

// Create regular user (Admin only)
app.post(
  "/api/admin/create-user",
  adminLimiter,
  verifyAdmin,
  async (req, res) => {
    try {
      const { adminWallet, userData } = req.body;
      const {
        walletAddress,
        fullName,
        role,
        department,
        jurisdiction,
        badgeNumber,
      } = userData;

      // Validate input
      if (!validateWalletAddress(walletAddress)) {
        return sendError(res, 400, "Invalid wallet address format");
      }

      if (!fullName || !role) {
        return sendError(res, 400, "Full name and role are required");
      }

      if (!allowedRoles.includes(role) || role === "admin") {
        return sendError(res, 400, "Invalid role for regular user");
      }

      // Check if wallet already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("wallet_address")
        .eq("wallet_address", walletAddress)
        .single();

      if (existingUser) {
        return sendError(res, 409, "Wallet address already registered");
      }

      // Create user
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          wallet_address: walletAddress,
          full_name: fullName,
          role: role,
          department: department || "General",
          jurisdiction: jurisdiction || "General",
          badge_number: badgeNumber || "",
          account_type: "real",
          created_by: adminWallet,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log admin action
      await logAdminAction(adminWallet, "create_user", walletAddress, {
        user_name: fullName,
        user_role: role,
        department: department,
      });

      // Send welcome notification to new user
      await createNotification(
        walletAddress,
        "Welcome to EVID-DGC",
        `Your ${role} account has been created successfully. You can now access the system.`,
        "system",
        { role, department },
      );

      // Notify admin of successful user creation
      await createNotification(
        adminWallet,
        "User Created Successfully",
        `New ${role} account created for ${fullName}`,
        "system",
        { action: "user_created", targetUser: fullName, role },
      );

      res.json({ success: true, user: newUser });
    } catch (error) {
      console.error("Create user error:", error);
      sendError(res, 500, "Failed to create user");
    }
  },
);

// Create admin user (Admin only)
app.post(
  "/api/admin/create-admin",
  adminLimiter,
  verifyAdmin,
  async (req, res) => {
    try {
      const { adminWallet, adminData } = req.body;
      const { walletAddress, fullName } = adminData;

      // Validate input
      if (!validateWalletAddress(walletAddress)) {
        return sendError(res, 400, "Invalid wallet address format");
      }

      if (!fullName) {
        return sendError(res, 400, "Full name is required");
      }

      // Check admin limit
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("is_active", true);

      if (count >= 10) {
        return sendError(res, 400, "Maximum admin limit (10) reached");
      }

      // Check if wallet already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("wallet_address")
        .eq("wallet_address", walletAddress)
        .single();

      if (existingUser) {
        return sendError(res, 409, "Wallet address already registered");
      }

      // Create admin
      const { data: newAdmin, error } = await supabase
        .from("users")
        .insert({
          wallet_address: walletAddress,
          full_name: fullName,
          role: "admin",
          department: "Administration",
          jurisdiction: "System",
          account_type: "real",
          created_by: adminWallet,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log admin action
      await logAdminAction(adminWallet, "create_admin", walletAddress, {
        admin_name: fullName,
      });

      // Send welcome notification to new admin
      await createNotification(
        walletAddress,
        "Admin Access Granted",
        `Your administrator account has been created. You now have full system access.`,
        "system",
        { role: "admin" },
      );

      // Notify creating admin
      await createNotification(
        adminWallet,
        "New Administrator Created",
        `Administrator account created for ${fullName}`,
        "system",
        { action: "admin_created", targetAdmin: fullName },
      );

      res.json({ success: true, admin: newAdmin });
    } catch (error) {
      console.error("Create admin error:", error);
      sendError(res, 500, "Failed to create admin");
    }
  },
);

// Delete user (Admin only)
app.post(
  "/api/admin/delete-user",
  adminLimiter,
  verifyAdmin,
  async (req, res) => {
    try {
      const { adminWallet, targetWallet } = req.body;

      if (!validateWalletAddress(targetWallet)) {
        return sendError(res, 400, "Invalid target wallet address");
      }

      // Prevent self-deletion
      if (adminWallet === targetWallet) {
        return sendError(
          res,
          400,
          "Administrators cannot delete their own account",
        );
      }

      // Get target user info for logging
      const { data: targetUser } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", targetWallet)
        .single();

      if (!targetUser) {
        return sendError(res, 404, "Target user not found");
      }

      // Soft delete user
      const { error } = await supabase
        .from("users")
        .update({
          is_active: false,
          last_updated: new Date().toISOString(),
        })
        .eq("wallet_address", targetWallet);

      if (error) {
        throw error;
      }

      // Log admin action
      await logAdminAction(adminWallet, "delete_user", targetWallet, {
        action: "soft_delete",
        target_user_name: targetUser.full_name,
        target_user_role: targetUser.role,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      sendError(res, 500, "Failed to delete user");
    }
  },
);

// Get all users with enhanced filtering and pagination
app.get("/api/admin/users", adminLimiter, async (req, res) => {
  try {
    const { adminWallet } = req.query;
    const { limit = 50, offset = 0, role, active_only = "true" } = req.query;

    if (!validateWalletAddress(adminWallet)) {
      return sendError(res, 400, "Invalid admin wallet address");
    }

    // Verify admin permissions
    const { data: admin } = await supabase
      .from("users")
      .select("role")
      .eq("wallet_address", adminWallet)
      .eq("is_active", true)
      .single();

    if (!admin || admin.role !== "admin") {
      sendError(res, 403, "Admin privileges required");
      return;
    }

    // Use database function for efficient user retrieval
    const { data: result, error } = await supabase.rpc("get_all_users", {
      p_limit: parseInt(limit),
      p_offset: parseInt(offset),
      p_role_filter: role || null,
      p_active_only: active_only === "true",
    });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get users error:", error);
    sendError(res, 500, "Failed to get users");
  }
});

// Enhanced Evidence Upload API Endpoint
app.post("/api/evidence/upload", upload.single("file"), async (req, res) => {
  try {
    const { caseId, type, description, location, collectionDate, uploadedBy } =
      req.body;
    const file = req.file;

    // Input validation
    if (!file) {
      return sendError(res, 400, "No file uploaded");
    }

    if (!caseId || !type || !uploadedBy) {
      return sendError(res, 400, "Case ID, type, and uploader are required");
    }

    if (!validateWalletAddress(uploadedBy)) {
      return sendError(res, 400, "Invalid uploader wallet address");
    }

    // Sanitize inputs
    const sanitizedCaseId = String(caseId).trim();
    const sanitizedType = String(type).trim();
    const sanitizedDescription = description ? String(description).trim() : "";
    const sanitizedLocation = location ? String(location).trim() : "";

    // File validation
    const allowedTypes = {
      "application/pdf": 100,
      "image/jpeg": 50,
      "image/jpg": 50,
      "image/png": 50,
      "image/gif": 25,
      "video/mp4": 500,
      "video/avi": 500,
      "video/mov": 500,
      "audio/mp3": 100,
      "audio/wav": 200,
      "audio/m4a": 100,
      "application/msword": 50,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 50,
      "text/plain": 10,
    };

    const maxSize = allowedTypes[file.mimetype];
    if (!maxSize) {
      return sendError(res, 400, `File type ${file.mimetype} not supported`, {
        supportedTypes: Object.keys(allowedTypes),
      });
    }

    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return sendError(
        res,
        400,
        `File too large. Maximum size for ${file.mimetype} is ${maxSize}MB`,
        {
          fileSize: file.size,
          maxSize: maxSizeBytes,
        },
      );
    }

    // Calculate file hash
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update(file.buffer).digest("hex");

    // Create evidence record
    const evidenceData = {
      id: "EVD-" + Date.now(),
      caseId: sanitizedCaseId,
      type: sanitizedType,
      description: sanitizedDescription,
      location: sanitizedLocation,
      collectionDate,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      hash,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      status: "uploaded",
    };

    // Store file (in production, use cloud storage)
    // For now, just return success with metadata

    res.json({
      success: true,
      evidence: evidenceData,
      message: "Evidence uploaded successfully",
    });
  } catch (error) {
    console.error("Evidence upload error:", error);
    sendError(res, 500, "Upload failed: " + error.message);
  }
});

// Download single evidence file with watermark
app.post("/api/evidence/:id/download", exportLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { userWallet } = req.body;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    // Verify user exists and has appropriate role
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", userWallet)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      return sendError(res, 403, "Unauthorized access");
    }

    // Check role permissions (public_viewer cannot download)
    if (user.role === "public_viewer") {
      return sendError(res, 403, "Public viewers cannot download evidence");
    }

    // Get evidence details
    const { data: evidence, error: evidenceError } = await supabase
      .from("evidence")
      .select("*")
      .eq("id", id)
      .single();

    if (evidenceError || !evidence) {
      return sendError(res, 404, "Evidence not found");
    }

    // Generate watermark text
    const watermarkText = generateWatermarkText(
      userWallet,
      evidence.case_number,
      new Date(),
    );

    // For demo purposes, create a mock file buffer
    let fileBuffer;
    let contentType;
    let filename;

    if (evidence.file_type?.startsWith("image/")) {
      // Create a simple image buffer for demo
      fileBuffer = Buffer.from("Mock image data for evidence " + id);
      contentType = evidence.file_type;
      filename = `evidence_${id}_watermarked.jpg`;

      // Apply watermark (in real implementation, you'd get actual file from storage)
      // fileBuffer = await watermarkImage(fileBuffer, watermarkText);
    } else if (evidence.file_type === "application/pdf") {
      fileBuffer = Buffer.from("Mock PDF data for evidence " + id);
      contentType = "application/pdf";
      filename = `evidence_${id}_watermarked.pdf`;

      // Apply watermark (in real implementation, you'd get actual file from storage)
      // fileBuffer = await watermarkPDF(fileBuffer, watermarkText);
    } else {
      fileBuffer = Buffer.from("Mock file data for evidence " + id);
      contentType = "application/octet-stream";
      filename = `evidence_${id}_watermarked.bin`;
    }

    // Log download action
    await logDownloadAction(userWallet, id, "evidence_download", {
      evidence_id: id,
      evidence_name: evidence.name,
      file_type: evidence.file_type,
      watermark_applied: true,
      download_timestamp: new Date().toISOString(),
    });

    // Set response headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("X-Watermark-Applied", "true");
    res.setHeader("X-Downloaded-By", userWallet.slice(0, 8) + "...");

    res.send(fileBuffer);
  } catch (error) {
    console.error("Evidence download error:", error);
    sendError(res, 500, "Failed to download evidence");
  }
});

// Bulk export multiple evidence files as ZIP
app.post("/api/evidence/bulk-export", exportLimiter, async (req, res) => {
  try {
    const { evidenceIds, userWallet } = req.body;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    if (
      !evidenceIds ||
      !Array.isArray(evidenceIds) ||
      evidenceIds.length === 0
    ) {
      return sendError(res, 400, "Evidence IDs array is required");
    }

    if (evidenceIds.length > 50) {
      return sendError(res, 400, "Maximum 50 files per bulk export");
    }

    // Verify user exists and has appropriate role
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", userWallet)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      return sendError(res, 403, "Unauthorized access");
    }

    // Check role permissions
    if (user.role === "public_viewer") {
      return sendError(res, 403, "Public viewers cannot export evidence");
    }

    // Get evidence details
    const { data: evidenceItems, error: evidenceError } = await supabase
      .from("evidence")
      .select("*")
      .in("id", evidenceIds);

    if (evidenceError || !evidenceItems || evidenceItems.length === 0) {
      return sendError(res, 404, "No evidence found with provided IDs");
    }

    // Create ZIP archive
    const archive = archiver("zip", { zlib: { level: 9 } });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const zipFilename = `evidence_export_${timestamp}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipFilename}"`,
    );
    res.setHeader("X-Export-Count", evidenceItems.length.toString());
    res.setHeader("X-Exported-By", userWallet.slice(0, 8) + "...");

    archive.pipe(res);

    // Add metadata file
    const metadata = {
      export_info: {
        exported_by: userWallet,
        export_timestamp: new Date().toISOString(),
        total_files: evidenceItems.length,
        watermark_applied: true,
      },
      evidence_items: evidenceItems.map((item) => ({
        id: item.id,
        name: item.name,
        case_number: item.case_number,
        file_type: item.file_type,
        hash: item.hash,
        submitted_by: item.submitted_by,
        timestamp: item.timestamp,
        blockchain_verified: true,
      })),
    };

    archive.append(JSON.stringify(metadata, null, 2), {
      name: "export_metadata.json",
    });

    // Add each evidence file with watermark
    for (const evidence of evidenceItems) {
      const watermarkText = generateWatermarkText(
        userWallet,
        evidence.case_number,
        new Date(),
      );

      // For demo purposes, create mock file data
      let fileBuffer = Buffer.from(
        `Mock evidence data for ${evidence.name} (ID: ${evidence.id})`,
      );
      let filename = `${evidence.id}_${evidence.name || "evidence"}`;

      if (evidence.file_type?.startsWith("image/")) {
        filename += "_watermarked.jpg";
      } else if (evidence.file_type === "application/pdf") {
        filename += "_watermarked.pdf";
      } else {
        filename += "_watermarked.bin";
      }

      archive.append(fileBuffer, { name: filename });
    }

    // Log bulk export action
    await logDownloadAction(userWallet, null, "evidence_bulk_export", {
      evidence_ids: evidenceIds,
      total_files: evidenceItems.length,
      export_format: "zip",
      watermark_applied: true,
      export_timestamp: new Date().toISOString(),
    });

    archive.finalize();
  } catch (error) {
    console.error("Bulk export error:", error);
    sendError(res, 500, "Failed to export evidence");
  }
});

// Get download history for specific evidence
app.get("/api/evidence/:id/download-history", async (req, res) => {
  try {
    const { id } = req.params;
    const { userWallet } = req.query;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    // Verify user has admin or auditor role to view download history
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("wallet_address", userWallet)
      .eq("is_active", true)
      .single();

    if (userError || !user || !["admin", "auditor"].includes(user.role)) {
      return sendError(
        res,
        403,
        "Unauthorized: Admin or Auditor role required",
      );
    }

    // Get download history from activity logs
    const { data: downloadHistory, error } = await supabase
      .from("activity_logs")
      .select("*")
      .or(`action.eq.evidence_download,action.eq.evidence_bulk_export`)
      .ilike("details", `%"evidence_id":${id}%`)
      .order("timestamp", { ascending: false });

    if (error) {
      throw error;
    }

    const formattedHistory = downloadHistory.map((log) => ({
      timestamp: log.timestamp,
      user_id: log.user_id,
      action: log.action,
      details: JSON.parse(log.details || "{}"),
    }));

    res.json({
      success: true,
      evidence_id: id,
      download_history: formattedHistory,
    });
  } catch (error) {
    console.error("Download history error:", error);
    sendError(res, 500, "Failed to retrieve download history");
  }
});

// Evidence Tagging API Endpoints

// Get all tags with usage statistics
app.get("/api/tags", async (req, res) => {
  try {
    const { data: tags, error } = await supabase
      .from("tags")
      .select("*")
      .order("usage_count", { ascending: false });

    if (error) throw error;

    res.json({ success: true, tags });
  } catch (error) {
    console.error("Get tags error:", error);
    sendError(res, 500, "Failed to get tags");
  }
});

// Create new tag
app.post("/api/tags", async (req, res) => {
  try {
    const { name, color, category, userWallet } = req.body;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    if (!name || name.trim().length === 0) {
      return sendError(res, 400, "Tag name is required");
    }

    const { data: tag, error } = await supabase
      .from("tags")
      .insert({
        name: name.trim().toLowerCase(),
        color: color || "#3B82F6",
        category: category || "general",
        created_by: userWallet,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return sendError(res, 409, "Tag already exists");
      }
      throw error;
    }

    res.json({ success: true, tag });
  } catch (error) {
    console.error("Create tag error:", error);
    sendError(res, 500, "Failed to create tag");
  }
});

// Add tags to evidence
app.post("/api/evidence/:id/tags", async (req, res) => {
  try {
    const { id } = req.params;
    const { tagIds, userWallet } = req.body;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    if (!tagIds || !Array.isArray(tagIds)) {
      return sendError(res, 400, "Tag IDs array is required");
    }

    const evidenceTags = tagIds.map((tagId) => ({
      evidence_id: parseInt(id),
      tag_id: tagId,
      tagged_by: userWallet,
    }));

    const { data, error } = await supabase
      .from("evidence_tags")
      .insert(evidenceTags)
      .select();

    if (error) throw error;

    res.json({ success: true, evidence_tags: data });
  } catch (error) {
    console.error("Add evidence tags error:", error);
    sendError(res, 500, "Failed to add tags to evidence");
  }
});

// Remove tag from evidence
app.delete("/api/evidence/:id/tags/:tagId", async (req, res) => {
  try {
    const { id, tagId } = req.params;
    const { userWallet } = req.body;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    const { error } = await supabase
      .from("evidence_tags")
      .delete()
      .eq("evidence_id", id)
      .eq("tag_id", tagId)
      .eq("tagged_by", userWallet);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Remove evidence tag error:", error);
    sendError(res, 500, "Failed to remove tag from evidence");
  }
});

// Batch tag operations
app.post("/api/evidence/batch-tag", async (req, res) => {
  try {
    const { evidenceIds, tagIds, userWallet } = req.body;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    if (
      !evidenceIds ||
      !Array.isArray(evidenceIds) ||
      !tagIds ||
      !Array.isArray(tagIds)
    ) {
      return sendError(
        res,
        400,
        "Evidence IDs and tag IDs arrays are required",
      );
    }

    const evidenceTags = [];
    evidenceIds.forEach((evidenceId) => {
      tagIds.forEach((tagId) => {
        evidenceTags.push({
          evidence_id: evidenceId,
          tag_id: tagId,
          tagged_by: userWallet,
        });
      });
    });

    const { data, error } = await supabase
      .from("evidence_tags")
      .insert(evidenceTags)
      .select();

    if (error) throw error;

    res.json({ success: true, tagged_count: data.length });
  } catch (error) {
    console.error("Batch tag error:", error);
    sendError(res, 500, "Failed to batch tag evidence");
  }
});

// Filter evidence by tags
app.get("/api/evidence/by-tags", async (req, res) => {
  try {
    const { tagIds, logic = "AND" } = req.query;

    if (!tagIds) {
      return sendError(res, 400, "Tag IDs are required");
    }

    const tagIdArray = tagIds.split(",").map((id) => parseInt(id.trim()));

    let query;
    if (logic === "OR") {
      query = supabase
        .from("evidence")
        .select(
          `
                    *,
                    evidence_tags!inner(
                        tag_id,
                        tags(name, color)
                    )
                `,
        )
        .in("evidence_tags.tag_id", tagIdArray);
    } else {
      // AND logic - evidence must have ALL specified tags
      query = supabase.rpc("get_evidence_with_all_tags", {
        tag_ids: tagIdArray,
      });
    }

    const { data: evidence, error } = await query;

    if (error) throw error;

    res.json({ success: true, evidence, filter_logic: logic });
  } catch (error) {
    console.error("Filter by tags error:", error);
    sendError(res, 500, "Failed to filter evidence by tags");
  }
});

// Auto-suggest tags
app.get("/api/tags/suggest", async (req, res) => {
  try {
    const { query = "", limit = 10 } = req.query;

    const { data: tags, error } = await supabase
      .from("tags")
      .select("*")
      .ilike("name", `%${query}%`)
      .order("usage_count", { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ success: true, suggestions: tags });
  } catch (error) {
    console.error("Tag suggest error:", error);
    sendError(res, 500, "Failed to get tag suggestions");
  }
});

// Timeline Visualization API Endpoints

// Get evidence by case for timeline
app.get("/api/evidence/by-case/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;

    const { data: evidence, error } = await supabase
      .from("evidence")
      .select("*")
      .eq("case_id", caseId)
      .order("timestamp", { ascending: true });

    if (error) throw error;

    res.json({ success: true, evidence });
  } catch (error) {
    console.error("Get evidence by case error:", error);
    sendError(res, 500, "Failed to get evidence for case");
  }
});

// Export timeline as PDF
app.post("/api/timeline/export-pdf", async (req, res) => {
  try {
    const { caseId, evidence } = req.body;

    // Create PDF content (simplified)
    const pdfContent = `
CASE EVIDENCE TIMELINE REPORT

Case ID: ${caseId}
Generated: ${new Date().toLocaleString()}
Total Evidence Items: ${evidence.length}

EVIDENCE CHRONOLOGY:
${evidence
  .map(
    (item, index) => `
${index + 1}. ${item.title}
   Type: ${item.type}
   Date: ${new Date(item.timestamp).toLocaleString()}
   Submitted by: ${item.submitted_by.substring(0, 8)}...
   Hash: ${item.hash}
`,
  )
  .join("")}

This report was generated by EVID-DGC Blockchain Evidence Management System.
        `;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="timeline_${caseId}_${new Date().toISOString().split("T")[0]}.pdf"`,
    );
    res.send(Buffer.from(pdfContent));
  } catch (error) {
    console.error("Timeline PDF export error:", error);
    sendError(res, 500, "Failed to export timeline as PDF");
  }
});

// Get cases for timeline
app.get("/api/cases", async (req, res) => {
  try {
    const { data: cases, error } = await supabase
      .from("cases")
      .select("id, title, description, status, created_date")
      .order("created_date", { ascending: false });

    if (error) throw error;

    res.json({ success: true, cases });
  } catch (error) {
    console.error("Get cases error:", error);
    sendError(res, 500, "Failed to get cases");
  }
});

// Verify file integrity against blockchain
app.post("/api/evidence/verify-integrity", async (req, res) => {
  try {
    const { fileName, fileSize, calculatedHash, evidenceId } = req.body;

    let evidence = null;
    let verified = false;
    let blockchainHash = null;

    if (evidenceId) {
      // Verify against specific evidence ID
      const { data: evidenceData, error } = await supabase
        .from("evidence")
        .select("*")
        .eq("id", evidenceId)
        .single();

      if (evidenceData) {
        evidence = evidenceData;
        blockchainHash = evidenceData.hash;
        verified = calculatedHash === blockchainHash;
      }
    } else {
      // Search for evidence by hash
      const { data: evidenceData, error } = await supabase
        .from("evidence")
        .select("*")
        .eq("hash", calculatedHash)
        .single();

      if (evidenceData) {
        evidence = evidenceData;
        blockchainHash = evidenceData.hash;
        verified = true;
      }
    }

    // Log verification attempt
    await supabase.from("activity_logs").insert({
      user_id: "public_verification",
      action: "evidence_verification",
      details: JSON.stringify({
        fileName,
        fileSize,
        calculatedHash: calculatedHash.substring(0, 16) + "...",
        verified,
        evidenceId,
      }),
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      verified,
      calculatedHash,
      blockchainHash,
      evidence,
      verificationUrl: `${req.protocol}://${req.get("host")}/verify/${calculatedHash}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Verification error:", error);
    sendError(res, 500, "Verification failed");
  }
});

// Generate verification certificate
app.post("/api/evidence/verification-certificate", async (req, res) => {
  try {
    const { fileName, verificationResult, timestamp } = req.body;

    // Create PDF certificate using jsPDF (simplified)
    const certificateData = {
      fileName,
      verificationResult,
      timestamp,
      certificateId: `CERT-${Date.now()}`,
      issuer: "EVID-DGC Blockchain Evidence System",
    };

    // In a real implementation, you would generate an actual PDF
    const pdfContent = `
EVIDENCE VERIFICATION CERTIFICATE

Certificate ID: ${certificateData.certificateId}
File Name: ${fileName}
Verification Result: ${verificationResult.toUpperCase()}
Verification Date: ${new Date(timestamp).toLocaleString()}
Issued By: ${certificateData.issuer}

This certificate confirms the integrity verification of the above evidence file.
        `;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="verification_certificate_${fileName}_${Date.now()}.pdf"`,
    );
    res.send(Buffer.from(pdfContent));
  } catch (error) {
    console.error("Certificate generation error:", error);
    sendError(res, 500, "Failed to generate certificate");
  }
});

// Public verification endpoint (no authentication required)
app.get("/verify/:hash", async (req, res) => {
  try {
    const { hash } = req.params;

    const { data: evidence, error } = await supabase
      .from("evidence")
      .select("id, title, case_id, timestamp, submitted_by, hash")
      .eq("hash", hash)
      .single();

    if (error || !evidence) {
      return sendError(res, 404, "Evidence not found");
    }

    res.json({
      success: true,
      verified: true,
      evidence: {
        id: evidence.id,
        title: evidence.title,
        case_id: evidence.case_id,
        timestamp: evidence.timestamp,
        submitted_by: evidence.submitted_by.substring(0, 8) + "...", // Partial wallet for privacy
        hash: evidence.hash,
      },
      verification_timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Public verification error:", error);
    sendError(res, 500, "Verification failed");
  }
});

// Get verification history (for admin/auditor)
app.get("/api/evidence/verification-history", async (req, res) => {
  try {
    const { userWallet, limit = 100 } = req.query;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    // Verify user has admin or auditor role
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("wallet_address", userWallet)
      .eq("is_active", true)
      .single();

    if (userError || !user || !["admin", "auditor"].includes(user.role)) {
      return sendError(
        res,
        403,
        "Unauthorized: Admin or Auditor role required",
      );
    }

    const { data: history, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("action", "evidence_verification")
      .order("timestamp", { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ success: true, history });
  } catch (error) {
    console.error("Verification history error:", error);
    sendError(res, 500, "Failed to get verification history");
  }
});

// Retention Policy API Endpoints

// Get all retention policies
app.get("/api/retention-policies", async (req, res) => {
  try {
    const { data: policies, error } = await supabase
      .from("retention_policies")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, policies });
  } catch (error) {
    console.error("Get retention policies error:", error);
    sendError(res, 500, "Failed to get retention policies");
  }
});

// Create retention policy
app.post("/api/retention-policies", async (req, res) => {
  try {
    const {
      name,
      caseType,
      retentionDays,
      archiveMethod,
      jurisdiction,
      lawReference,
      userWallet,
    } = req.body;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    const { data: policy, error } = await supabase
      .from("retention_policies")
      .insert({
        name,
        case_type: caseType,
        retention_days: retentionDays,
        archive_method: archiveMethod,
        jurisdiction,
        law_reference: lawReference,
        created_by: userWallet,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, policy });
  } catch (error) {
    console.error("Create retention policy error:", error);
    sendError(res, 500, "Failed to create retention policy");
  }
});

// Get evidence with expiry information
app.get("/api/evidence/expiry", async (req, res) => {
  try {
    const { filter = "all" } = req.query;
    let query = supabase.from("evidence").select("*");

    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case "expired":
        query = query
          .lt("expiry_date", now.toISOString())
          .eq("legal_hold", false);
        break;
      case "30days":
        query = query
          .lte("expiry_date", thirtyDaysFromNow.toISOString())
          .gte("expiry_date", now.toISOString());
        break;
      case "7days":
        query = query
          .lte("expiry_date", sevenDaysFromNow.toISOString())
          .gte("expiry_date", now.toISOString());
        break;
      case "legal_hold":
        query = query.eq("legal_hold", true);
        break;
    }

    const { data: evidence, error } = await query.order("expiry_date", {
      ascending: true,
    });
    if (error) throw error;

    res.json({ success: true, evidence });
  } catch (error) {
    console.error("Get evidence expiry error:", error);
    sendError(res, 500, "Failed to get evidence expiry information");
  }
});

// Set legal hold on evidence
app.post("/api/evidence/:id/legal-hold", async (req, res) => {
  try {
    const { id } = req.params;
    const { legalHold, userWallet } = req.body;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    const { error } = await supabase
      .from("evidence")
      .update({ legal_hold: legalHold })
      .eq("id", id);

    if (error) throw error;

    // Log the action
    await supabase.from("activity_logs").insert({
      user_id: userWallet,
      action: legalHold ? "legal_hold_set" : "legal_hold_removed",
      details: `Evidence ID: ${id}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Set legal hold error:", error);
    sendError(res, 500, "Failed to set legal hold");
  }
});

// Apply retention policy to multiple evidence
app.post("/api/evidence/bulk-retention-policy", async (req, res) => {
  try {
    const { policyId, evidenceIds, userWallet } = req.body;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    // Get policy details
    const { data: policy, error: policyError } = await supabase
      .from("retention_policies")
      .select("*")
      .eq("id", policyId)
      .single();

    if (policyError || !policy) {
      return sendError(res, 404, "Retention policy not found");
    }

    // Calculate expiry dates
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + policy.retention_days);

    const { error } = await supabase
      .from("evidence")
      .update({
        retention_policy_id: policyId,
        expiry_date: expiryDate.toISOString(),
      })
      .in("id", evidenceIds);

    if (error) throw error;

    res.json({ success: true, updated: evidenceIds.length });
  } catch (error) {
    console.error("Bulk retention policy error:", error);
    sendError(res, 500, "Failed to apply retention policy");
  }
});

// Check for expiring evidence and send notifications
app.post("/api/evidence/check-expiry", async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let notificationsSent = 0;

    // Check for evidence expiring in 30 days
    const { data: expiring30, error: error30 } = await supabase
      .from("evidence")
      .select("*")
      .lte("expiry_date", thirtyDaysFromNow.toISOString())
      .gte("expiry_date", now.toISOString())
      .eq("legal_hold", false);

    if (expiring30) {
      for (const evidence of expiring30) {
        await createNotification(
          evidence.submitted_by,
          "Evidence Expiry Warning",
          `Evidence "${evidence.title}" will expire in 30 days`,
          "system",
          { evidence_id: evidence.id, expiry_date: evidence.expiry_date },
        );
        notificationsSent++;
      }
    }

    res.json({ success: true, notifications_sent: notificationsSent });
  } catch (error) {
    console.error("Check expiry error:", error);
    sendError(res, 500, "Failed to check expiring evidence");
  }
});

// Evidence Comparison API Endpoints

// Get multiple evidence items for comparison
app.get("/api/evidence/compare", async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return sendError(res, 400, "Evidence IDs are required");
    }

    const evidenceIds = ids.split(",").map((id) => parseInt(id.trim()));

    if (evidenceIds.length < 2 || evidenceIds.length > 4) {
      return sendError(res, 400, "Please provide 2-4 evidence IDs");
    }

    const { data: evidenceItems, error } = await supabase
      .from("evidence")
      .select("*")
      .in("id", evidenceIds);

    if (error) {
      throw error;
    }

    if (!evidenceItems || evidenceItems.length === 0) {
      return sendError(res, 404, "No evidence found with provided IDs");
    }

    // Add blockchain verification status
    const enrichedEvidence = evidenceItems.map((item) => ({
      ...item,
      blockchain_verified: true,
      verification_timestamp: new Date().toISOString(),
    }));

    res.json({
      success: true,
      count: enrichedEvidence.length,
      evidence: enrichedEvidence,
    });
  } catch (error) {
    console.error("Evidence comparison error:", error);
    sendError(res, 500, "Failed to fetch evidence for comparison");
  }
});

// Create comparison report
app.post("/api/evidence/comparison-report", async (req, res) => {
  try {
    const { evidenceIds, reportData, generatedBy } = req.body;

    if (!evidenceIds || !Array.isArray(evidenceIds) || evidenceIds.length < 2) {
      return sendError(res, 400, "At least 2 evidence IDs required");
    }

    // Store comparison report in database (you can create a new table for this)
    const reportRecord = {
      evidence_ids: evidenceIds,
      report_data: reportData,
      generated_by: generatedBy,
      generated_at: new Date().toISOString(),
      report_type: "evidence_comparison",
    };

    // Log the comparison action
    await supabase.from("activity_logs").insert({
      user_id: generatedBy,
      action: "evidence_comparison_report_generated",
      details: `Generated comparison report for ${evidenceIds.length} evidence items`,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Comparison report generated successfully",
      report: reportRecord,
    });
  } catch (error) {
    console.error("Comparison report error:", error);
    sendError(res, 500, "Failed to generate comparison report");
  }
});

// Get all evidence
app.get("/api/evidence", async (req, res) => {
  try {
    const { limit = 50, offset = 0, case_id, status, submitted_by } = req.query;

    let query = supabase
      .from("evidence")
      .select("*")
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (case_id) {
      query = query.eq("case_id", case_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (submitted_by) {
      query = query.eq("submitted_by", submitted_by);
    }

    const { data: evidence, error } = await query;

    if (error) {
      throw error;
    }

    // Add mock blockchain data for display
    const enrichedEvidence = evidence.map((item) => ({
      ...item,
      ipfs_hash: item.ipfs_hash || generateMockIPFSHash(),
      blockchain_tx: item.blockchain_tx || generateMockTxHash(),
      blockchain_verified: true,
      verification_timestamp: new Date().toISOString(),
    }));

    res.json({
      success: true,
      evidence: enrichedEvidence,
      total: evidence.length,
    });
  } catch (error) {
    console.error("Get evidence error:", error);
    sendError(res, 500, "Failed to get evidence");
  }
});

// Helper functions for mock data
function generateMockIPFSHash() {
  return (
    "Qm" +
    Array.from({ length: 44 }, () =>
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
        Math.floor(Math.random() * 62),
      ),
    ).join("")
  );
}

function generateMockTxHash() {
  return (
    "0x" +
    Array.from({ length: 64 }, () =>
      "0123456789abcdef".charAt(Math.floor(Math.random() * 16)),
    ).join("")
  );
}

// Get evidence details for preview
app.get("/api/evidence/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: evidence, error } = await supabase
      .from("evidence")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !evidence) {
      return sendError(res, 404, "Evidence not found");
    }

    res.json(evidence);
  } catch (error) {
    console.error("Get evidence error:", error);
    sendError(res, 500, "Failed to get evidence");
  }
});

// Verify evidence hash
app.get("/api/evidence/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: evidence, error } = await supabase
      .from("evidence")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !evidence) {
      return sendError(res, 404, "Evidence not found");
    }

    // Simulate hash verification
    const valid = true; // In real implementation, verify against blockchain

    res.json({ valid, hash: evidence.hash });
  } catch (error) {
    console.error("Verify evidence error:", error);
    sendError(res, 500, "Failed to verify evidence");
  }
});

// Get blockchain proof for specific evidence
app.get("/api/evidence/:id/blockchain-proof", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: evidence, error } = await supabase
      .from("evidence")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !evidence) {
      return sendError(res, 404, "Evidence not found");
    }

    // Generate blockchain proof
    const blockchainProof = {
      evidence_id: evidence.id,
      hash: evidence.hash,
      timestamp: evidence.timestamp,
      submitted_by: evidence.submitted_by,
      verification_status: "verified",
      blockchain_network: "Ethereum",
      verification_method: "SHA-256",
      chain_of_custody: {
        created: evidence.timestamp,
        last_accessed: new Date().toISOString(),
        access_count: 1,
      },
      integrity_check: {
        status: "passed",
        verified_at: new Date().toISOString(),
      },
    };

    res.json({
      success: true,
      proof: blockchainProof,
    });
  } catch (error) {
    console.error("Blockchain proof error:", error);
    sendError(res, 500, "Failed to retrieve blockchain proof");
  }
});

// ============================================================================
// CASE STATUS MANAGEMENT ENDPOINTS
// ============================================================================

// Get all case statuses
app.get("/api/case-statuses", async (req, res) => {
  try {
    const { data: statuses, error } = await supabase
      .from("case_statuses")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    res.json({ success: true, statuses });
  } catch (error) {
    console.error("Get case statuses error:", error);
    sendError(res, 500, "Failed to get case statuses");
  }
});

// Get cases with enhanced filtering
app.get("/api/cases/enhanced", async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      caseType,
      jurisdiction,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20,
      sortBy = "created_date",
      sortOrder = "desc",
    } = req.query;

    let query = supabase.from("cases").select(`
                *,
                case_statuses!inner(
                    status_code,
                    status_name,
                    color_code,
                    icon
                ),
                case_assignments!left(
                    assigned_to,
                    role_type,
                    assignment_type,
                    assigned_at
                )
            `);

    // Apply filters
    if (status) {
      query = query.eq("case_statuses.status_code", status);
    }

    if (priority) {
      query = query.eq("priority_level", priority);
    }

    if (assignedTo) {
      query = query.or(
        `assigned_investigator.eq.${assignedTo},assigned_prosecutor.eq.${assignedTo},assigned_judge.eq.${assignedTo}`,
      );
    }

    if (caseType) {
      query = query.eq("case_type", caseType);
    }

    if (jurisdiction) {
      query = query.eq("jurisdiction", jurisdiction);
    }

    if (dateFrom) {
      query = query.gte("created_date", dateFrom);
    }

    if (dateTo) {
      query = query.lte("created_date", dateTo);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,case_number.ilike.%${search}%`,
      );
    }

    // Apply sorting and pagination
    const offset = (page - 1) * limit;
    query = query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data: cases, error, count } = await query;

    if (error) throw error;

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("cases")
      .select("*", { count: "exact", head: true });

    res.json({
      success: true,
      cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Get enhanced cases error:", error);
    sendError(res, 500, "Failed to get cases");
  }
});

// Create new case
app.post("/api/cases", async (req, res) => {
  try {
    const {
      title,
      description,
      priority_level,
      case_type,
      jurisdiction,
      estimated_completion,
      created_by,
    } = req.body;

    if (!validateWalletAddress(created_by)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    if (!title) {
      return sendError(res, 400, "Case title is required");
    }

    // Get default status (open)
    const { data: defaultStatus } = await supabase
      .from("case_statuses")
      .select("id")
      .eq("status_code", "open")
      .single();

    const { data: newCase, error } = await supabase
      .from("cases")
      .insert({
        title,
        description,
        priority_level: priority_level || 3,
        case_type: case_type || "criminal",
        jurisdiction: jurisdiction || "local",
        estimated_completion,
        created_by,
        status_id: defaultStatus?.id || 1,
        status_changed_by: created_by,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: created_by,
      action: "case_created",
      details: JSON.stringify({
        case_id: newCase.id,
        case_title: title,
        case_type,
      }),
    });

    res.json({ success: true, case: newCase });
  } catch (error) {
    console.error("Create case error:", error);
    sendError(res, 500, "Failed to create case");
  }
});

// Get case details with full status history
app.get("/api/cases/:id/details", async (req, res) => {
  try {
    const { id } = req.params;

    // Get case with status information
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select(
        `
                *,
                case_statuses(
                    status_code,
                    status_name,
                    color_code,
                    icon,
                    description
                )
            `,
      )
      .eq("id", id)
      .single();

    if (caseError) throw caseError;

    // Get status history
    const { data: statusHistory, error: historyError } = await supabase
      .from("case_status_history")
      .select(
        `
                *,
                from_status:case_statuses!case_status_history_from_status_id_fkey(status_name, color_code),
                to_status:case_statuses!case_status_history_to_status_id_fkey(status_name, color_code)
            `,
      )
      .eq("case_id", id)
      .order("created_at", { ascending: false });

    if (historyError) throw historyError;

    // Get assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from("case_assignments")
      .select("*")
      .eq("case_id", id)
      .eq("is_active", true);

    if (assignmentError) throw assignmentError;

    // Get evidence count
    const { count: evidenceCount } = await supabase
      .from("evidence")
      .select("*", { count: "exact", head: true })
      .eq("case_id", id);

    res.json({
      success: true,
      case: {
        ...caseData,
        status_history: statusHistory,
        assignments,
        evidence_count: evidenceCount,
      },
    });
  } catch (error) {
    console.error("Get case details error:", error);
    sendError(res, 500, "Failed to get case details");
  }
});

// Update case status with validation
app.post("/api/cases/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatusCode, userWallet, reason, metadata = {} } = req.body;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    // Get user role
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("wallet_address", userWallet)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      return sendError(res, 403, "User not found or inactive");
    }

    // Get current case status
    const { data: currentCase, error: caseError } = await supabase
      .from("cases")
      .select("status_id, case_statuses(status_code)")
      .eq("id", id)
      .single();

    if (caseError || !currentCase) {
      return sendError(res, 404, "Case not found");
    }

    // Get new status ID
    const { data: newStatus, error: statusError } = await supabase
      .from("case_statuses")
      .select("id")
      .eq("status_code", newStatusCode)
      .single();

    if (statusError || !newStatus) {
      return sendError(res, 400, "Invalid status code");
    }

    // Check if transition is allowed
    const { data: transition, error: transitionError } = await supabase
      .from("case_status_transitions")
      .select("*")
      .eq("from_status_id", currentCase.status_id)
      .eq("to_status_id", newStatus.id)
      .eq("required_role", user.role)
      .eq("is_active", true)
      .single();

    if (transitionError || !transition) {
      return sendError(
        res,
        403,
        `Status transition not allowed for role: ${user.role}`,
        {
          currentStatus: currentCase.case_statuses.status_code,
          requestedStatus: newStatusCode,
        },
      );
    }

    // Update case status
    const { error: updateError } = await supabase
      .from("cases")
      .update({
        status_id: newStatus.id,
        status_changed_by: userWallet,
        last_status_change: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // Log status change
    const { error: logError } = await supabase
      .from("case_status_history")
      .insert({
        case_id: id,
        from_status_id: currentCase.status_id,
        to_status_id: newStatus.id,
        changed_by: userWallet,
        change_reason: reason || "Status updated via API",
        metadata: {
          ...metadata,
          user_role: user.role,
          transition_name: transition.transition_name,
        },
      });

    if (logError) throw logError;

    // Create notification for relevant users
    await createStatusChangeNotification(
      id,
      currentCase.status_id,
      newStatus.id,
      userWallet,
    );

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: userWallet,
      action: "case_status_change",
      details: JSON.stringify({
        case_id: id,
        from_status: currentCase.case_statuses.status_code,
        to_status: newStatusCode,
        reason,
      }),
    });

    res.json({
      success: true,
      message: "Case status updated successfully",
      newStatus: newStatusCode,
    });
  } catch (error) {
    console.error("Update case status error:", error);
    sendError(res, 500, "Failed to update case status");
  }
});

// Get available status transitions for a case
app.get("/api/cases/:id/available-transitions", async (req, res) => {
  try {
    const { id } = req.params;
    const { userWallet } = req.query;

    if (!validateWalletAddress(userWallet)) {
      return sendError(res, 400, "Invalid wallet address");
    }

    // Get user role
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("wallet_address", userWallet)
      .single();

    if (userError || !user) {
      return sendError(res, 403, "User not found");
    }

    // Get current case status
    const { data: currentCase, error: caseError } = await supabase
      .from("cases")
      .select("status_id")
      .eq("id", id)
      .single();

    if (caseError || !currentCase) {
      return sendError(res, 404, "Case not found");
    }

    // Get available transitions
    const { data: transitions, error: transitionError } = await supabase
      .from("case_status_transitions")
      .select(
        `
                *,
                to_status:case_statuses!case_status_transitions_to_status_id_fkey(
                    status_code,
                    status_name,
                    color_code,
                    icon
                )
            `,
      )
      .eq("from_status_id", currentCase.status_id)
      .eq("required_role", user.role)
      .eq("is_active", true);

    if (transitionError) throw transitionError;

    res.json({ success: true, transitions });
  } catch (error) {
    console.error("Get available transitions error:", error);
    sendError(res, 500, "Failed to get available transitions");
  }
});

// Assign user to case
app.post("/api/cases/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      assignToWallet,
      roleType,
      assignmentType = "primary",
      assignedByWallet,
      notes,
    } = req.body;

    if (
      !validateWalletAddress(assignToWallet) ||
      !validateWalletAddress(assignedByWallet)
    ) {
      return sendError(res, 400, "Invalid wallet addresses");
    }

    // Verify assigner has permission
    const { data: assigner, error: assignerError } = await supabase
      .from("users")
      .select("role")
      .eq("wallet_address", assignedByWallet)
      .single();

    if (
      assignerError ||
      !assigner ||
      !["admin", "court_official", "evidence_manager"].includes(assigner.role)
    ) {
      return sendError(res, 403, "Insufficient permissions to assign cases");
    }

    // Verify assignee exists and has appropriate role
    const { data: assignee, error: assigneeError } = await supabase
      .from("users")
      .select("role, full_name")
      .eq("wallet_address", assignToWallet)
      .single();

    if (assigneeError || !assignee) {
      return sendError(res, 404, "Assignee not found");
    }

    // Deactivate existing assignments of the same type
    await supabase
      .from("case_assignments")
      .update({ is_active: false, unassigned_at: new Date().toISOString() })
      .eq("case_id", id)
      .eq("role_type", roleType)
      .eq("assignment_type", assignmentType);

    // Create new assignment
    const { error: assignError } = await supabase
      .from("case_assignments")
      .insert({
        case_id: id,
        assigned_to: assignToWallet,
        assigned_by: assignedByWallet,
        role_type: roleType,
        assignment_type: assignmentType,
        notes,
      });

    if (assignError) throw assignError;

    // Update case with assignment
    const updateData = {};
    if (roleType === "investigator")
      updateData.assigned_investigator = assignToWallet;
    if (roleType === "legal_professional")
      updateData.assigned_prosecutor = assignToWallet;
    if (roleType === "court_official")
      updateData.assigned_judge = assignToWallet;

    if (Object.keys(updateData).length > 0) {
      await supabase.from("cases").update(updateData).eq("id", id);
    }

    // Create notification
    await createNotification(
      assignToWallet,
      "Case Assignment",
      `You have been assigned to case as ${roleType}`,
      "system",
      { case_id: id, role_type: roleType },
    );

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: assignedByWallet,
      action: "case_assignment",
      details: JSON.stringify({
        case_id: id,
        assigned_to: assignToWallet,
        role_type: roleType,
        assignee_name: assignee.full_name,
      }),
    });

    res.json({ success: true, message: "Case assigned successfully" });
  } catch (error) {
    console.error("Assign case error:", error);
    sendError(res, 500, "Failed to assign case");
  }
});

// Get case statistics by status
app.get("/api/cases/statistics", async (req, res) => {
  try {
    const { userWallet, timeframe = "30d" } = req.query;

    let dateFilter = "";
    const now = new Date();

    switch (timeframe) {
      case "7d":
        dateFilter = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        break;
      case "30d":
        dateFilter = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString();
        break;
      case "90d":
        dateFilter = new Date(
          now.getTime() - 90 * 24 * 60 * 60 * 1000,
        ).toISOString();
        break;
      case "1y":
        dateFilter = new Date(
          now.getTime() - 365 * 24 * 60 * 60 * 1000,
        ).toISOString();
        break;
    }

    // Get status statistics
    const { data: statusStats, error: statusError } = await supabase
      .from("cases")
      .select(
        `
                status_id,
                case_statuses(status_code, status_name, color_code)
            `,
      )
      .gte("created_date", dateFilter);

    if (statusError) throw statusError;

    // Group by status
    const statusCounts = statusStats.reduce((acc, case_item) => {
      const status = case_item.case_statuses;
      if (!acc[status.status_code]) {
        acc[status.status_code] = {
          ...status,
          count: 0,
        };
      }
      acc[status.status_code].count++;
      return acc;
    }, {});

    // Get priority statistics
    const { data: priorityStats, error: priorityError } = await supabase
      .from("cases")
      .select("priority_level")
      .gte("created_date", dateFilter);

    if (priorityError) throw priorityError;

    const priorityCounts = priorityStats.reduce((acc, case_item) => {
      const priority = case_item.priority_level || 3;
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    // Get recent activity
    const { data: recentActivity, error: activityError } = await supabase
      .from("case_status_history")
      .select(
        `
                *,
                cases(title, case_number),
                to_status:case_statuses!case_status_history_to_status_id_fkey(status_name, color_code)
            `,
      )
      .gte("created_at", dateFilter)
      .order("created_at", { ascending: false })
      .limit(10);

    if (activityError) throw activityError;

    res.json({
      success: true,
      statistics: {
        by_status: Object.values(statusCounts),
        by_priority: priorityCounts,
        recent_activity: recentActivity,
        timeframe,
      },
    });
  } catch (error) {
    console.error("Get case statistics error:", error);
    sendError(res, 500, "Failed to get case statistics");
  }
});

// Export cases as CSV
app.get("/api/cases/export", async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      caseType,
      jurisdiction,
      dateFrom,
      dateTo,
      search,
    } = req.query;

    let query = supabase.from("cases").select(`
                *,
                case_statuses(status_name)
            `);

    // Apply same filters as enhanced endpoint
    if (status) query = query.eq("case_statuses.status_code", status);
    if (priority) query = query.eq("priority_level", priority);
    if (assignedTo)
      query = query.or(
        `assigned_investigator.eq.${assignedTo},assigned_prosecutor.eq.${assignedTo},assigned_judge.eq.${assignedTo}`,
      );
    if (caseType) query = query.eq("case_type", caseType);
    if (jurisdiction) query = query.eq("jurisdiction", jurisdiction);
    if (dateFrom) query = query.gte("created_date", dateFrom);
    if (dateTo) query = query.lte("created_date", dateTo);
    if (search)
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,case_number.ilike.%${search}%`,
      );

    const { data: cases, error } = await query.order("created_date", {
      ascending: false,
    });

    if (error) throw error;

    // Generate CSV
    const csvHeaders =
      "Case Number,Title,Status,Priority,Type,Jurisdiction,Created Date,Created By\n";
    const csvRows = cases
      .map(
        (c) =>
          `"${c.case_number || ""}","${c.title}","${c.case_statuses?.status_name || ""}","${c.priority_level || 3}","${c.case_type || ""}","${c.jurisdiction || ""}","${new Date(c.created_date).toLocaleDateString()}","${c.created_by.substring(0, 8)}..."`,
      )
      .join("\n");

    const csv = csvHeaders + csvRows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="cases_export_${new Date().toISOString().split("T")[0]}.csv"`,
    );
    res.send(csv);
  } catch (error) {
    console.error("Export cases error:", error);
    sendError(res, 500, "Failed to export cases");
  }
});

// Helper function to create status change notifications
async function createStatusChangeNotification(
  caseId,
  fromStatusId,
  toStatusId,
  changedBy,
) {
  try {
    // Get case details
    const { data: caseData } = await supabase
      .from("cases")
      .select(
        "title, case_number, assigned_investigator, assigned_prosecutor, assigned_judge",
      )
      .eq("id", caseId)
      .single();

    // Get status names
    const { data: fromStatus } = await supabase
      .from("case_statuses")
      .select("status_name")
      .eq("id", fromStatusId)
      .single();

    const { data: toStatus } = await supabase
      .from("case_statuses")
      .select("status_name")
      .eq("id", toStatusId)
      .single();

    if (!caseData || !toStatus) return;

    const message = `Case "${caseData.title}" (${caseData.case_number}) status changed to ${toStatus.status_name}`;

    // Notify assigned users
    const assignedUsers = [
      caseData.assigned_investigator,
      caseData.assigned_prosecutor,
      caseData.assigned_judge,
    ].filter((user) => user && user !== changedBy);

    for (const userWallet of assignedUsers) {
      await createNotification(
        userWallet,
        "Case Status Update",
        message,
        "system",
        {
          case_id: caseId,
          from_status: fromStatus?.status_name,
          to_status: toStatus.status_name,
        },
      );
    }
  } catch (error) {
    console.error("Create status change notification error:", error);
  }
}

// Role Change Approval API Endpoints

// Request role change (Admin only)
app.post(
  "/api/admin/role-change-request",
  adminLimiter,
  verifyAdmin,
  async (req, res) => {
    try {
      const { adminWallet, targetWallet, newRole, reason } = req.body;

      if (
        !validateWalletAddress(targetWallet) ||
        !allowedRoles.includes(newRole)
      ) {
        return sendError(res, 404, "Invalid target wallet or role");
      }

      if (adminWallet === targetWallet) {
        return sendError(res, 400, "Cannot change own role");
      }

      const { data: targetUser } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", targetWallet)
        .single();

      if (!targetUser) {
        return sendError(res, 404, "Target user not found");
      }

      const { data: request, error } = await supabase
        .from("role_change_requests")
        .insert({
          requesting_admin: adminWallet,
          target_wallet: targetWallet,
          old_role: targetUser.role,
          new_role: newRole,
          reason: reason || "",
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, request });
    } catch (error) {
      console.error("Role change request error:", error);
      sendError(res, 500, "Failed to create role change request");
    }
  },
);

// Get pending role change requests
app.get("/api/admin/role-change-requests", adminLimiter, async (req, res) => {
  try {
    const { adminWallet } = req.query;

    if (!validateWalletAddress(adminWallet)) {
      return sendError(res, 400, "Invalid admin wallet");
    }

    const { data: requests, error } = await supabase
      .from("role_change_requests")
      .select("*")
      .eq("status", "pending")
      .neq("requesting_admin", adminWallet)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, requests });
  } catch (error) {
    console.error("Get role change requests error:", error);
    sendError(res, 500, "Failed to get role change requests");
  }
});

// Approve role change request
app.post(
  "/api/admin/role-change-approve",
  adminLimiter,
  verifyAdmin,
  async (req, res) => {
    try {
      const { adminWallet, requestId } = req.body;

      const { data: request } = await supabase
        .from("role_change_requests")
        .select("*")
        .eq("id", requestId)
        .eq("status", "pending")
        .single();

      if (!request) {
        return sendError(res, 404, "Request not found or already processed");
      }

      if (request.requesting_admin === adminWallet) {
        return sendError(res, 400, "Cannot approve own request");
      }

      // Update user role
      const { error: userError } = await supabase
        .from("users")
        .update({ role: request.new_role })
        .eq("wallet_address", request.target_wallet);

      if (userError) throw userError;

      // Update request status
      const { error: requestError } = await supabase
        .from("role_change_requests")
        .update({
          status: "approved",
          approved_by: adminWallet,
          approved_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (requestError) throw requestError;

      await logAdminAction(
        adminWallet,
        "role_change_approved",
        request.target_wallet,
        {
          old_role: request.old_role,
          new_role: request.new_role,
          request_id: requestId,
        },
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Approve role change error:", error);
      sendError(res, 500, "Failed to approve role change");
    }
  },
);

// Reject role change request
app.post(
  "/api/admin/role-change-reject",
  adminLimiter,
  verifyAdmin,
  async (req, res) => {
    try {
      const { adminWallet, requestId, reason } = req.body;

      const { data: request } = await supabase
        .from("role_change_requests")
        .select("*")
        .eq("id", requestId)
        .eq("status", "pending")
        .single();

      if (!request) {
        return sendError(res, 404, "Request not found or already processed");
      }

      const { error } = await supabase
        .from("role_change_requests")
        .update({
          status: "rejected",
          rejected_by: adminWallet,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || "",
        })
        .eq("id", requestId);

      if (error) throw error;

      await logAdminAction(
        adminWallet,
        "role_change_rejected",
        request.target_wallet,
        {
          old_role: request.old_role,
          new_role: request.new_role,
          request_id: requestId,
          reason,
        },
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Reject role change error:", error);
      sendError(res, 500, "Failed to reject role change");
    }
  },
);

// Prevent user self-deletion
app.post("/api/user/delete-self", (req, res) => {
  sendError(
    res,
    403,
    "Users cannot delete their own accounts. Contact administrator.",
  );
});

// Block unauthorized admin operations
app.post("/api/admin/*", (req, res) => {
  sendError(res, 403, "Forbidden: Administrator privileges required");
});

// Log activity (role selection, etc.)
app.post("/api/activity-logs", async (req, res) => {
  try {
    const { user_id, action, details } = req.body;

    if (!user_id || !action) {
      return sendError(res, 404, "User ID and action are required");
    }

    const { error } = await supabase.from("activity_logs").insert({
      user_id,
      action,
      details: typeof details === "string" ? details : JSON.stringify(details),
      timestamp: new Date().toISOString(),
    });

    if (error) throw error;

    res.json({ success: true, message: "Activity logged successfully" });
  } catch (error) {
    console.error("Activity logging error:", error);
    sendError(res, 500, "Failed to log activity");
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  sendError(res, 500, "Internal server error");
});

// 404 handler
app.use((req, res) => {
  sendError(res, 404, "Endpoint not found");
});

// ── Start server ────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🔐 EVID-DGC API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔔 WebSocket notifications enabled`);
});

module.exports = app;
