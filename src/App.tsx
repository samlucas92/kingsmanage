import { BrowserRouter } from "react-router-dom";

import AppRouter from "./routes/AppRouter";
import PwaStatus from "./components/pwa/PwaStatus";
import RealtimeManager from "./components/realtime/RealtimeManager";
import BrandTheme from "./components/branding/BrandTheme";

function App() {
	return (
		<BrowserRouter>
			<BrandTheme />
			<RealtimeManager />
			<AppRouter />
			<PwaStatus />
		</BrowserRouter>
	);
}

export default App;
