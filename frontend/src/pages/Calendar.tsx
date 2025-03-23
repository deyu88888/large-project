import { Box } from "@mui/material";
import EventCalendar from "../components/EventCalendar";

export default function Calendar(){
    return <Box sx={{padding: 2}}>
    <EventCalendar events={[]}/>
    </Box>
}