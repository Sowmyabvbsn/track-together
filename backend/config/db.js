import mongoose from 'mongoose';
import Group from '../models/Group.js';
import UserLocation from '../models/UserLocation.js';
import Notification from '../models/Notification.js';
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://Sowmyabvbsn:X9GNqxsnxL48Ksmx@cluster0.9hbmuj5.mongodb.net/");
    console.log('MongoDB connected');
    await Group.createIndexes();
    await UserLocation.createIndexes();
    await Notification.createIndexes();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
export default connectDB;