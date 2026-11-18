import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Library from './pages/Library'
import AddWord from './pages/AddWord'
import EditWord from './pages/EditWord'
import Quiz from './pages/Quiz'
import More from './pages/More'
import Story from './pages/Story'
import Backup from './pages/Backup'
import Account from './pages/Account'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="library" element={<Library />} />
        <Route path="add" element={<AddWord />} />
        <Route path="words/:id/edit" element={<EditWord />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="more" element={<More />} />
        <Route path="story" element={<Story />} />
        <Route path="backup" element={<Backup />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
