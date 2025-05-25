import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./screens/home/Home";
import FilesScreen from "./screens/files-screen/FilesScreen";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/files" element={<FilesScreen />} />
    </Routes>
  );
}

export default App;
