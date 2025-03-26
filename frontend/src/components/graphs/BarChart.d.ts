interface BarChartProps {
    data: {
        country: string;
        members: number;
    }[];
    isDashboard?: boolean;
}
declare const BarChart: ({ data, isDashboard }: BarChartProps) => import("react/jsx-runtime").JSX.Element;
export default BarChart;
