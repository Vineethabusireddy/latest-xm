import { useEffect, useState } from "react";

import { Link } from "react-router-dom";
import axios from "axios";

interface CardDetailsType {
  id: string;
  name: string;
  image: string;
  category: string;
  cashback: string;
  price: number;
  amounts: number[];
  discountedPrice: number;
  validityMonths: number;
}

const SimilarCards = ({ category, currentCardId }: { category: string; currentCardId: string }) => {
  const [similarCards, setSimilarCards] = useState<CardDetailsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiUrl =import.meta.env.VITE_APP_SERVER_BASE_URL;
  useEffect(() => {
    const fetchSimilarCards = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/cards/category/${category}`);
        // Filter out the current card
        const filteredCards = response.data.filter((card: CardDetailsType) => card.id !== currentCardId);
        setSimilarCards(filteredCards);
      } catch (err) {
        if (err instanceof Error) {
          setError(`Failed to fetch similar cards: ${err.message}`);
        } else {
          setError("Failed to fetch similar cards");
        }
      }
       finally {
        setLoading(false);
      }
    };

    fetchSimilarCards();
  }, [category, currentCardId]);

  if (loading) return <p>Loading similar cards...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  

  return (
    
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Similar Products</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {similarCards.map((card) => (
           <Link to={`/cards/${card.id}`} key={card.id}  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div
            key={card.id}
            className="bg-white rounded-lg shadow hover:shadow-lg p-4 flex flex-col items-center text-center"
          >
            <img
              src={`${apiUrl}/uploads/${card.image}`}
              alt={card.name}
              className="w-full h-32 object-contain mb-2"
            />
            <p className="text-sm font-medium text-gray-700">{card.name}</p>
            <p className="text-orange-500 text-sm font-semibold">{card.cashback}% Off</p>
            
          </div>
          </Link>
        ))}
      </div>
    
    </div>
    
  );
};

export default SimilarCards;