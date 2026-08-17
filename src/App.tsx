import { BrowserRouter } from "react-router-dom";

import AppRouter from "./routes/AppRouter";
import PwaStatus from "./components/pwa/PwaStatus";
import RealtimeManager from "./components/realtime/RealtimeManager";
import BrandTheme from "./components/branding/BrandTheme";
import ChunkLoadBoundary from "./components/routing/ChunkLoadBoundary";

function App() {
	return (
		<ChunkLoadBoundary>
			<BrowserRouter>
				<BrandTheme />
				<RealtimeManager />
				<AppRouter />
				<PwaStatus />
			</BrowserRouter>
		</ChunkLoadBoundary>
	);
}

export default App;
