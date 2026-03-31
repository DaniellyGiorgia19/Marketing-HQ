import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import BusinessDashboard from './pages/BusinessDashboard'
import BrandIntelligence from './pages/BrandIntelligence'
import CampaignManager from './pages/CampaignManager'
import ContentCalendar from './pages/ContentCalendar'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<BusinessDashboard />} />
        <Route path="brand" element={<BrandIntelligence />} />
        <Route path="campaigns" element={<CampaignManager />} />
        <Route path="calendar" element={<ContentCalendar />} />
      </Route>
    </Routes>
  )
}

export default App
