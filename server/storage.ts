import { type EventResponse, type InsertEvent, type UpdateEvent, type PresenceResponse, type TimelineEntry, type Activity } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Event operations
  getEvents(): Promise<EventResponse[]>;
  getEventsByDate(date: string): Promise<EventResponse[]>;
  getEvent(id: string): Promise<EventResponse | undefined>;
  searchEvents(query: string): Promise<EventResponse[]>;
  getEventsByCategory(category: string): Promise<EventResponse[]>;
  
  // Presence operations
  getPresences(): Promise<PresenceResponse[]>;
  getPresencesByDate(date: string): Promise<PresenceResponse[]>;
  getPresencesByUserId(userId: string): Promise<PresenceResponse[]>;
  
  // Timeline operations
  getTimeline(date?: string): Promise<TimelineEntry[]>;
  getTimelineByUserId(userId: string, date?: string): Promise<TimelineEntry[]>;
}

// Status utility functions
const getStatusName = (value: number): string => {
  switch (value) {
    case 0: return '오프라인';
    case 1: return '자리비움';
    case 2: return '온라인';
    case 3: return '방해금지';
    default: return '알 수 없음';
  }
};

const parseStatus = (status: number) => {
  // 6-bit status: web(2bit) desktop(2bit) mobile(2bit)
  const mobile = status & 0b000011; // bits 0-1
  const desktop = (status & 0b001100) >> 2; // bits 2-3
  const web = (status & 0b110000) >> 4; // bits 4-5
  
  return {
    web: getStatusName(web),
    desktop: getStatusName(desktop),
    mobile: getStatusName(mobile)
  };
};

const compareStatuses = (oldStatus: number, newStatus: number) => {
  const oldParsed = parseStatus(oldStatus);
  const newParsed = parseStatus(newStatus);
  
  return {
    web: oldParsed.web !== newParsed.web ? { old: oldParsed.web, new: newParsed.web } : null,
    desktop: oldParsed.desktop !== newParsed.desktop ? { old: oldParsed.desktop, new: newParsed.desktop } : null,
    mobile: oldParsed.mobile !== newParsed.mobile ? { old: oldParsed.mobile, new: newParsed.mobile } : null,
  };
};

export class MemStorage implements IStorage {
  private events: Map<string, EventResponse>;
  private presences: Map<string, PresenceResponse>;
  private timelineEntries: Map<string, TimelineEntry>;

  constructor() {
    this.events = new Map();
    this.presences = new Map();
    this.timelineEntries = new Map();
    this.seedData();
  }

  private seedData() {
    // Add sample events for today's date (2025-08-20)
    const sampleEvents: EventResponse[] = [
      {
        id: randomUUID(),
        title: "팀 스탠드업 미팅",
        description: "일일 업무 공유 및 진행상황 점검",
        date: "2025-08-20",
        time: "09:00",
        duration: 30,
        category: "업무 미팅",
        location: undefined,
        isCompleted: 1,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "개인 운동",
        description: "헬스장에서 웨이트 트레이닝",
        date: "2025-08-20",
        time: "10:30",
        duration: 60,
        category: "개인 일정",
        location: "피트니스 센터",
        isCompleted: 1,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "프로젝트 기획회의",
        description: "새로운 웹 애플리케이션 프로젝트 기획 논의",
        date: "2025-08-20",
        time: "14:00",
        duration: 120,
        category: "프로젝트",
        location: "온라인",
        isCompleted: 0,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "고객사 미팅",
        description: "분기별 진행상황 보고 및 피드백 수집",
        date: "2025-08-20",
        time: "16:30",
        duration: 60,
        category: "업무 미팅",
        location: "회의실 A",
        isCompleted: 0,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "친구들과 저녁식사",
        description: "오랜만에 만나는 대학 동기들과 식사",
        date: "2025-08-20",
        time: "19:00",
        duration: 120,
        category: "소셜",
        location: "이탈리안 레스토랑",
        isCompleted: 0,
        createdAt: new Date(),
      },
    ];

    sampleEvents.forEach(event => {
      this.events.set(event.id, event);
    });

    // Add sample presence data and timeline entries
    this.seedPresenceData();
  }

  private seedPresenceData() {
    const userId = "user123";
    const baseDate = new Date("2025-08-20");
    
    // Sample presence changes throughout the day
    const presenceData: Array<{
      status: number;
      activities?: Activity[];
      time: string;
    }> = [
      // Morning: Start online on desktop
      {
        status: 0b001000, // desktop online (10), others offline
        time: "08:30",
        activities: [{
          name: "Visual Studio Code",
          type: 0,
          applicationId: "vscode",
          state: "프로젝트 작업 중",
          details: "EventTime 애플리케이션 개발"
        }]
      },
      // Mid-morning: Add mobile idle
      {
        status: 0b001001, // desktop online (10), mobile idle (01)
        time: "10:15",
        activities: [{
          name: "Visual Studio Code",
          type: 0,
          applicationId: "vscode",
          state: "프로젝트 작업 중",
          details: "EventTime 애플리케이션 개발"
        }]
      },
      // Lunch break: Set to idle
      {
        status: 0b010101, // all idle (01)
        time: "12:00",
        activities: []
      },
      // Afternoon: Back online with meeting
      {
        status: 0b101010, // all online (10)
        time: "13:30",
        activities: [{
          name: "Zoom",
          type: 0,
          applicationId: "zoom",
          state: "회의 중",
          details: "프로젝트 기획회의"
        }]
      },
      // Focus time: DND mode
      {
        status: 0b111111, // all DND (11)
        time: "15:00",
        activities: [{
          name: "Visual Studio Code",
          type: 0,
          applicationId: "vscode",
          state: "집중 코딩 중",
          details: "타임라인 기능 구현"
        }]
      },
      // End of day: Going offline
      {
        status: 0b000000, // all offline
        time: "18:00",
        activities: []
      }
    ];

    presenceData.forEach((data, index) => {
      const timestamp = new Date(baseDate);
      const [hours, minutes] = data.time.split(":").map(Number);
      timestamp.setHours(hours, minutes, 0, 0);

      const presenceId = randomUUID();
      const presence: PresenceResponse = {
        id: presenceId,
        status: data.status,
        activities: data.activities,
        timestamp,
        userId
      };

      this.presences.set(presenceId, presence);

      // Create timeline entries for status changes
      if (index > 0) {
        const prevData = presenceData[index - 1];
        if (prevData.status !== data.status) {
          const timelineId = randomUUID();
          const statusChange = compareStatuses(prevData.status, data.status);
          
          const timelineEntry: TimelineEntry = {
            id: timelineId,
            type: 'status_change',
            timestamp,
            userId,
            oldStatus: prevData.status,
            newStatus: data.status,
            statusChange
          };

          this.timelineEntries.set(timelineId, timelineEntry);
        }
      }

      // Create timeline entries for activity changes
      if (index > 0) {
        const prevActivities = presenceData[index - 1].activities || [];
        const currentActivities = data.activities || [];

        // Find removed activities
        prevActivities.forEach(prevActivity => {
          const stillExists = currentActivities.some(curr => curr.name === prevActivity.name);
          if (!stillExists) {
            const timelineId = randomUUID();
            const timelineEntry: TimelineEntry = {
              id: timelineId,
              type: 'activity_change',
              timestamp,
              userId,
              activityChange: {
                type: 'removed',
                activity: prevActivity
              }
            };
            this.timelineEntries.set(timelineId, timelineEntry);
          }
        });

        // Find added activities
        currentActivities.forEach(currentActivity => {
          const isNew = !prevActivities.some(prev => prev.name === currentActivity.name);
          if (isNew) {
            const timelineId = randomUUID();
            const timelineEntry: TimelineEntry = {
              id: timelineId,
              type: 'activity_change',
              timestamp,
              userId,
              activityChange: {
                type: 'added',
                activity: currentActivity
              }
            };
            this.timelineEntries.set(timelineId, timelineEntry);
          }
        });
      }
    });

    // Add event timeline entries
    Array.from(this.events.values()).forEach(event => {
      const eventDate = new Date(`${event.date} ${event.time}`);
      const timelineId = randomUUID();
      const timelineEntry: TimelineEntry = {
        id: timelineId,
        type: 'event',
        timestamp: eventDate,
        title: event.title,
        description: event.description,
        duration: event.duration,
        category: event.category,
        location: event.location,
        isCompleted: event.isCompleted
      };
      
      this.timelineEntries.set(timelineId, timelineEntry);
    });
  }

  async getEvents(): Promise<EventResponse[]> {
    return Array.from(this.events.values()).sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.time}`);
      const dateTimeB = new Date(`${b.date} ${b.time}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });
  }

  async getEventsByDate(date: string): Promise<EventResponse[]> {
    return Array.from(this.events.values())
      .filter(event => event.date === date)
      .sort((a, b) => {
        const timeA = a.time;
        const timeB = b.time;
        return timeA.localeCompare(timeB);
      });
  }

  async getEvent(id: string): Promise<EventResponse | undefined> {
    return this.events.get(id);
  }



  async searchEvents(query: string): Promise<EventResponse[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.events.values())
      .filter(event => 
        event.title.toLowerCase().includes(lowercaseQuery) ||
        (event.description && event.description.toLowerCase().includes(lowercaseQuery)) ||
        event.category.toLowerCase().includes(lowercaseQuery) ||
        (event.location && event.location.toLowerCase().includes(lowercaseQuery))
      )
      .sort((a, b) => {
        const dateTimeA = new Date(`${a.date} ${a.time}`);
        const dateTimeB = new Date(`${b.date} ${b.time}`);
        return dateTimeA.getTime() - dateTimeB.getTime();
      });
  }

  async getEventsByCategory(category: string): Promise<EventResponse[]> {
    return Array.from(this.events.values())
      .filter(event => event.category === category)
      .sort((a, b) => {
        const dateTimeA = new Date(`${a.date} ${a.time}`);
        const dateTimeB = new Date(`${b.date} ${b.time}`);
        return dateTimeA.getTime() - dateTimeB.getTime();
      });
  }

  // Presence operations
  async getPresences(): Promise<PresenceResponse[]> {
    return Array.from(this.presences.values()).sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  async getPresencesByDate(date: string): Promise<PresenceResponse[]> {
    return Array.from(this.presences.values())
      .filter(presence => {
        const presenceDate = presence.timestamp.toISOString().split('T')[0];
        return presenceDate === date;
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getPresencesByUserId(userId: string): Promise<PresenceResponse[]> {
    return Array.from(this.presences.values())
      .filter(presence => presence.userId === userId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Timeline operations
  async getTimeline(date?: string): Promise<TimelineEntry[]> {
    let entries = Array.from(this.timelineEntries.values());
    
    if (date) {
      entries = entries.filter(entry => {
        const entryDate = entry.timestamp.toISOString().split('T')[0];
        return entryDate === date;
      });
    }
    
    return entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getTimelineByUserId(userId: string, date?: string): Promise<TimelineEntry[]> {
    let entries = Array.from(this.timelineEntries.values())
      .filter(entry => entry.userId === userId || entry.type === 'event');
    
    if (date) {
      entries = entries.filter(entry => {
        const entryDate = entry.timestamp.toISOString().split('T')[0];
        return entryDate === date;
      });
    }
    
    return entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const storage = new MemStorage();
