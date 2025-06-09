import CardApp from "./Components/Cards/CardApp";
import Categorycards from "./Components/Cards/categorycards";
// import ProductDetails from "./Components/Cards/productdetails";
// import ProductList from "./Components/Cards/productslistcards";
import Product from "./Components/Cards/CatalogCards";
import Carousel from "./Components/Carousel/Carousels";
import Category from "./Components/categories/Category";
import Nav from "./Components/NavBar/Nav";
import { useState } from "react";

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      
        <Carousel />
        <Category setSelectedCategory={setSelectedCategory} />
        <CardApp selectedCategory={selectedCategory} />
        {/* <ProductDetails /> */}
        <Categorycards />
        <Product />
      </div>
   
  );
};

export default App;
