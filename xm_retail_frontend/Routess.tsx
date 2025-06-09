import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ProductList from "./src/Components/Cards/productslistcards"; // ✅
import App from "./src/App";
import Login from "./src/Components/Login/Login";
import ProtectedRoute from "./src/Components/ProtectedRoute";
import Home from "./src/Components/Login/Home";
import Profile from "./src/Components/Profile/Profile";
import CardDetails from "./src/Components/Cards/CardDetails";
import AdminLogin from "./src/Components/Admin/AdminLogin";
import AdminProtectedRoute from "./src/Components/AdminProtectedRoute";
import DashBoard from "./src/Components/Admin/DashBoard";
//import ProductDetails from "./src/Components/Cards/productdetails";
import ProductDetailsPage from "./src/Components/prodetailsorder/ProductDetailsPage";

import CartPage from "./src/Components/Cart/CartPage";
import LocationSelectPage from './src/Components/LocationPermission/LocationSelectPage'
import EntryCard from "./src/Components/Cards/entry";

function Routess() {
  return (
    <Router>
      <Routes>
        


        <Route path="/" element={<EntryCard />}/>
       
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<App/>}/>

        {/* User Protected Routes */}
        <Route element={<ProtectedRoute />}>
        
          {/* <Route path="/home" element={<Home />} />  */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/cards/:id" element={<CardDetails />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin/dashboard" element={<DashBoard />} />
        </Route>

        {/* ✅ Add ProductList route here */}
        <Route path="/products/:categoryId" element={<ProductList />} />
        {/* //<Route path="/product/:productSku" element={<ProductDetails />} /> */}
         <Route path="/product/:productSku" element={<ProductDetailsPage/>}/>
         <Route path="/cart" element={<CartPage/>} />
         <Route path="/location-select" element={<LocationSelectPage />} /> 

        {/* Add other routes here */}
      </Routes>
    </Router>
  );
}

export default Routess;
