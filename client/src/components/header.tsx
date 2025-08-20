import React from "react";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

interface HeaderProps {
  onUserChange: (userId: string) => void;
}

export default function Header({
  onUserChange,
}: HeaderProps) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    queryFn: () => fetch("/api/user").then(res => {
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();
    }),
    retry: false,
  });

  React.useEffect(() => {
    if (user?.id) {
      onUserChange(user.id);
    }
  }, [user?.id, onUserChange]);
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-slate-900" data-testid="text-app-title">
              EventTime - 활동 추적
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="animate-pulse flex items-center space-x-2">
                <div className="h-8 w-8 bg-slate-300 rounded-full"></div>
                <div className="h-4 w-20 bg-slate-300 rounded"></div>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {user.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                      alt={`${user.username} avatar`}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-slate-300 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-600" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700">
                    {user.username}#{user.discriminator}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/auth/logout'}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>로그아웃</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => window.location.href = '/auth/discord'}
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>Discord 로그인</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}