import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer;

jest.setTimeout(20000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = "test-secret-123";
  process.env.ADMIN_EMAIL = "admin@feedpulse.dev";
  process.env.ADMIN_PASSWORD = "admin12345";
  process.env.FRONTEND_URL = "http://localhost:3000";
  process.env.NODE_ENV = "test";
});

afterAll(async () => {
  const { disconnectDatabase } = await import("../services/database.service");
  await disconnectDatabase();
  await mongoServer.stop();
});
