import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackgroundPattern } from "@/components/background-pattern";
import { SearchBar } from "@/components/search-bar";
import { StatusPill } from "@/components/status-pill";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  CheckSquare,
  Edit2,
  Trash2,
} from "lucide-react";
import type { CalendarEvent, CalendarTask } from "@shared/schema";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function CalendarPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: events = [], isLoading: eventsLoading } = useQuery<
    CalendarEvent[]
  >({
    queryKey: ["/api/calendar/events"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<
    CalendarTask[]
  >({
    queryKey: ["/api/calendar/tasks"],
  });

  const isLoading = eventsLoading || tasksLoading;

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return days;
  }, [currentDate]);

  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    events.forEach((e) => {
      const d = new Date(e.date);
      dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return dates;
  }, [events]);

  const taskDates = useMemo(() => {
    const dates = new Set<string>();
    tasks.forEach((t) => {
      const d = new Date(t.dateTime);
      dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return dates;
  }, [tasks]);

  const filteredEvents = events.filter(
    (e) =>
      e.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTasks = tasks.filter(
    (t) =>
      t.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const navigateMonth = (direction: number) => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + direction,
        1,
      ),
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const hasEvent = (day: number) => {
    return eventDates.has(
      `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`,
    );
  };

  const hasTask = (day: number) => {
    return taskDates.has(
      `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`,
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <BackgroundPattern />
      <Header title="CALENDAR OF ACTIVITIES" showBack />

      <main className="flex-1 relative z-10 px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-3xl p-6 md:p-8 backdrop-blur-xl"
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 pb-6 border-b-2"
              style={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #45B7D1, #96CEB4)",
                    boxShadow: "0 10px 25px rgba(69, 183, 209, 0.3)",
                  }}
                >
                  <CalendarIcon className="w-7 h-7 text-white" />
                </div>
                <h2
                  className="text-3xl md:text-4xl font-black tracking-tight"
                  style={{
                    color: "#FFFFFF",
                    textShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  }}
                  data-testid="text-calendar-title"
                >
                  Calendar of Activities
                </h2>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search events or tasks..."
                />
                <Button
                  className="rounded-xl px-4 gap-2 font-bold shadow-lg transition-all duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #45B7D1, #96CEB4)",
                    color: "white",
                  }}
                  data-testid="button-add-event"
                >
                  <Plus className="w-4 h-4" />
                  Add Event
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div
                className="rounded-2xl p-5 backdrop-blur-lg"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-110"
                    style={{ color: "#FFFFFF" }}
                    data-testid="button-prev-month"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3
                    className="text-lg font-black"
                    style={{ color: "#FFFFFF" }}
                    data-testid="text-current-month"
                  >
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-110"
                    style={{ color: "#FFFFFF" }}
                    data-testid="button-next-month"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-black py-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => (
                    <div
                      key={idx}
                      onClick={() =>
                        day &&
                        setSelectedDate(
                          new Date(
                            currentDate.getFullYear(),
                            currentDate.getMonth(),
                            day,
                          ),
                        )
                      }
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm cursor-pointer transition-all duration-200 ${day ? "hover:bg-white/10 hover:scale-105" : ""}`}
                      style={{
                        background:
                          day && isToday(day)
                            ? "linear-gradient(135deg, #FF6B9D, #FF8E53)"
                            : "transparent",
                        color: day ? "#FFFFFF" : "transparent",
                        fontWeight: day && isToday(day) ? "black" : "normal",
                        boxShadow:
                          day && isToday(day)
                            ? "0 4px 15px rgba(255, 107, 157, 0.4)"
                            : "none",
                      }}
                      data-testid={day ? `calendar-day-${day}` : undefined}
                    >
                      {day}
                      {day && (hasEvent(day) || hasTask(day)) && (
                        <div className="flex gap-0.5 mt-0.5">
                          {hasEvent(day) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFEAA7]" />
                          )}
                          {hasTask(day) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#DDA0DD]" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div
                  className="flex items-center justify-center gap-4 mt-4 pt-4 border-t"
                  style={{ borderColor: "rgba(255, 255, 255, 0.15)" }}
                >
                  <div
                    className="flex items-center gap-2 text-xs font-semibold"
                    style={{ color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#FFEAA7]" />{" "}
                    Events
                  </div>
                  <div
                    className="flex items-center gap-2 text-xs font-semibold"
                    style={{ color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#DDA0DD]" /> Tasks
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div
                  className="rounded-2xl p-5 backdrop-blur-lg"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <h3
                    className="text-xl font-black mb-4 flex items-center gap-2"
                    style={{ color: "#FFFFFF" }}
                  >
                    <CalendarIcon
                      className="w-6 h-6"
                      style={{ color: "#45B7D1" }}
                    />
                    Event Schedule
                  </h3>

                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : filteredEvents.length === 0 ? (
                    <EmptyState
                      icon={CalendarIcon}
                      title="No events scheduled"
                      description="Add your first event to get started with activity scheduling."
                    />
                  ) : (
                    <div
                      className="rounded-xl overflow-hidden shadow-lg"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        backdropFilter: "blur(5px)",
                      }}
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr
                              style={{
                                background:
                                  "linear-gradient(135deg, #45B7D1, #96CEB4)",
                                boxShadow: "0 4px 15px rgba(69, 183, 209, 0.2)",
                              }}
                            >
                              <th className="text-left px-4 py-3 text-sm font-black uppercase tracking-wide text-white">
                                Event Name
                              </th>
                              <th className="text-left px-4 py-3 text-sm font-black uppercase tracking-wide text-white hidden md:table-cell">
                                Date & Time
                              </th>
                              <th className="text-left px-4 py-3 text-sm font-black uppercase tracking-wide text-white hidden lg:table-cell">
                                Location
                              </th>
                              <th className="text-center px-4 py-3 text-sm font-black uppercase tracking-wide text-white">
                                Priority
                              </th>
                              <th className="text-center px-4 py-3 text-sm font-black uppercase tracking-wide text-white">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEvents.map((event, idx) => (
                              <tr
                                key={event.id}
                                className="transition-all duration-200 hover:bg-white/5"
                                style={{
                                  background:
                                    idx % 2 === 0
                                      ? "transparent"
                                      : "rgba(255, 255, 255, 0.03)",
                                  borderBottom:
                                    "1px solid rgba(255, 255, 255, 0.1)",
                                }}
                                data-testid={`event-row-${event.id}`}
                              >
                                <td className="px-4 py-4">
                                  <div>
                                    <p className="font-bold text-white">
                                      {event.eventName}
                                    </p>
                                    {event.notes && (
                                      <p className="text-xs opacity-80 text-white mt-1 line-clamp-1">
                                        {event.notes}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4 hidden md:table-cell text-white font-medium">
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    {new Date(event.date).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs opacity-80 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {event.time}
                                  </div>
                                </td>
                                <td className="px-4 py-4 hidden lg:table-cell text-white font-medium">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {event.location}
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  {event.priority && (
                                    <span
                                      className="px-2 py-1 rounded-full text-xs font-black"
                                      style={{
                                        background:
                                          event.priority === "High"
                                            ? "linear-gradient(135deg, #FF6B9D, #FF8E53)"
                                            : event.priority === "Medium"
                                              ? "linear-gradient(135deg, #FFEAA7, #FFD166)"
                                              : "linear-gradient(135deg, #45B7D1, #96CEB4)",
                                        color:
                                          event.priority === "Medium"
                                            ? "#333"
                                            : "#FFFFFF",
                                      }}
                                    >
                                      {event.priority}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-110"
                                      style={{ color: "#45B7D1" }}
                                      data-testid={`button-edit-event-${event.id}`}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-110"
                                      style={{ color: "#FF6B9D" }}
                                      data-testid={`button-delete-event-${event.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className="rounded-2xl p-5 backdrop-blur-lg"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <h3
                    className="text-xl font-black mb-4 flex items-center gap-2"
                    style={{ color: "#FFFFFF" }}
                  >
                    <CheckSquare
                      className="w-6 h-6"
                      style={{ color: "#96CEB4" }}
                    />
                    Task Schedule
                  </h3>

                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : filteredTasks.length === 0 ? (
                    <EmptyState
                      icon={CheckSquare}
                      title="No tasks scheduled"
                      description="Add tasks to track your deadlines and responsibilities."
                    />
                  ) : (
                    <div
                      className="rounded-xl overflow-hidden shadow-lg"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        backdropFilter: "blur(5px)",
                      }}
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr
                              style={{
                                background:
                                  "linear-gradient(135deg, #96CEB4, #45B7D1)",
                                boxShadow:
                                  "0 4px 15px rgba(150, 206, 180, 0.2)",
                              }}
                            >
                              <th className="text-left px-4 py-3 text-sm font-black uppercase tracking-wide text-white">
                                Task Name
                              </th>
                              <th className="text-left px-4 py-3 text-sm font-black uppercase tracking-wide text-white hidden md:table-cell">
                                Deadline
                              </th>
                              <th className="text-center px-4 py-3 text-sm font-black uppercase tracking-wide text-white">
                                Status
                              </th>
                              <th className="text-center px-4 py-3 text-sm font-black uppercase tracking-wide text-white">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTasks.map((task, idx) => (
                              <tr
                                key={task.id}
                                className="transition-all duration-200 hover:bg-white/5"
                                style={{
                                  background:
                                    idx % 2 === 0
                                      ? "transparent"
                                      : "rgba(255, 255, 255, 0.03)",
                                  borderBottom:
                                    "1px solid rgba(255, 255, 255, 0.1)",
                                }}
                                data-testid={`task-row-${task.id}`}
                              >
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={task.status === "Complete"}
                                      onChange={() => {}}
                                      className="w-5 h-5 rounded accent-[#96CEB4]"
                                      data-testid={`checkbox-task-${task.id}`}
                                    />
                                    <div>
                                      <p
                                        className={`font-bold ${task.status === "Complete" ? "line-through opacity-60" : ""}`}
                                        style={{ color: "#FFFFFF" }}
                                      >
                                        {task.taskName}
                                      </p>
                                      {task.description && (
                                        <p className="text-xs opacity-80 text-white mt-1 line-clamp-1">
                                          {task.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 hidden md:table-cell text-white font-medium">
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    {new Date(
                                      task.deadlineDateTime,
                                    ).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs opacity-80 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(
                                      task.deadlineDateTime,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <StatusPill status={task.status} />
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-110"
                                      style={{ color: "#45B7D1" }}
                                      data-testid={`button-edit-task-${task.id}`}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-110"
                                      style={{ color: "#FF6B9D" }}
                                      data-testid={`button-delete-task-${task.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
