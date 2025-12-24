import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifySocketIO from "fastify-socket.io";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Environment configuration
const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim()),
  apiSecretKey: process.env.API_SECRET_KEY || null,
};

// Extend Fastify type to include io
declare module "fastify" {
  interface FastifyInstance {
    io: import("socket.io").Server;
  }
}

// สร้าง Fastify instance
const fastify = Fastify({
  logger: config.nodeEnv === "development",
});

// Setup CORS
fastify.register(cors, {
  origin: config.corsOrigins,
  credentials: true,
});

// Setup Socket.io
fastify.register(fastifySocketIO, {
  cors: {
    origin: config.corsOrigins,
    credentials: true,
  },
});

// Interface สำหรับ Notification payload
interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type?: string;
}

// Socket.io logic
fastify.ready().then(() => {
  fastify.io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // Join user room
    socket.on("join_user", (userId: string) => {
      socket.join(`user_${userId}`);
      console.log(`👤 Socket ${socket.id} joined room user_${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
});

// Middleware: API Key validation (optional - for production security)
fastify.addHook("onRequest", async (request, reply) => {
  // Skip validation for health check and if no API key is configured
  if (request.url === "/health" || !config.apiSecretKey) {
    return;
  }

  // Only validate POST /notify in production
  if (
    request.method === "POST" &&
    request.url === "/notify" &&
    config.nodeEnv === "production"
  ) {
    const apiKey = request.headers["x-api-key"];
    if (apiKey !== config.apiSecretKey) {
      return reply.status(401).send({ success: false, error: "Unauthorized" });
    }
  }
});

// POST /notify - รับ notification จาก Laravel
fastify.post<{ Body: NotificationPayload }>(
  "/notify",
  async (request, reply) => {
    const { user_id, title, message, type } = request.body;

    if (!user_id || !title || !message) {
      return reply.status(400).send({
        success: false,
        error: "Missing required fields: user_id, title, message",
      });
    }

    // ส่ง notification ไปยัง user room
    fastify.io.to(`user_${user_id}`).emit("notification", {
      title,
      message,
      type: type || "info",
      timestamp: new Date().toISOString(),
    });

    console.log(`📬 Notification sent to user_${user_id}: ${title}`);

    return { success: true, message: "Notification sent" };
  }
);

// Health check endpoint
fastify.get("/health", async () => {
  return {
    status: "ok",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(
      `🚀 Notification Server running on port ${config.port} (${config.nodeEnv})`
    );
    console.log(`📡 CORS allowed origins: ${config.corsOrigins.join(", ")}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
