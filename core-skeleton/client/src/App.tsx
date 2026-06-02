import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { OnboardPage } from "./pages/OnboardPage";
import { PatientDetailPage } from "./pages/PatientDetailPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/onboard" element={<OnboardPage />} />
          <Route path="/patients/:id" element={<PatientDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
