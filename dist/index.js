var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/database.ts
var database_exports = {};
__export(database_exports, {
  connectDB: () => connectDB,
  disconnectDB: () => disconnectDB
});
import mongoose2 from "mongoose";
var MONGODB_URI, connectDB, disconnectDB;
var init_database = __esm({
  "server/database.ts"() {
    "use strict";
    MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/eventtime";
    connectDB = async () => {
      try {
        const conn = await mongoose2.connect(MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        if (process.env.NODE_ENV === "development") {
          mongoose2.set("debug", true);
        }
        return conn;
      } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
      }
    };
    disconnectDB = async () => {
      try {
        await mongoose2.disconnect();
        console.log("MongoDB disconnected");
      } catch (error) {
        console.error("Error disconnecting from MongoDB:", error);
      }
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/mongoStorage.ts
import { nanoid } from "nanoid";

// server/mongodb.ts
import mongoose, { Schema } from "mongoose";
var TARGET_USER_ID = "532239959281893397";
var ActivityTimestampsSchema = new Schema(
  {
    start: { type: Date, required: false },
    end: { type: Date, required: false }
  },
  {
    _id: false,
    timestamps: false
  }
);
var ActivityEmojiSchema = new Schema(
  {
    animated: { type: Boolean, required: false },
    name: { type: String, required: true },
    id: { type: String, required: false }
  },
  {
    _id: false,
    timestamps: false
  }
);
var ActivitySchema = new Schema(
  {
    applicationId: { type: String, required: false },
    name: { type: String, required: true },
    timestamps: { type: ActivityTimestampsSchema, required: false },
    createdTimestamp: { type: Date, required: false },
    type: { type: Number, required: true, min: 0, max: 5 },
    emoji: { type: ActivityEmojiSchema, required: false },
    state: { type: String, required: false },
    details: { type: String, required: false }
  },
  {
    _id: false,
    timestamps: false
  }
);
var PresenceSchema = new Schema(
  {
    status: { type: Number, required: true, min: 0, max: 63, default: 0 },
    activities: { type: [ActivitySchema], required: false },
    timestamp: { type: Date, required: true, index: true },
    userId: { type: String, required: true }
  },
  {
    _id: false,
    timestamps: false
  }
);
var Presence = mongoose.model("Presence", PresenceSchema);
function decodeStatus(status) {
  const mobile = status & 3;
  const desktop = status >> 2 & 3;
  const web = status >> 4 & 3;
  const statusMap = ["\uC624\uD504\uB77C\uC778", "\uC790\uB9AC\uBE44\uC6C0", "\uC628\uB77C\uC778", "\uBC29\uD574\uAE08\uC9C0"];
  return {
    web: statusMap[web],
    desktop: statusMap[desktop],
    mobile: statusMap[mobile]
  };
}

// server/mongoStorage.ts
function generateId() {
  return nanoid();
}
var MongoStorage = class {
  // Helper function to convert IPresence to PresenceResponse
  convertToPresenceResponse(presence) {
    return {
      id: presence._id?.toString() || nanoid(),
      status: presence.status,
      activities: presence.activities?.map((activity) => ({
        name: activity.name,
        type: activity.type,
        applicationId: activity.applicationId,
        timestamps: activity.timestamps,
        emoji: activity.emoji,
        createdTimestamp: activity.createdTimestamp,
        details: activity.details,
        state: activity.state
      })) || [],
      timestamp: presence.timestamp,
      userId: presence.userId
    };
  }
  // Presence methods
  async getPresences() {
    try {
      const presences = await Presence.find({ userId: TARGET_USER_ID }).sort({ timestamp: -1 }).limit(100).lean();
      return presences.map((p) => this.convertToPresenceResponse(p));
    } catch (error) {
      console.error("Error fetching presences:", error);
      return [];
    }
  }
  async getPresencesByDate(date) {
    try {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      const presences = await Presence.find({
        userId: TARGET_USER_ID,
        timestamp: {
          $gte: startDate,
          $lt: endDate
        }
      }).sort({ timestamp: 1 }).lean();
      return presences.map((p) => this.convertToPresenceResponse(p));
    } catch (error) {
      console.error("Error fetching presences by date:", error);
      return [];
    }
  }
  async getPresencesByUserId(userId) {
    try {
      const presences = await Presence.find({ userId }).sort({ timestamp: -1 }).limit(100).lean();
      return presences.map((p) => this.convertToPresenceResponse(p));
    } catch (error) {
      console.error("Error fetching presences by user:", error);
      return [];
    }
  }
  // Timeline methods  
  async getTimeline(date) {
    try {
      let rawPresences;
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        rawPresences = await Presence.find({
          userId: TARGET_USER_ID,
          timestamp: {
            $gte: startDate,
            $lt: endDate
          }
        }).sort({ timestamp: 1 }).lean();
      } else {
        rawPresences = await Presence.find({ userId: TARGET_USER_ID }).sort({ timestamp: -1 }).limit(100).lean();
      }
      const timeline = [];
      let previousPresence = null;
      for (const presence of rawPresences) {
        if (previousPresence) {
          const prevStatus = decodeStatus(previousPresence.status);
          const currStatus = decodeStatus(presence.status);
          const statusChanges = {};
          let hasChanges = false;
          for (const platform of ["web", "desktop", "mobile"]) {
            if (prevStatus[platform] !== currStatus[platform]) {
              statusChanges[platform] = {
                old: prevStatus[platform],
                new: currStatus[platform]
              };
              hasChanges = true;
            }
          }
          if (hasChanges) {
            timeline.push({
              id: nanoid(),
              type: "status_change",
              timestamp: presence.timestamp,
              statusChange: statusChanges
            });
          }
        }
        if (presence.activities && presence.activities.length > 0) {
          const prevActivities = previousPresence?.activities || [];
          for (const activity of presence.activities) {
            const wasPresent = prevActivities.some((prev) => {
              if (activity.applicationId && prev.applicationId) {
                return prev.applicationId === activity.applicationId;
              }
              return prev.name === activity.name && prev.state === activity.state;
            });
            if (!wasPresent) {
              timeline.push({
                id: nanoid(),
                type: "activity_change",
                timestamp: presence.timestamp,
                activityChange: {
                  type: "added",
                  activity: {
                    name: activity.name,
                    type: activity.type,
                    state: activity.state,
                    details: activity.details,
                    applicationId: activity.applicationId
                  }
                }
              });
            }
          }
          for (const prevActivity of prevActivities) {
            const isStillPresent = presence.activities.some((curr) => {
              if (prevActivity.applicationId && curr.applicationId) {
                return curr.applicationId === prevActivity.applicationId;
              }
              return curr.name === prevActivity.name && curr.state === prevActivity.state;
            });
            if (!isStillPresent) {
              timeline.push({
                id: nanoid(),
                type: "activity_change",
                timestamp: presence.timestamp,
                activityChange: {
                  type: "removed",
                  activity: {
                    name: prevActivity.name,
                    type: prevActivity.type,
                    state: prevActivity.state,
                    details: prevActivity.details,
                    applicationId: prevActivity.applicationId
                  }
                }
              });
            }
          }
        } else if (previousPresence?.activities && previousPresence.activities.length > 0) {
          for (const prevActivity of previousPresence.activities) {
            timeline.push({
              id: nanoid(),
              type: "activity_change",
              timestamp: presence.timestamp,
              activityChange: {
                type: "removed",
                activity: {
                  name: prevActivity.name,
                  type: prevActivity.type,
                  state: prevActivity.state,
                  details: prevActivity.details,
                  applicationId: prevActivity.applicationId
                }
              }
            });
          }
        }
        previousPresence = presence;
      }
      return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error("Error generating timeline:", error);
      return [];
    }
  }
  async getTimelineByUserId(userId, date) {
    try {
      let rawPresences;
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        rawPresences = await Presence.find({
          userId,
          timestamp: {
            $gte: startDate,
            $lt: endDate
          }
        }).sort({ timestamp: 1 }).lean();
      } else {
        rawPresences = await Presence.find({ userId }).sort({ timestamp: -1 }).limit(100).lean();
      }
      const timeline = [];
      let previousPresence = null;
      for (const presence of rawPresences) {
        if (previousPresence) {
          const prevStatus = decodeStatus(previousPresence.status);
          const currStatus = decodeStatus(presence.status);
          const statusChanges = {};
          let hasChanges = false;
          for (const platform of ["web", "desktop", "mobile"]) {
            if (prevStatus[platform] !== currStatus[platform]) {
              statusChanges[platform] = {
                old: prevStatus[platform],
                new: currStatus[platform]
              };
              hasChanges = true;
            }
          }
          if (hasChanges) {
            timeline.push({
              id: generateId(),
              type: "status_change",
              timestamp: presence.timestamp,
              statusChange: statusChanges
            });
          }
        }
        const currentActivities = presence.activities || [];
        const previousActivities = previousPresence?.activities || [];
        for (const activity of currentActivities) {
          const isNewActivity = !previousActivities.some(
            (prev) => prev.applicationId ? prev.applicationId === activity.applicationId : prev.name === activity.name && prev.state === activity.state
          );
          if (isNewActivity) {
            timeline.push({
              id: generateId(),
              type: "activity_change",
              timestamp: presence.timestamp,
              activityChange: {
                type: "added",
                activity: {
                  name: activity.name,
                  type: activity.type,
                  state: activity.state,
                  details: activity.details,
                  applicationId: activity.applicationId
                }
              }
            });
          }
        }
        for (const prevActivity of previousActivities) {
          const stillActive = currentActivities.some(
            (curr) => prevActivity.applicationId ? curr.applicationId === prevActivity.applicationId : curr.name === prevActivity.name && curr.state === prevActivity.state
          );
          if (!stillActive) {
            timeline.push({
              id: generateId(),
              type: "activity_change",
              timestamp: presence.timestamp,
              activityChange: {
                type: "removed",
                activity: {
                  name: prevActivity.name,
                  type: prevActivity.type,
                  state: prevActivity.state,
                  details: prevActivity.details,
                  applicationId: prevActivity.applicationId
                }
              }
            });
          }
        }
        previousPresence = presence;
      }
      return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error("Error generating timeline for user:", error);
      return [];
    }
  }
  async getPresencesByUserIdAndDate(userId, dateString) {
    try {
      const startDate = new Date(dateString);
      const endDate = new Date(dateString);
      endDate.setDate(endDate.getDate() + 1);
      const presences = await Presence.find({
        userId,
        timestamp: {
          $gte: startDate,
          $lt: endDate
        }
      }).sort({ timestamp: 1 }).lean();
      return presences.map((p) => this.convertToPresenceResponse(p));
    } catch (error) {
      console.error("Error fetching presences by user and date:", error);
      return [];
    }
  }
};

// server/routes.ts
import passport from "passport";
var mongoStorage = new MongoStorage();
async function registerRoutes(app2) {
  app2.get("/api/timeline", async (req, res) => {
    try {
      const date = req.query.date;
      const timeline = await mongoStorage.getTimeline(date);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });
  app2.get("/api/timeline/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const date = req.query.date;
      const timeline = await mongoStorage.getTimelineByUserId(userId, date);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching user timeline:", error);
      res.status(500).json({ message: "Failed to fetch user timeline" });
    }
  });
  app2.get("/api/presences", async (req, res) => {
    try {
      const presences = await mongoStorage.getPresences();
      res.json(presences);
    } catch (error) {
      console.error("Error fetching presences:", error);
      res.status(500).json({ message: "Failed to fetch presences" });
    }
  });
  app2.get("/api/presences/date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const presences = await mongoStorage.getPresencesByDate(date);
      res.json(presences);
    } catch (error) {
      console.error("Error fetching presences by date:", error);
      res.status(500).json({ message: "Failed to fetch presences for date" });
    }
  });
  app2.get("/api/presences/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const presences = await mongoStorage.getPresencesByUserId(userId);
      res.json(presences);
    } catch (error) {
      console.error("Error fetching presences by user:", error);
      res.status(500).json({ message: "Failed to fetch user presences" });
    }
  });
  app2.get("/api/presences/user/:userId/date/:date", async (req, res) => {
    try {
      const { userId, date } = req.params;
      const presences = await mongoStorage.getPresencesByUserIdAndDate(userId, date);
      res.json(presences);
    } catch (error) {
      console.error("Error fetching presences by user and date:", error);
      res.status(500).json({ message: "Failed to fetch user presences for date" });
    }
  });
  app2.get("/api/timeline", async (req, res) => {
    try {
      const startTime = Date.now();
      const { date } = req.query;
      const timeline = await mongoStorage.getTimeline(date);
      const docCount = `[${timeline.length} entries]`;
      console.log(`${(/* @__PURE__ */ new Date()).toLocaleTimeString()} [express] GET /api/timeline ${res.statusCode} in ${Date.now() - startTime}ms :: ${docCount}`);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });
  app2.get("/api/timeline/:userId", async (req, res) => {
    try {
      const startTime = Date.now();
      const { userId } = req.params;
      const { date } = req.query;
      const timeline = await mongoStorage.getTimelineByUserId(userId, date);
      const docCount = `[${timeline.length} entries]`;
      console.log(`${(/* @__PURE__ */ new Date()).toLocaleTimeString()} [express] GET /api/timeline/${userId} ${res.statusCode} in ${Date.now() - startTime}ms :: ${docCount}`);
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching timeline for user:", error);
      res.status(500).json({ message: "Failed to fetch timeline for user" });
    }
  });
  app2.get("/auth/discord", passport.authenticate("discord"));
  app2.get(
    "/auth/discord/callback",
    passport.authenticate("discord", { failureRedirect: "/" }),
    (req, res) => {
      res.redirect("/");
    }
  );
  app2.get("/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.redirect("/");
    });
  });
  app2.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid as nanoid2 } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import session from "express-session";
import MongoStore from "connect-mongo";
import passport2 from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import dotenv from "dotenv";
dotenv.config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: "sessions"
  }),
  cookie: { secure: false }
  // Set to true if using HTTPS
}));
app.use(passport2.initialize());
app.use(passport2.session());
passport2.use(
  new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL || "/auth/discord/callback",
    scope: ["identify"]
  }, async (accessToken, refreshToken, profile, done) => {
    const user = {
      id: profile.id,
      username: profile.username,
      discriminator: profile.discriminator,
      avatar: profile.avatar,
      // omit tag when discriminator is '0' or '0000' or falsy
      displayName: profile.discriminator && profile.discriminator !== "0" && profile.discriminator !== "0000" ? `${profile.username}#${profile.discriminator}` : profile.username
    };
    return done(null, user);
  })
);
passport2.serializeUser((user, done) => {
  done(null, user);
});
passport2.deserializeUser((user, done) => {
  done(null, user);
});
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const { connectDB: connectDB2 } = await Promise.resolve().then(() => (init_database(), database_exports));
  await connectDB2();
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down gracefully");
    const { disconnectDB: disconnectDB2 } = await Promise.resolve().then(() => (init_database(), database_exports));
    await disconnectDB2();
    process.exit(0);
  });
  process.on("SIGINT", async () => {
    console.log("SIGINT received, shutting down gracefully");
    const { disconnectDB: disconnectDB2 } = await Promise.resolve().then(() => (init_database(), database_exports));
    await disconnectDB2();
    process.exit(0);
  });
})();
