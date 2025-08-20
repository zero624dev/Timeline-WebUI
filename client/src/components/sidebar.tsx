import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { addDays, subDays } from "date-fns";

interface Category {
  name: string;
  count: number;
  color: string;
}

interface SidebarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  categories: Category[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  todayEventCount: number;
  completedEventCount: number;
  upcomingEventCount: number;
}

export default function Sidebar({
  selectedDate,
  onDateChange,
  categories,
  selectedCategories,
  onCategoriesChange,
  todayEventCount,
  completedEventCount,
  upcomingEventCount,
}: SidebarProps) {
  
  const handleCategoryToggle = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      onCategoriesChange(selectedCategories.filter(cat => cat !== categoryName));
    } else {
      onCategoriesChange([...selectedCategories, categoryName]);
    }
  };

  const getBadgeColor = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-800",
      green: "bg-green-100 text-green-800",
      purple: "bg-purple-100 text-purple-800",
      orange: "bg-orange-100 text-orange-800",
    };
    return colors[color as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <aside className="w-full lg:w-80 space-y-6" data-testid="sidebar">
      {/* Date Navigator */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="date-navigator">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">날짜 선택</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateChange(subDays(selectedDate, 1))}
              data-testid="button-previous-day"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </Button>
            <h4 className="font-medium text-slate-900" data-testid="text-current-date">
              {format(selectedDate, "yyyy년 M월 d일", { locale: ko })}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateChange(addDays(selectedDate, 1))}
              data-testid="button-next-day"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
          <div className="text-center">
            <span className="text-sm text-slate-600" data-testid="text-day-of-week">
              {format(selectedDate, "EEEE", { locale: ko })}
            </span>
          </div>
        </div>
      </div>

      {/* Event Categories */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="category-filters">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">카테고리</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <label key={category.name} className="flex items-center cursor-pointer" data-testid={`category-filter-${category.name}`}>
              <Checkbox
                checked={selectedCategories.includes(category.name)}
                onCheckedChange={() => handleCategoryToggle(category.name)}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                data-testid={`checkbox-${category.name}`}
              />
              <span className="ml-3 text-sm text-slate-700">{category.name}</span>
              <span 
                className={`ml-auto text-xs px-2 py-1 rounded-full ${getBadgeColor(category.color)}`}
                data-testid={`count-${category.name}`}
              >
                {category.count}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="quick-stats">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">오늘의 요약</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">총 이벤트</span>
            <span className="text-sm font-medium text-slate-900" data-testid="count-total-events">
              {todayEventCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">완료된 이벤트</span>
            <span className="text-sm font-medium text-emerald-600" data-testid="count-completed-events">
              {completedEventCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">예정된 이벤트</span>
            <span className="text-sm font-medium text-blue-600" data-testid="count-upcoming-events">
              {upcomingEventCount}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
