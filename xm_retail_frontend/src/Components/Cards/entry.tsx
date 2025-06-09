import React from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../NavBar/Nav';

const EntryCard: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <Nav />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div 
          className="max-w-md w-full p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-105 animate-scale-in relative overflow-hidden group"
          onClick={handleClick}
        >
          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none"></div>
          
          <div className="text-center space-y-6 relative z-10">
            <div className="animate-float">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#ff6726] to-[#FFB74D] bg-clip-text text-transparent">
                Welcome to XM Retail
              </h1>
            </div>
            
            <div className="w-24 h-1 bg-gradient-to-r from-[#ff6726] to-[#FFB74D] mx-auto rounded-full animate-pulse"></div>
            
            <p className="text-gray-600 text-lg mb-8 animate-fade-in-up">
              Discover our amazing collection of products. Click here to start shopping!
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl transform hover:scale-105 transition-all duration-300 animate-slide-in hover:shadow-lg">
                <span className="text-blue-600 font-bold text-xl block mb-1">1000+</span>
                <p className="text-sm text-gray-600">Products</p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl transform hover:scale-105 transition-all duration-300 animate-slide-in [animation-delay:200ms] hover:shadow-lg">
                <span className="text-green-600 font-bold text-xl block mb-1">24/7</span>
                <p className="text-sm text-gray-600">Support</p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl transform hover:scale-105 transition-all duration-300 animate-slide-in [animation-delay:400ms] hover:shadow-lg">
                <span className="text-purple-600 font-bold text-xl block mb-1">Fast</span>
                <p className="text-sm text-gray-600">Delivery</p>
              </div>
            </div>

            <div className="mt-8">
              <button className="bg-gradient-to-r from-[#ff6726] to-[#FFB74D] text-white font-semibold py-3 px-8 rounded-full transform hover:scale-105 transition-all duration-300 hover:shadow-lg animate-glow group-hover:animate-none">
                Start Shopping →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryCard;
