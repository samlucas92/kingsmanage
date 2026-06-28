import { BrowserRouter } from "react-router-dom";

import AppRouter from "./routes/AppRouter";
import PwaStatus from "./components/pwa/PwaStatus";
import RealtimeManager from "./components/realtime/RealtimeManager";

function App() {
	return (
		<BrowserRouter>
			<RealtimeManager />
			<AppRouter />
			<PwaStatus />
		</BrowserRouter>
	);
}

export default App;
