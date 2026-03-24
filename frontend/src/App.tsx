import { Navigate, Route, Routes } from "react-router-dom";
import { AdsListPage } from "./pages/AdsListPage";
import { AdDetailsPage } from "./pages/AdDetailsPage";
import { AdEditPage } from "./pages/AdEditPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/ads" replace />} />
      <Route path="/ads" element={<AdsListPage />} />
      <Route path="/ads/:id" element={<AdDetailsPage />} />
      <Route path="/ads/:id/edit" element={<AdEditPage />} />
    </Routes>
  );
}
