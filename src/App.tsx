import { BrowserRouter } from "react-router-dom";

import AppRouter from "./routes/AppRouter";
import PwaStatus from "./components/pwa/PwaStatus";

function App() {
	return (
		<BrowserRouter>
			<AppRouter />
			<PwaStatus />
		</BrowserRouter>
	);
}

export default App;
