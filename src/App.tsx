import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import AgentPanel from './pages/AgentPanel';
import PropertyForm from './pages/PropertyForm';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/propiedades" element={<Home />} />
            <Route path="/propiedad/:id" element={<PropertyDetail />} />
            <Route path="/agent" element={<AgentPanel />} />
            <Route path="/agent/nueva-propiedad" element={<PropertyForm />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
