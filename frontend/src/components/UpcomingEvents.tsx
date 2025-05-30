import React, { useMemo, useEffect, useState } from "react";
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
// Calculates the time left until the target date in days, hours, minutes, and seconds.
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
    }, 1000); // update every second

    // Update immediately on mount
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

// -- Framer Motion Variants --
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events }) => {
  // Sort the events by start time
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events]);

  // Local state for current time to trigger re-render every second
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter active events (only those whose start time is in the future)
  const activeEvents = sortedEvents.filter(
    (event) => event.start.getTime() > currentTime
  );

  // Only display the first 5 upcoming events
  const displayedEvents = activeEvents.slice(0, 5);

  return (
    <motion.div
      className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border-l-8 border-indigo-500 transition-all duration-300 hover:border-indigo-600"
      aria-live="polite"
      role="region"
      aria-label="Upcoming Events Section"
    >
      {displayedEvents.length > 0 ? (
        // Using layout on the UL helps smooth out the reordering
        <motion.ul className="space-y-6" layout>
          <AnimatePresence>
            {displayedEvents.map((event) => {
              // Get the live countdown for each event
              const { days, hours, minutes, seconds } = useCountdown(event.start);

              return (
                <motion.li
                  key={event.id}
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{
                    scale: 1.05,
                    filter: "brightness(1.1)",
                    transition: { duration: 0.3, ease: "easeInOut" },
                  }}
                  className="group relative p-6 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-lg cursor-pointer flex flex-col md:flex-row justify-between items-center"
                >
                  {/* --- Event Info --- */}
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight mb-1">
                      {event.title}
                    </h3>
                    <p className="text-sm text-white/90">
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
                        className="text-white"
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
          </AnimatePresence>
        </motion.ul>
      ) : (
        <p className="text-gray-600 text-lg text-center animate-pulse">
          No upcoming events.
        </p>
      )}
    </motion.div>
  );
};

export default React.memo(UpcomingEvents);