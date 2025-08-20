import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertEventSchema, type InsertEvent } from "@shared/schema";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

export default function EventFormModal({ isOpen, onClose, selectedDate }: EventFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: format(selectedDate, "yyyy-MM-dd"),
      time: "09:00",
      duration: 30,
      category: "업무 미팅",
      location: "",
      isCompleted: false,
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: InsertEvent) => {
      return apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "이벤트 생성됨",
        description: "새로운 이벤트가 성공적으로 추가되었습니다.",
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "생성 실패",
        description: "이벤트 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEvent) => {
    // Clean up location field - remove if empty string
    const cleanedData = {
      ...data,
      location: data.location?.trim() || undefined,
      isCompleted: data.isCompleted || false, // Ensure boolean value
    };
    createEventMutation.mutate(cleanedData);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} data-testid="event-form-modal">
      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900">
            새 이벤트 추가
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            data-testid="button-close-modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="event-form">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-slate-700">
                    이벤트 제목
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="이벤트 제목을 입력하세요"
                      {...field}
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-slate-700">
                    설명
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="이벤트 설명을 입력하세요"
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-slate-700">
                      날짜
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-slate-700">
                      시간
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        data-testid="input-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-slate-700">
                    지속 시간
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-duration">
                        <SelectValue placeholder="지속 시간을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="30">30분</SelectItem>
                      <SelectItem value="60">1시간</SelectItem>
                      <SelectItem value="90">1시간 30분</SelectItem>
                      <SelectItem value="120">2시간</SelectItem>
                      <SelectItem value="480">하루 종일</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-slate-700">
                    카테고리
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="카테고리를 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="업무 미팅">업무 미팅</SelectItem>
                      <SelectItem value="개인 일정">개인 일정</SelectItem>
                      <SelectItem value="프로젝트">프로젝트</SelectItem>
                      <SelectItem value="소셜">소셜</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-slate-700">
                    위치
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="위치를 입력하세요 (선택사항)"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                data-testid="button-cancel"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createEventMutation.isPending}
                data-testid="button-submit"
              >
                {createEventMutation.isPending ? "생성 중..." : "이벤트 생성"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
