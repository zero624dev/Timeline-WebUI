import { nanoid } from 'nanoid';
import { Presence, IPresence, decodeStatus, getStatusName, TARGET_USER_ID } from './mongodb';
import type { EventResponse, TimelineEntry, PresenceResponse } from '@shared/schema';
import { IStorage } from './storage';

function generateId(): string {
  return nanoid();
}

export class MongoStorage implements IStorage {
  // Events - keeping empty as requested to focus on presence data
  async getEvents(): Promise<EventResponse[]> {
    return [];
  }

  async getEvent(id: string): Promise<EventResponse | undefined> {
    return undefined;
  }

  async getEventsByDate(date: string): Promise<EventResponse[]> {
    return [];
  }

  async getEventsByCategory(category: string): Promise<EventResponse[]> {
    return [];
  }

  async searchEvents(query: string): Promise<EventResponse[]> {
    return [];
  }

  // Helper function to convert IPresence to PresenceResponse
  private convertToPresenceResponse(presence: IPresence): PresenceResponse {
    return {
      id: presence._id?.toString() || nanoid(),
      status: presence.status,
      activities: presence.activities?.map(activity => ({
        name: activity.name,
        type: activity.type,
        applicationId: activity.applicationId,
        timestamps: activity.timestamps,
        emoji: activity.emoji,
        createdTimestamp: activity.createdTimestamp,
        details: activity.details,
        state: activity.state
      })) || [],
      timestamp: presence.timestamp,
      userId: presence.userId
    };
  }

  // Presence methods
  async getPresences(): Promise<PresenceResponse[]> {
    try {
      const presences = await Presence.find({ userId: TARGET_USER_ID })
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();
      return presences.map(p => this.convertToPresenceResponse(p));
    } catch (error) {
      console.error('Error fetching presences:', error);
      return [];
    }
  }

  async getPresencesByDate(date: string): Promise<PresenceResponse[]> {
    try {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const presences = await Presence.find({ 
        userId: TARGET_USER_ID,
        timestamp: {
          $gte: startDate,
          $lt: endDate
        }
      })
      .sort({ timestamp: 1 })
      .lean();

      return presences.map(p => this.convertToPresenceResponse(p));
    } catch (error) {
      console.error('Error fetching presences by date:', error);
      return [];
    }
  }

  async getPresencesByUserId(userId: string): Promise<PresenceResponse[]> {
    try {
      const presences = await Presence.find({ userId })
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();
      return presences.map(p => this.convertToPresenceResponse(p));
    } catch (error) {
      console.error('Error fetching presences by user:', error);
      return [];
    }
  }

  // Timeline methods  
  async getTimeline(date?: string): Promise<TimelineEntry[]> {
    try {
      let rawPresences: IPresence[];
      
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);

        rawPresences = await Presence.find({ 
          userId: TARGET_USER_ID,
          timestamp: {
            $gte: startDate,
            $lt: endDate
          }
        })
        .sort({ timestamp: 1 })
        .lean();
      } else {
        rawPresences = await Presence.find({ userId: TARGET_USER_ID })
          .sort({ timestamp: -1 })
          .limit(100)
          .lean();
      }

      const timeline: TimelineEntry[] = [];
      let previousPresence: IPresence | null = null;

      for (const presence of rawPresences) {
        // Check for status changes
        if (previousPresence) {
          const prevStatus = decodeStatus(previousPresence.status);
          const currStatus = decodeStatus(presence.status);

          const statusChanges: any = {};
          let hasChanges = false;

          // Check each platform for status changes
          for (const platform of ['web', 'desktop', 'mobile']) {
            if (prevStatus[platform as keyof typeof prevStatus] !== currStatus[platform as keyof typeof currStatus]) {
              statusChanges[platform] = {
                old: prevStatus[platform as keyof typeof prevStatus],
                new: currStatus[platform as keyof typeof currStatus]
              };
              hasChanges = true;
            }
          }

          if (hasChanges) {
            timeline.push({
              id: nanoid(),
              type: 'status_change',
              timestamp: presence.timestamp,
              statusChange: statusChanges
            });
          }
        }

        // Check for activity changes
        if (presence.activities && presence.activities.length > 0) {
          const prevActivities = previousPresence?.activities || [];
          
          // Find added activities
          for (const activity of presence.activities) {
            const wasPresent = prevActivities.some(prev => {
              // If both have applicationId, match by applicationId
              if (activity.applicationId && prev.applicationId) {
                return prev.applicationId === activity.applicationId;
              }
              // If no applicationId, match by name
              return prev.name === activity.name && prev.state === activity.state;
            });
            
            if (!wasPresent) {
              timeline.push({
                id: nanoid(),
                type: 'activity_change',
                timestamp: presence.timestamp,
                activityChange: {
                  type: 'added',
                  activity: {
                    name: activity.name,
                    type: activity.type,
                    state: activity.state,
                    details: activity.details,
                    applicationId: activity.applicationId
                  }
                }
              });
            }
          }

          // Find removed activities
          for (const prevActivity of prevActivities) {
            const isStillPresent = presence.activities.some(curr => {
              // If both have applicationId, match by applicationId
              if (prevActivity.applicationId && curr.applicationId) {
                return curr.applicationId === prevActivity.applicationId;
              }
              // If no applicationId, match by name
              return curr.name === prevActivity.name && curr.state === prevActivity.state;
            });
            
            if (!isStillPresent) {
              timeline.push({
                id: nanoid(),
                type: 'activity_change',
                timestamp: presence.timestamp,
                activityChange: {
                  type: 'removed',
                  activity: {
                    name: prevActivity.name,
                    type: prevActivity.type,
                    state: prevActivity.state,
                    details: prevActivity.details,
                    applicationId: prevActivity.applicationId
                  }
                }
              });
            }
          }
        } else if (previousPresence?.activities && previousPresence.activities.length > 0) {
          // All activities removed
          for (const prevActivity of previousPresence.activities) {
            timeline.push({
              id: nanoid(),
              type: 'activity_change',
              timestamp: presence.timestamp,
              activityChange: {
                type: 'removed',
                activity: {
                  name: prevActivity.name,
                  type: prevActivity.type,
                  state: prevActivity.state,
                  details: prevActivity.details,
                  applicationId: prevActivity.applicationId
                }
              }
            });
          }
        }

        previousPresence = presence;
      }

      // Sort timeline by timestamp
      return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error('Error generating timeline:', error);
      return [];
    }
  }

  async getTimelineByUserId(userId: string, date?: string): Promise<TimelineEntry[]> {
    try {
      let rawPresences: IPresence[];
      
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);

        rawPresences = await Presence.find({ 
          userId: userId,
          timestamp: {
            $gte: startDate,
            $lt: endDate
          }
        })
        .sort({ timestamp: 1 })
        .lean();
      } else {
        rawPresences = await Presence.find({ userId: userId })
          .sort({ timestamp: -1 })
          .limit(100)
          .lean();
      }

      const timeline: TimelineEntry[] = [];
      let previousPresence: IPresence | null = null;

      for (const presence of rawPresences) {
        if (previousPresence) {
          const prevStatus = decodeStatus(previousPresence.status);
          const currStatus = decodeStatus(presence.status);

          const statusChanges: any = {};
          let hasChanges = false;

          for (const platform of ['web', 'desktop', 'mobile']) {
            if (prevStatus[platform as keyof typeof prevStatus] !== currStatus[platform as keyof typeof currStatus]) {
              statusChanges[platform] = {
                old: prevStatus[platform as keyof typeof prevStatus],
                new: currStatus[platform as keyof typeof currStatus]
              };
              hasChanges = true;
            }
          }

          if (hasChanges) {
            timeline.push({
              id: generateId(),
              type: 'status_change',
              timestamp: presence.timestamp,
              statusChange: statusChanges
            });
          }
        }

        const currentActivities = presence.activities || [];
        const previousActivities = previousPresence?.activities || [];

        for (const activity of currentActivities) {
          const isNewActivity = !previousActivities.some(prev => 
            prev.applicationId ? 
              prev.applicationId === activity.applicationId :
              (prev.name === activity.name && prev.state === activity.state)
          );

          if (isNewActivity) {
            timeline.push({
              id: generateId(),
              type: 'activity_change',
              timestamp: presence.timestamp,
              activityChange: {
                type: 'added',
                activity: {
                  name: activity.name,
                  type: activity.type,
                  state: activity.state,
                  details: activity.details,
                  applicationId: activity.applicationId
                }
              }
            });
          }
        }

        for (const prevActivity of previousActivities) {
          const stillActive = currentActivities.some(curr => 
            prevActivity.applicationId ? 
              curr.applicationId === prevActivity.applicationId :
              (curr.name === prevActivity.name && curr.state === prevActivity.state)
          );

          if (!stillActive) {
            timeline.push({
              id: generateId(),
              type: 'activity_change',
              timestamp: presence.timestamp,
              activityChange: {
                type: 'removed',
                activity: {
                  name: prevActivity.name,
                  type: prevActivity.type,
                  state: prevActivity.state,
                  details: prevActivity.details,
                  applicationId: prevActivity.applicationId
                }
              }
            });
          }
        }

        previousPresence = presence;
      }

      return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error('Error generating timeline for user:', error);
      return [];
    }
  }

  async getPresencesByUserIdAndDate(userId: string, dateString: string): Promise<PresenceResponse[]> {
    try {
      const startDate = new Date(dateString);
      const endDate = new Date(dateString);
      endDate.setDate(endDate.getDate() + 1);

      const presences = await Presence.find({
        userId: userId,
        timestamp: {
          $gte: startDate,
          $lt: endDate
        }
      })
      .sort({ timestamp: 1 })
      .lean();

      return presences.map(p => this.convertToPresenceResponse(p));
    } catch (error) {
      console.error('Error fetching presences by user and date:', error);
      return [];
    }
  }
}