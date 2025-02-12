import React, { useMemo, useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence, Variants } from "framer-motion";

// -- Type Definitions --
interface UpcomingEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
}

interface UpcomingEventsProps {
  events: UpcomingEvent[];
}

// -- Utility: Format Date/Time --
const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

// -- Custom Hook: useCountdown --
const useCountdown = (targetDate: Date) => {
  const calculateTimeLeft = () => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

// -- Framer Motion Variants --
const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events }) => {
  // MUI theme for dark/light detection
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Background and text colors based on theme
  const containerBgClass = isDarkMode ? "bg-[#141b2d] text-white" : "bg-white text-gray-900";
  const cardBgClass = isDarkMode ? "bg-[#141b2d]" : "bg-gray-100";
  const borderClass = isDarkMode ? "border-indigo-500" : "border-gray-300";
  const textColorClass = isDarkMode ? "text-white" : "text-gray-800";
  const countdownTextClass = isDarkMode ? "text-white" : "text-gray-700";

  // Sort events by start time
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events]);

  // Local state for current time
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter active events (those whose start time is still in the future)
  const activeEvents = sortedEvents.filter(
    (event) => event.start.getTime() > currentTime
  );

  return (
    <motion.div
      className={`${containerBgClass} backdrop-blur-md rounded-2xl shadow-2xl p-8 border-l-8 ${
        isDarkMode ? "border-[#141b2d]" : "border-white"
      }`}
      aria-live="polite"
      initial="hidden"
      animate="visible"
      variants={listVariants}
      role="region"
      aria-label="Upcoming Events Section"
    >
      {activeEvents.length > 0 ? (
        <AnimatePresence>
          <motion.ul
            className="space-y-6"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={listVariants}
          >
            {activeEvents.map((event) => {
              // Use custom hook to get countdown
              const { days, hours, minutes, seconds } = useCountdown(event.start);

              return (
                <motion.li
                  key={event.id}
                  variants={itemVariants}
                  exit="exit"
                  className={`group relative p-6 rounded-xl ${cardBgClass} ${textColorClass} shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] flex flex-col md:flex-row justify-between items-center`}
                >
                  {/* --- Event Info --- */}
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight mb-1">
                      {event.title}
                    </h3>
                    <p className="text-sm opacity-80">
                      {formatDateTime(event.start)} &mdash; {formatDateTime(event.end)}
                    </p>
                  </div>

                  {/* --- Countdown Timer & Status Badge --- */}
                  <div className="flex flex-col items-end mt-4 md:mt-0">
                    <motion.span
                      whileHover={{ scale: 1.1 }}
                      className="bg-white text-indigo-700 px-4 py-1 rounded-full text-sm font-semibold transition-transform"
                    >
                      Upcoming
                    </motion.span>
                    <div className="mt-2 text-right text-sm">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className={countdownTextClass}
                      >
                        Starts in: {days}d {hours}h {minutes}m {seconds}s
                      </motion.p>
                    </div>
                  </div>

                  {/* --- Decorative Overlay (Hover Effect) --- */}
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    initial={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
                    whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.1)" }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      ) : (
        <p className="text-lg text-center animate-pulse opacity-80">
          No upcoming events.
        </p>
      )}
    </motion.div>
  );
};

export default React.memo(UpcomingEvents);
