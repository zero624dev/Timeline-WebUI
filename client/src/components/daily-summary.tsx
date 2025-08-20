import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Clock, Activity, Monitor, Smartphone, Globe } from "lucide-react";
import type { PresenceResponse, TimelineEntry } from "@shared/schema";

interface DailySummaryProps {
  selectedDate: Date;
  userId: string;
}

interface StatusDuration {
  status: string;
  duration: number;
  platform: string;
}

interface ActivityDuration {
  name: string;
  duration: number;
}

export default function DailySummary({ selectedDate, userId }: DailySummaryProps) {
  const dateString = format(selectedDate, "yyyy-MM-dd");

  const { data: presences = [], isLoading } = useQuery<PresenceResponse[]>({
    queryKey: ["/api/presences", userId, dateString],
    queryFn: () => fetch(`/api/presences/user/${userId}/date/${dateString}`).then(res => res.json()),
    enabled: !!userId && userId.trim() !== "",
  });

  // Calculate status durations
  const calculateStatusDurations = (): StatusDuration[] => {
    if (presences.length === 0) return [];

    const statusDurations: { [key: string]: number } = {};
    const platforms = ['web', 'desktop', 'mobile'];
    
    for (let i = 0; i < presences.length - 1; i++) {
      const current = presences[i];
      const next = presences[i + 1];
      
      const currentTime = new Date(current.timestamp).getTime();
      const nextTime = new Date(next.timestamp).getTime();
      const duration = (nextTime - currentTime) / (1000 * 60); // minutes
      
      // Decode 6-bit status
      const mobile = current.status & 3;
      const desktop = (current.status >> 2) & 3;
      const web = (current.status >> 4) & 3;
      
      const statusMap = ['오프라인', '자리비움', '온라인', '방해금지'];
      const statuses = { web: statusMap[web], desktop: statusMap[desktop], mobile: statusMap[mobile] };
      
      platforms.forEach(platform => {
        const key = `${platform}-${statuses[platform as keyof typeof statuses]}`;
        statusDurations[key] = (statusDurations[key] || 0) + duration;
      });
    }

    return Object.entries(statusDurations)
      .map(([key, duration]) => {
        const [platform, status] = key.split('-');
        return { platform, status, duration };
      })
      .filter(item => item.duration > 0)
      .sort((a, b) => b.duration - a.duration);
  };

  // Calculate activity durations - merge same activities
  const calculateActivityDurations = (): ActivityDuration[] => {
    if (presences.length === 0) return [];

    const activityDurations: { [key: string]: number } = {};
    
    for (let i = 0; i < presences.length - 1; i++) {
      const current = presences[i];
      const next = presences[i + 1];
      
      const currentTime = new Date(current.timestamp).getTime();
      const nextTime = new Date(next.timestamp).getTime();
      const duration = (nextTime - currentTime) / (1000 * 60); // minutes
      
      if (current.activities && current.activities.length > 0) {
        current.activities.forEach(activity => {
          // Use only the activity name as key to merge same activities
          const key = activity.name;
          activityDurations[key] = (activityDurations[key] || 0) + duration;
        });
      }
    }

    return Object.entries(activityDurations)
      .map(([name, duration]) => ({ name, duration }))
      .filter(item => item.duration > 0)
      .sort((a, b) => b.duration - a.duration);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds}초`;
    } else if (minutes < 60) {
      return `${Math.round(minutes)}분`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (remainingMinutes === 0) {
      return `${hours}시간`;
    }
    return `${hours}시간 ${remainingMinutes}분`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case '온라인': return 'text-green-600 bg-green-100';
      case '자리비움': return 'text-yellow-600 bg-yellow-100';
      case '방해금지': return 'text-red-600 bg-red-100';
      case '오프라인': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'web': return Globe;
      case 'desktop': return Monitor;
      case 'mobile': return Smartphone;
      default: return Clock;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-slate-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-slate-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statusDurations = calculateStatusDurations();
  const activityDurations = calculateActivityDurations();

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          상태 요약
        </h3>
        
        {statusDurations.filter(item => item.status !== '오프라인').length === 0 ? (
          <p className="text-slate-500 text-sm">상태 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {statusDurations.filter(item => item.status !== '오프라인').slice(0, 6).map((item, index) => {
              const IconComponent = getPlatformIcon(item.platform);
              const colorClass = getStatusColor(item.status);
              
              return (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <IconComponent className="h-4 w-4 text-slate-400" />
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {item.platform}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatDuration(item.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          활동 요약
        </h3>
        
        {activityDurations.length === 0 ? (
          <p className="text-slate-500 text-sm">활동 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {activityDurations.slice(0, 8).map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 truncate">
                    {item.name}
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900 ml-3">
                  {formatDuration(item.duration)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Date Info */}
      <div className="bg-slate-100 rounded-xl p-4 text-center">
        <p className="text-sm text-slate-600">
          {format(selectedDate, "yyyy년 M월 d일 (E)", { locale: ko })} 데이터
        </p>
      </div>
    </div>
  );
}