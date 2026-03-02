import { Routes, Route } from "react-router-dom";
import Base from "./pages/start/Base.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Base />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}