import { Link } from "react-router-dom";

interface CardProps {
  card: {
    id: string;
    name: string;
    image: string;
    category: string;
    cashback: string;
  };
}

const Card: React.FC<CardProps> = ({ card }) => {
  const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;

  return (
    <Link to={`/cards/${card.id}`} className="w-full flex justify-center">
      <div className="border p-4 rounded-xl shadow-lg bg-white flex flex-col items-center w-[220px] h-[220px] transition-all hover:shadow-2xl cursor-pointer">
        <img
          src={`${apiUrl}/uploads/${card.image}`}
          alt={card.name}
          className="w-20 h-20 object-contain mb-1"
        />
        <p className="text-xs text-gray-500">{card.category}</p>
        <h2 className="text-sm font-semibold text-center text-blue-900 truncate">
          {card.name}
        </h2>
        <p className="text-green-600 font-bold mt-1 text-sm">{card.cashback}% Off</p>
      </div>
    </Link>
  );
};

export default Card;
