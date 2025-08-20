import mongoose, { Schema, Document, Model } from 'mongoose';

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
)

const PresenceSchema = new Schema(
    {
        status: { type: Number, required: true, min: 0, max: 63, default: 0 }, // web desktop mobile 00 00 00 (00: offline, 01: idle, 10: online, 11: dnd) 
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
        timestamps: {
            start: Date;
            end?: Date;
        };
        emoji?: {
            animated?: boolean;
            name: string;
            id?: string;
        };
        createdTimestamp?: Date;
        type?: number;
        details?: string;
        state?: string;
    }[];
    timestamp: Date;
    userId: string;
}

const Presence: Model<IPresence> = mongoose.model<IPresence>('Presence', PresenceSchema);

export default Presence;