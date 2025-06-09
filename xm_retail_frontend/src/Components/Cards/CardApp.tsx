import { useEffect, useState } from "react";
import Card from "./Card";
import axios from "axios";
 // Import custom CSS for animation

interface CardType {
  id: string;
  name: string;
  image: string;
  category: string;
  cashback: string;
}

interface CardAppProps {
  selectedCategory: string;
}

const CardApp: React.FC<CardAppProps> = ({ selectedCategory }) => {
  const [cards, setCards] = useState<CardType[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;

  useEffect(() => {
    axios.get(`${apiUrl}/api/cards`).then((res) => {
      setCards(res.data);
    });
  }, []);

  const filteredCards = selectedCategory
    ? cards.filter((card) => card.category === selectedCategory)
    : cards;

  const visibleCards = filteredCards.slice(0, visibleCount);

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-6 text-center">Most Popular Brands</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0">
        {visibleCards.map((card) => (
          <div key={card.id} className="h-56 flex items-center justify-center">
            <Card card={card} />
          </div>
        ))}
      </div>

      {visibleCount < filteredCards.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount(filteredCards.length)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-blue-800 transition"
          >
            Show More
          </button>
        </div>
      )}
    </div>
  );
};

export default CardApp;
