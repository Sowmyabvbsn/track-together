import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Group from '../models/Group.js';
import UserLocation from '../models/UserLocation.js';
import Notification from '../models/Notification.js';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://Sowmyabvbsn:X9GNqxsnxL48Ksmx@cluster0.9hbmuj5.mongodb.net/";

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);

    await Group.createIndexes();
    await UserLocation.createIndexes();
    await Notification.createIndexes();

    console.log('Database indexes created');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export default connectDB;