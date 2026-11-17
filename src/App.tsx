import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Library from './pages/Library'
import AddWord from './pages/AddWord'
import EditWord from './pages/EditWord'
import Quiz from './pages/Quiz'
import More from './pages/More'
import Story from './pages/Story'
import Import from './pages/Import'
import Backup from './pages/Backup'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="library" element={<Library />} />
        <Route path="add" element={<AddWord />} />
        <Route path="words/:id/edit" element={<EditWord />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="more" element={<More />} />
        <Route path="story" element={<Story />} />
        <Route path="import" element={<Import />} />
        <Route path="backup" element={<Backup />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
