import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  duration: number; // minutes
  category: string;
  location?: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },
    date: { type: String, required: true }, // YYYY-MM-DD format
    time: { type: String, required: true }, // HH:MM format
    duration: { type: Number, required: true, default: 30 }, // minutes
    category: { type: String, required: true, default: "업무 미팅" },
    location: { type: String, required: false },
    isCompleted: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
EventSchema.index({ date: 1, time: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ isCompleted: 1 });
EventSchema.index({ title: "text", description: "text" }); // For text search

const Event: Model<IEvent> = mongoose.model<IEvent>('Event', EventSchema);

export default Event;