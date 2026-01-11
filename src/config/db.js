import mongoose from "mongoose";
const options = {
  autoIndex: true,
};

const connectDB = async (req, res) => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, options);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};

export default connectDB;
