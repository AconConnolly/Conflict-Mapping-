import { Routes, Route } from "react-router-dom";
import Syria from "./ConflictPages/Syria";
import Home from "./GeneralPages/Home";
import { ImageList } from "@mui/material";

function App(props) {
  return (
    <Routes>
      <Route path="/" element={<Home />}/>
      <Route path="/syria" element={<Syria />} />
      
    </Routes>
    
  );
}

export default App;
