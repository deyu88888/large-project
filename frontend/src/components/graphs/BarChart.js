import { jsx as _jsx } from "react/jsx-runtime";
import { ResponsiveBar } from "@nivo/bar";
const BarChart = ({ data, isDashboard = false }) => {
    return (_jsx(ResponsiveBar, { data: data, keys: ["members"], indexBy: "country", margin: { top: 40, right: 10, bottom: 40, left: 60 }, padding: 0.4, valueScale: { type: "linear" }, indexScale: { type: "band", round: true }, colors: { scheme: "nivo" }, theme: {
            axis: {
                domain: {
                    line: {
                        stroke: "#ffffff",
                    },
                },
                ticks: {
                    line: {
                        stroke: "#ffffff",
                        strokeWidth: 1,
                    },
                    text: {
                        fill: "#ffffff",
                        fontSize: 14,
                    },
                },
                legend: {
                    text: {
                        fill: "#ffffff",
                        fontSize: 16,
                    },
                },
            },
            legends: {
                text: {
                    fill: "#ffffff",
                },
            },
        }, axisTop: null, axisRight: null, axisBottom: {
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: isDashboard ? undefined : "Society Name",
            legendPosition: "middle",
            legendOffset: 32,
        }, axisLeft: {
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: isDashboard ? undefined : "Number of Members",
            legendPosition: "middle",
            legendOffset: -40,
        }, enableLabel: false, labelSkipWidth: 12, labelSkipHeight: 12, labelTextColor: "#ffffff", legends: [
            {
                dataFrom: "keys",
                anchor: "bottom-right",
                direction: "column",
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: "left-to-right",
                itemOpacity: 0.85,
                symbolSize: 20,
                effects: [
                    {
                        on: "hover",
                        style: {
                            itemOpacity: 1,
                        },
                    },
                ],
            },
        ], role: "application", barAriaLabel: (e) => `${e.id}: ${e.formattedValue} members in society: ${e.indexValue}` }));
};
export default BarChart;
