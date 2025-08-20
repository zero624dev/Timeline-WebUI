import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { 
  Clock, Users, MapPin, Monitor, Smartphone, Globe, 
  Circle, Minus, Plus, Activity, User, Settings, Building, Utensils
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import type { EventResponse, TimelineEntry } from "@shared/schema";

interface TimelineProps {
  events: EventResponse[];
  selectedDate: Date;
  isLoading: boolean;
  userId: string;
}

export default function Timeline({ events, selectedDate, isLoading, userId }: TimelineProps) {
  const dateString = format(selectedDate, "yyyy-MM-dd");
  
  // Fetch unified timeline data for specific user
  const { data: timelineEntries = [], isLoading: isTimelineLoading } = useQuery<TimelineEntry[]>({
    queryKey: ["/api/timeline", userId, dateString],
    queryFn: () => fetch(`/api/timeline/${userId}?date=${dateString}`).then(res => res.json()),
    enabled: !!userId && userId.trim() !== "",
  });

  const getStatusIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'web': return Globe;
      case 'desktop': return Monitor; 
      case 'mobile': return Smartphone;
      default: return Circle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '온라인': return 'text-green-600 bg-green-100';
      case '자리비움': return 'text-yellow-600 bg-yellow-100';
      case '방해금지': return 'text-red-600 bg-red-100';
      case '오프라인': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEventStyle = (category: string) => {
    const styles = {
      "업무 미팅": "bg-blue-50 border-blue-200",
      "개인 일정": "bg-emerald-50 border-emerald-200", 
      "프로젝트": "bg-purple-50 border-purple-200",
      "소셜": "bg-orange-50 border-orange-200",
    };
    return styles[category as keyof typeof styles] || "bg-gray-50 border-gray-200";
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      "업무 미팅": "bg-blue-100 text-blue-800",
      "개인 일정": "bg-emerald-100 text-emerald-800", 
      "프로젝트": "bg-purple-100 text-purple-800",
      "소셜": "bg-orange-100 text-orange-800",
    };
    return styles[category as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getTimelineDotColor = (category: string) => {
    const colors = {
      "업무 미팅": "bg-blue-500",
      "개인 일정": "bg-emerald-500",
      "프로젝트": "bg-purple-500", 
      "소셜": "bg-orange-500",
    };
    return colors[category as keyof typeof colors] || "bg-gray-500";
  };

  const getIconForCategory = (category: string) => {
    const icons = {
      "업무 미팅": Users,
      "개인 일정": User,
      "프로젝트": Building,
      "소셜": Utensils,
    };
    return icons[category as keyof typeof icons] || Clock;
  };

  const formatDuration = (seconds: number) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      if (remainingMinutes === 0) {
        return `${hours}시간`;
      }
      return `${hours}시간 ${remainingMinutes}분`;
    } else if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}분`;
    }
    return `${Math.floor(seconds)}초`;
  };

  const renderStatusChange = (entry: TimelineEntry) => {
    if (!entry.statusChange) return null;
    
    const changes = Object.entries(entry.statusChange)
      .filter(([_, change]) => change !== null)
      .map(([device, change]) => ({ device, change }));

    if (changes.length === 0) return null;

    return (
      <div className="flex items-start space-x-3 py-3 border-l-2 border-blue-200 pl-4 ml-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Settings className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">상태 변경</span>
            <span className="text-xs text-gray-500">
              {format(entry.timestamp, "HH:mm", { locale: ko })}
            </span>
          </div>
          <div className="space-y-1">
            {changes.map(({ device, change }) => {
              const IconComponent = getStatusIcon(device);
              const oldColor = getStatusColor(change!.old);
              const newColor = getStatusColor(change!.new);
              
              return (
                <div key={device} className="flex items-center space-x-2 text-sm">
                  <IconComponent className="h-3 w-3 text-gray-400" />
                  <span className="capitalize text-gray-600">{device}:</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${oldColor}`}>
                    {change!.old}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${newColor}`}>
                    {change!.new}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderActivityChange = (entry: TimelineEntry) => {
    if (!entry.activityChange) return null;
    
    const { type, activity } = entry.activityChange;
    const isAdded = type === 'added';

    return (
      <div className={`flex items-start space-x-3 py-3 border-l-2 pl-4 ml-4 ${
        isAdded ? 'border-green-200' : 'border-red-200'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isAdded ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isAdded ? (
            <Plus className="h-4 w-4 text-green-600" />
          ) : (
            <Minus className="h-4 w-4 text-red-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              활동 {isAdded ? '시작' : '종료'}
            </span>
            <span className="text-xs text-gray-500">
              {format(entry.timestamp, "HH:mm", { locale: ko })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="h-3 w-3 text-gray-400" />
            <span className="font-medium text-gray-900">{activity.name}</span>
            {activity.state && (
              <span className="text-sm text-gray-600">- {activity.state}</span>
            )}
          </div>
          {activity.applicationId && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
              <span>앱 ID: {activity.applicationId}</span>
            </div>
          )}
          {activity.details && (
            <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
          )}
        </div>
      </div>
    );
  };

  // Remove event rendering - we only show status and activity changes

  if (isLoading || isTimelineLoading) {
    return (
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (timelineEntries.length === 0) {
    return (
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            선택한 날짜에 활동이 없습니다
          </h3>
          <p className="text-slate-500">
            {format(selectedDate, "yyyy년 M월 d일 (E)", { locale: ko })}에 기록된 
            이벤트나 상태 변경이 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900" data-testid="text-timeline-title">
              타임라인
            </h2>
            <p className="text-sm text-slate-600">
              {format(selectedDate, "yyyy년 M월 d일 (E)", { locale: ko })}
            </p>
          </div>
          <div className="text-sm text-slate-500">
            총 {timelineEntries.length}개 항목
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-0 relative">
          {/* Timeline line */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-slate-200"></div>
          
          {timelineEntries.map((entry) => (
            <div key={entry.id} className="relative">
              {entry.type === 'status_change' && renderStatusChange(entry)}
              {entry.type === 'activity_change' && renderActivityChange(entry)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}