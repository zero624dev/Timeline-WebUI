import Event, { IEvent } from '../models/Event';
import { InsertEvent, UpdateEvent, EventResponse } from '@shared/schema';

export class EventService {
  // Convert MongoDB document to EventResponse for frontend compatibility
  private static toEventResponse(event: IEvent): EventResponse {
    return {
      id: (event._id as any).toString(),
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      duration: event.duration,
      category: event.category,
      location: event.location,
      isCompleted: event.isCompleted ? 1 : 0, // Convert boolean to number
      createdAt: event.createdAt,
    };
  }

  // Get all events, sorted by date and time
  static async getEvents(): Promise<EventResponse[]> {
    const events = await Event.find().sort({ date: 1, time: 1 });
    return events.map(this.toEventResponse);
  }

  // Get events by specific date
  static async getEventsByDate(date: string): Promise<EventResponse[]> {
    const events = await Event.find({ date }).sort({ time: 1 });
    return events.map(this.toEventResponse);
  }

  // Get single event by ID
  static async getEvent(id: string): Promise<EventResponse | null> {
    const event = await Event.findById(id);
    return event ? this.toEventResponse(event) : null;
  }

  // Create new event
  static async createEvent(eventData: InsertEvent): Promise<EventResponse> {
    const event = new Event(eventData);
    const savedEvent = await event.save();
    return this.toEventResponse(savedEvent);
  }

  // Update existing event
  static async updateEvent(id: string, updateData: UpdateEvent): Promise<EventResponse | null> {
    const event = await Event.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    return event ? this.toEventResponse(event) : null;
  }

  // Delete event
  static async deleteEvent(id: string): Promise<boolean> {
    const result = await Event.findByIdAndDelete(id);
    return !!result;
  }

  // Search events by text query
  static async searchEvents(query: string): Promise<EventResponse[]> {
    const events = await Event.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } }
      ]
    }).sort({ date: 1, time: 1 });
    
    return events.map(this.toEventResponse);
  }

  // Get events by category
  static async getEventsByCategory(category: string): Promise<EventResponse[]> {
    const events = await Event.find({ category }).sort({ date: 1, time: 1 });
    return events.map(this.toEventResponse);
  }

  // Seed initial data
  static async seedData(): Promise<void> {
    const eventCount = await Event.countDocuments();
    if (eventCount > 0) {
      console.log('Events already exist, skipping seed data');
      return;
    }

    const sampleEvents = [
      {
        title: "팀 스탠드업 미팅",
        description: "일일 업무 공유 및 진행상황 점검",
        date: "2025-08-20",
        time: "09:00",
        duration: 30,
        category: "업무 미팅",
        location: null,
        isCompleted: true,
      },
      {
        title: "개인 운동",
        description: "헬스장에서 웨이트 트레이닝",
        date: "2025-08-20",
        time: "10:30",
        duration: 60,
        category: "개인 일정",
        location: "피트니스 센터",
        isCompleted: true,
      },
      {
        title: "프로젝트 기획회의",
        description: "새로운 웹 애플리케이션 프로젝트 기획 논의",
        date: "2025-08-20",
        time: "14:00",
        duration: 120,
        category: "프로젝트",
        location: "온라인",
        isCompleted: false,
      },
      {
        title: "고객사 미팅",
        description: "분기별 진행상황 보고 및 피드백 수집",
        date: "2025-08-20",
        time: "16:30",
        duration: 60,
        category: "업무 미팅",
        location: "회의실 A",
        isCompleted: false,
      },
      {
        title: "친구들과 저녁식사",
        description: "오랜만에 만나는 대학 동기들과 식사",
        date: "2025-08-20",
        time: "19:00",
        duration: 120,
        category: "소셜",
        location: "이탈리안 레스토랑",
        isCompleted: false,
      },
    ];

    await Event.insertMany(sampleEvents);
    console.log('Sample events seeded successfully');
  }
}