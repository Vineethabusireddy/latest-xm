import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import axios from "axios";

const categories = [
  "BIGGEST SALES", "BANKING", "HOTELS & FLIGHTS", "ELECTRONICS",
  "MOBILES", "FASHION", "BEAUTY & GROOMING", "HEALTH & WELLNESS",
  "PHARMACY", "HOME & KITCHEN", "EDUCATION", "FOOD & GROCERY",
  "HOSTING", "DEPARTMENTAL"
];

interface FormDataType {
  name: string;
  image: File | null;
  cashback: number;
  category: string;
  details: string;
  validityMonths: string;
  amounts: string;
}

interface CardType {
  id: string;
  name: string;
  image?: string;
  cashback: number;
  category: string;
  details: string;
  validityMonths: number;
  amounts: number[];
}

const CardAdmin = () => {
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    image: null,
    cashback: 0,
    category: "",
    details: "",
    validityMonths: "",
    amounts: "",
  });

  const [cards, setCards] = useState<CardType[]>([]);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;

  const fetchCards = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/cards`);
      setCards(response.data);
    } catch (error) {
      console.error("Error fetching cards:", error);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "cashback" ? Number(value) : value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        const value = formData[key as keyof typeof formData];
        if (key === "image" && !value) return;
        data.append(key, value as string | Blob);
      });

      if (editingCard) {
        await axios.put(`${apiUrl}/api/cards/${editingCard}`, data);
        alert(`Card "${formData.name}" updated successfully!`);
      } else {
        await axios.post(`${apiUrl}/api/cards`, data);
        alert(`Card "${formData.name}" added successfully!`);
      }

      setFormData({
        name: "",
        image: null,
        cashback: 0,
        category: "",
        details: "",
        validityMonths: "",
        amounts: "",
      });

      setShowForm(false);
      setEditingCard(null);
      fetchCards();
    } catch (error) {
      console.error("Error saving card:", error);
    }
  };

  const handleEdit = (card: CardType) => {
    setEditingCard(card.id);
    setFormData({
      name: card.name,
      image: null,
      cashback: card.cashback,
      category: card.category,
      details: card.details,
      validityMonths: card.validityMonths.toString(),
      amounts: card.amounts.join(", "),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement | null;
      if (nameInput) nameInput.focus();
    }, 100);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await axios.delete(`${apiUrl}/api/cards/${id}`);
      alert(`Card "${name}" deleted!`);
      fetchCards();
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  return (
    <div className="p-5 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Cards Dashboard</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 hover:bg-blue-600">
          <FiPlus /> <span>{showForm ? "Hide Form" : "Add Item"}</span>
        </button>

        {showForm && (
          <div className="bg-white p-6 rounded-lg mt-5 shadow-md mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" name="name" placeholder="Brand Name" className="border p-2 w-full rounded" onChange={handleChange} value={formData.name} />
              <input type="file" name="image" className="border p-2 w-full rounded" onChange={handleFileChange} />
              <input type="text" name="cashback" placeholder="Cashback %" className="border p-2 w-full rounded" onChange={handleChange} value={formData.cashback} />
              
              <select name="category" onChange={handleChange} value={formData.category} className="border p-2 w-full rounded">
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <input type="number" name="validityMonths" placeholder="Validity (in months)" className="border p-2 w-full rounded" onChange={handleChange} value={formData.validityMonths} />
              <input type="text" name="amounts" placeholder="Amounts (comma-separated)" className="border p-2 w-full rounded" onChange={handleChange} value={formData.amounts} />
              
              <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-lg">
                {editingCard ? "Update Card" : "Add Card"}
              </button>
            </form>
          </div>
        )}

        <h3 className="text-xl font-bold mt-8">Cards List</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-5">
          {cards.map((card) => (
            <div key={card.id} className="bg-white p-4 rounded-lg shadow-md flex flex-col">
              <img
                src={`${apiUrl}/uploads/${card.image}`}
                alt={card.name}
                className="w-full h-40 sm:h-48 object-cover rounded-md mb-2"
              />
              <h4 className="font-bold mt-2 text-base sm:text-lg">{card.name}</h4>
              <p className="text-xs sm:text-sm">Category: {card.category}</p>
              <p className="text-xs sm:text-sm">Cashback: {card.cashback}%</p>
              <p className="text-xs sm:text-sm">Validity: {card.validityMonths} months</p>
              <p className="text-xs sm:text-sm break-words">Amounts: {card.amounts.join(", ")}</p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <button
                  onClick={() => handleEdit(card)}
                  className="bg-yellow-500 text-white px-3 py-2 rounded text-sm w-full sm:w-auto"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(card.id, card.name)}
                  className="bg-red-500 text-white px-3 py-2 rounded text-sm w-full sm:w-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardAdmin;