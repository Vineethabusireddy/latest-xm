import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import Login from "./Components/Login/Login";

// import Welcome from "./Components/NavBar/Welcome";

function Sample() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/welcome" element={<Welcome />} /> */}
      </Routes>
    </Router>
  );
}

export default Sample;
