import mongoose, { Schema, Document, Model } from 'mongoose';

// MongoDB Connection
const MONGODB_URI = "mongodb+srv://zero:ENh2EiUCyXsCbjh5@cluster0.ufuds.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const TARGET_USER_ID = "532239959281893397";

export async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Schemas based on the attached file
const ActivityTimestampsSchema = new Schema(
  {
    start: { type: Date, required: false },
    end: { type: Date, required: false },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const ActivityEmojiSchema = new Schema(
  {
    animated: { type: Boolean, required: false },
    name: { type: String, required: true },
    id: { type: String, required: false },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const ActivitySchema = new Schema(
  {
    applicationId: { type: String, required: false },
    name: { type: String, required: true },
    timestamps: { type: ActivityTimestampsSchema, required: false },
    createdTimestamp: { type: Date, required: false },
    type: { type: Number, required: true, min: 0, max: 5 },
    emoji: { type: ActivityEmojiSchema, required: false },
    state: { type: String, required: false },
    details: { type: String, required: false },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const PresenceSchema = new Schema(
  {
    status: { type: Number, required: true, min: 0, max: 63, default: 0 },
    activities: { type: [ActivitySchema], required: false },
    timestamp: { type: Date, required: true, index: true },
    userId: { type: String, required: true },
  },
  {
    _id: false,
    timestamps: false,
  }
);

export interface IPresence extends Document {
  status: number;
  activities?: {
    applicationId?: string;
    name: string;
    timestamps?: {
      start?: Date;
      end?: Date;
    };
    emoji?: {
      animated?: boolean;
      name: string;
      id?: string;
    };
    createdTimestamp?: Date;
    type: number;
    details?: string;
    state?: string;
  }[];
  timestamp: Date;
  userId: string;
}

export const Presence: Model<IPresence> = mongoose.model<IPresence>('Presence', PresenceSchema);

// Helper functions
export function decodeStatus(status: number) {
  const mobile = status & 3;
  const desktop = (status >> 2) & 3;
  const web = (status >> 4) & 3;
  
  const statusMap = ['오프라인', '자리비움', '온라인', '방해금지'];
  
  return {
    web: statusMap[web],
    desktop: statusMap[desktop],
    mobile: statusMap[mobile]
  };
}

export function getStatusName(statusCode: number): string {
  const statusMap = ['오프라인', '자리비움', '온라인', '방해금지'];
  return statusMap[statusCode] || '알 수 없음';
}

export { TARGET_USER_ID };