import { TwinDashboard } from "./components/TwinDashboard";
import { baselineTwin } from "../lib/twin-data";

export default function Home() {
  return <TwinDashboard initialTwin={baselineTwin} />;
}
