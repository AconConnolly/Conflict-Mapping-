import { Routes, Route } from "react-router-dom";
import Syria from "./ConflictPages/Syria";
import Home from "./GeneralPages/Home";

function App(props) {
  return (
    <Routes>
      <Route path="/" element={<Home />}/>
      <Route path="/yria" element={<Syria />} />
    </Routes>
    
  );
}

export default App;
