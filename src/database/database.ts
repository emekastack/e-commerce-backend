import mongoose from "mongoose";
import { config } from "../config/app.config";

const { MONGO_URI } = config;
// Function to connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI as string);
    console.info("Database Connected Successfully");
  } catch (error) {
    console.error("Unable to connect to database: ", error);
    process.exit(1); // Exit the process with failure
  }
}

// Call the connect function
connectDB();

// Handle events
mongoose.connection.on("connected", () => {
  console.info("Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error: ", err);
});

mongoose.connection.on("disconnected", () => {
  console.info("Mongoose disconnected");
});

// If the Node process ends, close the Mongoose connection
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.info("Mongoose connection closed due to app termination");
  process.exit(0);
});