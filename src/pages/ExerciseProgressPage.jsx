import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns"; // Import adapter first
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js"; // Then Chart.js
import exercisesService from "../services/exercisesService";
import exerciseLogsService from "../services/exerciseLogsService";
import { useAuth } from "../hooks/useAuth";
import { FaArrowLeft } from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const ExerciseProgressPage = () => {
  const { exerciseId } = useParams(); // Get exerciseId from URL
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [exerciseDetails, setExerciseDetails] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", {
        state: { message: "Please log in to view progress charts." },
      });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const processHistoryData = useCallback((historyLogs, exerciseName) => {
    if (!historyLogs || historyLogs.length === 0) {
      setChartData(null);
      return;
    }

    const dataPoints = historyLogs
      .map((log) => {
        // --- Add this log ---
        console.log("Raw startTime from log:", log.workoutLog?.startTime);
        // --- End log ---
        let maxWeightInLog = 0;
        if (log.setsData && Array.isArray(log.setsData)) {
          log.setsData.forEach((set) => {
            if (set.weight > maxWeightInLog) {
              maxWeightInLog = set.weight;
            }
          });
        }
        const dateObject = new Date(log.workoutLog?.startTime);
        // --- Add this log ---
        console.log(
          `Processed dateObject for ${log.workoutLog?.startTime}:`,
          dateObject,
          "isValid:",
          !isNaN(dateObject)
        );
        // --- End log ---
        return {
          x: dateObject,
          y: maxWeightInLog,
        };
      })
      .sort((a, b) => a.x - b.x);

    // --- Add this log ---
    console.log(
      "Final dataPoints for chart:",
      JSON.parse(JSON.stringify(dataPoints))
    );
    // --- End log ---

    setChartData({
      datasets: [
        {
          label: `Max Weight for ${exerciseName}`,
          data: dataPoints,
          borderColor: "rgb(218, 165, 32)",
          backgroundColor: "rgba(218, 165, 32, 0.5)",
          tension: 0.1,
        },
      ],
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !exerciseId) return;

      setLoading(true);
      setError(null);
      setChartData(null); // Clear previous chart data

      try {
        // 1. Fetch exercise details (for name, etc.)
        const details = await exercisesService.getExerciseById(exerciseId);
        setExerciseDetails(details);

        // 2. Fetch exercise history
        const historyLogs = await exerciseLogsService.getExerciseHistory(
          exerciseId
        );

        if (details && historyLogs) {
          processHistoryData(historyLogs, details.name);
        } else if (!historyLogs || historyLogs.length === 0) {
          // No history, but we have details, so we can show "No data"
          console.log(`No history logs found for exercise ${exerciseId}`);
        }
      } catch (err) {
        console.error("Error fetching exercise data or history:", err);
        setError(err.message || "Failed to load exercise progress data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [exerciseId, isAuthenticated, processHistoryData]);

  if (authLoading)
    return (
      <div className="p-6 text-white text-center">
        Loading authentication...
      </div>
    );
  // if (!isAuthenticated) return null; // Handled by redirect effect

  return (
    <div className="min-h-screen bg-dark-slate-gray text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)} // Go back
            className="text-goldenrod hover:text-dark-goldenrod transition-colors mr-3 text-xl"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-heading-1 text-goldenrod">
            Progress:{" "}
            {loading ? "Loading..." : exerciseDetails?.name || "Exercise"}
          </h1>
        </div>

        {loading && (
          <div className="text-center p-4 text-goldenrod">
            Loading chart data...
          </div>
        )}
        {error && (
          <div className="text-sepia p-4 text-center bg-sepia/10 rounded-md">
            {error}
          </div>
        )}

        {!loading && !error && chartData && (
          <div className="bg-midnight-green p-4 rounded-lg shadow-lg">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: "top",
                    labels: { color: "white", font: { size: 14 } },
                  },
                  title: { display: false }, // Title is now in the page heading
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        let label = context.dataset.label || "";
                        if (label) {
                          label += ": ";
                        }
                        if (context.parsed.y !== null) {
                          label += `${context.parsed.y} kg`; // Assuming weight
                        }
                        return label;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    type: "time",
                    time: {
                      unit: "day",
                      tooltipFormat: "MMM dd, yyyy",
                      displayFormats: { day: "MMM dd" },
                    },
                    ticks: { color: "rgba(255, 255, 255, 0.7)" },
                    grid: { color: "rgba(255, 255, 255, 0.1)" },
                    title: { display: true, text: "Date", color: "white" },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: { color: "rgba(255, 255, 255, 0.7)" },
                    grid: { color: "rgba(255, 255, 255, 0.1)" },
                    title: {
                      display: true,
                      text: "Max Weight (kg)",
                      color: "white",
                    },
                  },
                },
              }}
            />
          </div>
        )}
        {!loading && !error && !chartData && exerciseDetails && (
          <div className="text-center p-4 text-gray-400 bg-midnight-green rounded-lg">
            No workout data logged yet for "{exerciseDetails.name}". Perform
            this exercise in your workouts to see your progress!
          </div>
        )}
        {!loading && !exerciseDetails && !error && (
          <div className="text-center p-4 text-gray-400 bg-midnight-green rounded-lg">
            Could not load exercise details.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseProgressPage;
