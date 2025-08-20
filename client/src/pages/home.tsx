import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";
import DailySummary from "@/components/daily-summary";
import Timeline from "@/components/timeline";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date('2025-08-17'));
  const [userId, setUserId] = useState("");

  return (
    <div className="bg-slate-50 font-sans min-h-screen" data-testid="home-page">
      <Header
        onUserChange={setUserId}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Date Navigator */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                날짜 선택
              </h3>
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
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
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  data-testid="button-next-day"
                >
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </Button>
              </div>
              <p className="text-sm text-slate-500 text-center">
                {format(selectedDate, "E", { locale: ko })}요일
              </p>
            </div>

            <DailySummary selectedDate={selectedDate} userId={userId} />
          </div>
          
          <Timeline 
            events={[]}
            selectedDate={selectedDate}
            isLoading={false}
            userId={userId}
          />
        </div>
      </div>
    </div>
  );
}