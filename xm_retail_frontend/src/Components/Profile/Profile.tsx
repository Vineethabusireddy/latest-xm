import { useEffect, useState } from "react";
import { FaUserCircle, FaTimes } from "react-icons/fa";
import { IoCall } from "react-icons/io5";
import { MdEmail } from "react-icons/md";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import Logo from "../NavBar/assets/Group_1.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Define the Card interface
interface Card {
  orderId: string;
  productName: string;
  amount: number;
  cardNumber: string;
  cardPin: string;
  issuanceDate: string;
  validity: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Immediately redirect if no user is found
  if (!storedUser.email) {
    navigate("/");
    return null;
  }

  const [user, setUser] = useState({ name: "", email: "", phone: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const apiUrl = import.meta.env.VITE_APP_SERVER_BASE_URL;

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/api/user/profile?email=${storedUser.email}`
        );
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
      } catch (error) {
        console.error("Error fetching profile:", error);
        alert("Failed to load profile. Redirecting to login...");
        navigate("/");
      }
    };

    if (storedUser.email) fetchUserProfile();
    else {
      alert("No user data found. Redirecting to login...");
      navigate("/");
    }
  }, [navigate, storedUser.email]);

  // Fetch gift cards
  useEffect(() => {
    const fetchGiftCards = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You are not logged in. Redirecting to login...");
        navigate("/");
        return;
      }
      try {
        const response = await axios.get(`${apiUrl}/api/order/user-orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCards(response.data);
        localStorage.setItem("cards", JSON.stringify(response.data)); // cache
      } catch (error) {
        // On error, try to load from cache
        const cached = localStorage.getItem("cards");
        if (cached) setCards(JSON.parse(cached));
        else setCards([]);
        console.error("Error fetching gift cards:", error);
      }
    };

    fetchGiftCards();
  }, [navigate, apiUrl]);

  // Fetch order count
  useEffect(() => {
    const fetchOrderCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await axios.get(
          `${apiUrl}/api/orders/user-order-count?email=${storedUser.email}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setOrderCount(response.data.count);
        localStorage.setItem("orderCount", response.data.count); // cache
      } catch (error) {
        // On error, try to load from cache
        const cached = localStorage.getItem("orderCount");
        if (cached) setOrderCount(Number(cached));
        else setOrderCount(0);
      }
    };
    if (storedUser.email) fetchOrderCount();
  }, [apiUrl, storedUser.email, navigate]);

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    try {
      await axios.put(`${apiUrl}/api/user/update-profile`, user);
      localStorage.setItem("user", JSON.stringify(user));
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("cards");
    setCards([]);
    window.dispatchEvent(new Event("storage"));
    navigate("/"); // Use React Router navigation for immediate redirect
  };

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
  };

  const closeModal = () => {
    setSelectedCard(null);
  };

  // Calculate totals
  const totalSavings = cards.reduce((total, card) => {
    const originalPrice = card.amount / 0.95; // assuming 5% discount
    return total + (originalPrice - card.amount);
  }, 0);

  // Total number of gift cards
  const totalGiftCards = cards.length;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Breadcrumb */}
      <div className="text-gray-500 text-sm mb-4">
        <span
          className="text-orange-500 cursor-pointer"
          onClick={() => navigate("/home")}
        >
          Home
        </span>{" "}
        / <span className="font-semibold">Profile Page</span>
      </div>

      {/* Profile Section */}
      <div className="bg-white shadow-lg rounded-2xl p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <FaUserCircle className="text-6xl text-gray-400" />
          <div>
            <h2 className="text-xl font-bold">
              Welcome <span className="text-orange-500">{user.name}</span> 👋
            </h2>
            {!isEditing && (
              <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                <IoCall /> {user.phone || "Not Provided"}
                <MdEmail /> {user.email}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded-lg"
            >
              Save Profile
            </button>
          ) : (
            <button
              onClick={handleEdit}
              className="bg-black text-white px-4 py-2 rounded-lg"
            >
              Edit Profile
            </button>
          )}
          <button className="border border-gray-300 px-4 py-2 rounded-lg">
            Contact Us
          </button>
        </div>

        {isEditing && (
          <div className="mt-6">
            <label className="block text-gray-600">Name</label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="w-full border p-2 rounded-lg mt-2"
            />

            <label className="block text-gray-600 mt-4">Email</label>
            <input
              type="text"
              value={user.email}
              className="w-full border p-2 rounded-lg mt-2"
              disabled
            />

            <label className="block text-gray-600 mt-4">Phone</label>
            <input
              type="text"
              value={user.phone}
              onChange={(e) => {
                const input = e.target.value;
                if (/^\d{0,10}$/.test(input)) {
                  setUser({ ...user, phone: input });
                }
              }}
              className="w-full border p-2 rounded-lg mt-2"
            />
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="mt-6 bg-purple-600 text-white p-6 rounded-2xl shadow-lg max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <p className="text-sm">Total Savings</p>
          <h3 className="text-2xl font-bold">₹{totalSavings.toFixed(2)}</h3>
        </div>
        <div>
          <p className="text-sm">Total Bought</p>
          <h3 className="text-2xl font-bold">{cards.length}</h3>
        </div>
        <button className="bg-black text-white px-4 py-2 rounded-lg">
          View Refunds
        </button>
      </div>

      {/* My Gift Cards Section */}
      <div className="mt-6 max-w-4xl mx-auto bg-[#E5E5E5] p-6 rounded-2xl shadow-inner">
        <h3 className="text-xl font-semibold mb-4">My Gift Cards</h3>

        {cards.length === 0 ? (
          <p className="text-center bg-gray-200 p-6 rounded-2xl">
            No gift cards found.
          </p>
        ) : (
          <Carousel
            additionalTransfrom={0}
            arrows
            autoPlaySpeed={3000}
            centerMode={false}
            className=""
            containerClass="container-with-dots"
            dotListClass=""
            draggable
            focusOnSelect={false}
            infinite={false}
            itemClass="px-2"
            keyBoardControl
            minimumTouchDrag={80}
            renderButtonGroupOutside={false}
            renderDotsOutside={false}
            responsive={{
              superLargeDesktop: {
                breakpoint: { max: 4000, min: 1536 },
                items: 4,
              },
              desktop: {
                breakpoint: { max: 1536, min: 1024 },
                items: 3,
              },
              tablet: {
                breakpoint: { max: 1024, min: 768 },
                items: 2,
              },
              mobile: {
                breakpoint: { max: 768, min: 0 },
                items: 1,
              },
            }}
            showDots={false}
            sliderClass=""
            slidesToSlide={1}
            swipeable
          >
            {cards.map((card) => (
              <div
                key={card.orderId}
                className="bg-white rounded-2xl shadow-md p-4 w-full h-full flex flex-col justify-between hover:shadow-lg transition duration-300 cursor-pointer group relative"
                onClick={() => handleCardClick(card)} // Open modal with card details
              >
                <div className="relative">
                  {/* Card Content */}
                  <h4 className="text-lg font-semibold text-gray-800 mb-2 truncate relative z-10">
                    {card.productName}
                  </h4>
                  <p className="text-sm text-gray-600 relative z-10">
                    <span className="font-medium">Issued:</span>{" "}
                    {new Date(card.issuanceDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Logo and Name in Bottom-Right Corner */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10">
                  <img
                    src={Logo} // Replace with the actual path to your logo file
                    alt="Gift Card Logo"
                    className="h-4 w-auto filter grayscale" // Apply grayscale filter to match text color
                  />
                  <span className="text-[10px] font-medium text-gray-400">
                    XM RETAIL
                  </span>
                </div>
              </div>
            ))}
          </Carousel>
        )}
      </div>

      {/* Modal for Card Details */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-11/12 sm:w-2/3 lg:w-1/3 relative"
            style={{
              backgroundImage: `repeating-linear-gradient(
                135deg,
                rgba(128, 128, 128, 0.1),
                rgba(128, 128, 128, 0.1) 10px,
                transparent 10px,
                transparent 20px
              )`,
              backgroundSize: "20px 20px",
            }}
          >
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={closeModal}
            >
              <FaTimes size={20} />
            </button>

            {/* Card Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {selectedCard.productName}
              </h3>
              <p className="text-sm text-gray-500">
                Issued on:{" "}
                {new Date(selectedCard.issuanceDate).toLocaleDateString()}
              </p>
            </div>

            {/* Card Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Amount:</span>
                <span className="text-lg font-semibold text-green-600">
                  ₹{selectedCard.amount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Card Number:</span>
                <span className="font-mono text-blue-700">
                  {selectedCard.cardNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">PIN:</span>
                <span className="font-mono text-red-600">
                  {selectedCard.cardPin}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Valid Till:</span>
                <span className="text-gray-800">
                  {new Date(selectedCard.validity).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex flex-row justify-center gap-3">
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors"
                onClick={async () => {
                  const websiteUrl = window.location.origin;
                  const shareText =
                    `Gift Card Details:\n` +
                    `Product: ${selectedCard.productName}\n` +
                    `Amount: ₹${selectedCard.amount}\n` +
                    `Card Number: ${selectedCard.cardNumber}\n` +
                    `PIN: ${selectedCard.cardPin}\n` +
                    `Valid Till: ${new Date(selectedCard.validity).toLocaleDateString()}\n\n` +
                    `Visit us: ${websiteUrl}`;
                  const shareData = {
                    title: `Gift Card: ${selectedCard.productName}`,
                    text: shareText,
                  };
                  if (navigator.share) {
                    try {
                      await navigator.share(shareData);
                    } catch {
                      alert("Sharing cancelled or failed.");
                    }
                  } else {
                    // Fallback: copy to clipboard
                    try {
                      await navigator.clipboard.writeText(shareText);
                      alert("Card details copied to clipboard!");
                    } catch {
                      alert("Failed to copy card details.");
                    }
                  }
                }}
              >
                Share Card
              </button>
              <button
                className="bg-orange-500 text-white px-3 py-1 rounded-md text-sm hover:bg-orange-600 transition-colors"
                onClick={closeModal}
              >
                Close
              </button>
              {!showInvoicePreview ? (
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200"
                  onClick={() => setShowInvoicePreview(true)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Preview Invoice
                </button>
              ) : (
                <>
                  <button
                    className="bg-gray-700 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200"
                    onClick={() => setShowInvoicePreview(false)}
                  >
                    Close Preview
                  </button>
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200"
                    onClick={async () => {
                      const doc = new jsPDF();

                      // Add your logo (centered)
                      const logoImg = new Image();
                      logoImg.src = Logo;
                      await new Promise((resolve) => {
                        logoImg.onload = resolve;
                      });

                      // Center logo and 'XM RETAIL' text side by side, with smaller logo
                      const logoWidth = 18;
                      const logoHeight = 9;
                      const logoY = 14;
                      const text = "XM RETAIL";
                      doc.setFontSize(14);
                      const textWidth = doc.getTextWidth(text);
                      const totalWidth = logoWidth + 3 + textWidth;
                      const pageWidth = doc.internal.pageSize.getWidth();
                      const startX = (pageWidth - totalWidth) / 2;
                      doc.addImage(logoImg, "PNG", startX, logoY, logoWidth, logoHeight);
                      doc.text(text, startX + logoWidth + 3, logoY + 7);

                      // Title with more spacing
                      doc.setFontSize(18);
                      doc.setFont("helvetica", "bold");
                      doc.text("Bill of Supply", pageWidth / 2, logoY + logoHeight + 14, { align: "center" });
                      doc.setFont("helvetica", "normal");

                      // Draw a line below header
                      doc.setDrawColor(200, 200, 200);
                      doc.line(20, logoY + logoHeight + 18, pageWidth - 20, logoY + logoHeight + 18);

                      // Company Details (left) and Invoice Info (right)
                      doc.setFontSize(10);
                      let detailsY = logoY + logoHeight + 28;
                      
                      // Company Details (left side)
                      doc.text("Xstream Minds Pvt Ltd", 20, detailsY);
                      doc.text("402, Sri Geetanjali Towers, Beside Nexus Mall,", 20, detailsY + 5);
                      doc.text("Kukatpally Housing Board Colony,", 20, detailsY + 10);
                      doc.text("Hyderabad, Telangana, India 500072.", 20, detailsY + 15);

                      // Invoice Info (right side) - Adjusted position
                      const infoX = pageWidth - 80; // Increased distance from right edge
                      doc.text("Invoice Number: " + (selectedCard.orderId || ''), infoX, detailsY);
                      doc.text("Invoice Date: " + (selectedCard.issuanceDate ? new Date(selectedCard.issuanceDate).toLocaleDateString() : ''), infoX, detailsY + 5);
                      doc.text("Payment Method: UPI", infoX, detailsY + 10);

                      // Bill To - Increased spacing from previous section
                      let billToY = detailsY + 30; // Increased spacing
                      doc.setFontSize(12);
                      doc.setFont("helvetica", "bold");
                      doc.text("Bill To:", 20, billToY);
                      doc.setFont("helvetica", "normal");
                      doc.setFontSize(10);
                      doc.text(user.name || '', 20, billToY + 5);
                      doc.text(user.phone || '', 20, billToY + 10);
                      doc.text(user.email || '', 20, billToY + 15); // Added email

                      // Product Table Header - Increased spacing
                      let tableY = billToY + 25; // Increased spacing
                      
                      // Table Header Background
                      doc.setFillColor(255, 153, 0);
                      doc.rect(20, tableY, pageWidth - 40, 10, "F");
                      
                      // Table Header Text
                      doc.setTextColor(0, 0, 0);
                      doc.setFont("helvetica", "bold");
                      doc.text("PRODUCT DESCRIPTION", 22, tableY + 7);
                      doc.text("QUANTITY", pageWidth / 2, tableY + 7, { align: "center" });
                      doc.text("UNIT PRICE", pageWidth - 45, tableY + 7, { align: "right" });
                      doc.setFont("helvetica", "normal");

                      // Product Table Row - Enhanced styling
                      let rowY = tableY + 13;
                      
                      // Add subtle background to row
                      doc.setFillColor(245, 245, 245);
                      doc.rect(20, rowY - 3, pageWidth - 40, 12, "F");
                      
                      // Add border to row
                      doc.setDrawColor(200, 200, 200);
                      doc.rect(20, rowY - 3, pageWidth - 40, 12);
                      
                      // Product details with better spacing
                      doc.setTextColor(80, 80, 80);
                      doc.setFontSize(10);
                      
                      // Product Name with ellipsis if too long
                      const productName = selectedCard.productName || '';
                      const maxWidth = pageWidth / 2 - 45;
                      let displayName = productName;
                      if (doc.getTextWidth(productName) > maxWidth) {
                        while (doc.getTextWidth(displayName + '...') > maxWidth) {
                          displayName = displayName.slice(0, -1);
                        }
                        displayName += '...';
                      }
                      doc.text(displayName, 22, rowY + 3);
                      
                      // Quantity with centered alignment
                      doc.text("1", pageWidth / 2, rowY + 3, { align: "center" });
                      
                      // Price with right alignment and currency symbol
                      const price = Number(selectedCard.amount || 0).toLocaleString("en-IN");
                      doc.text(price, pageWidth - 45, rowY + 3, { align: "right" });
                      
                      // Reset text color for next section
                      doc.setTextColor(0, 0, 0);
                      doc.setFontSize(12);

                      // Amounts Section - Increased spacing
                      let amountsY = rowY + 20; // Adjusted spacing after table row
                      
                      // Draw a line above amounts section
                      doc.setDrawColor(200, 200, 200);
                      doc.line(20, amountsY - 5, pageWidth - 20, amountsY - 5);
                      
                      // Amount details with proper formatting
                      doc.setFontSize(11);
                      doc.text("Amount (INR):", pageWidth / 2, amountsY, { align: "center" });
                      const amount = Number(selectedCard.amount || 0).toLocaleString("en-IN");
                      doc.text(amount, pageWidth - 45, amountsY, { align: "right" });
                      
                      // Net Amount with bold formatting
                      doc.setFontSize(12);
                      doc.setFont("helvetica", "bold");
                      doc.text("Net Amount Paid (INR):", pageWidth / 2, amountsY + 15, { align: "center" });
                      const netAmount = Number(selectedCard.amount || 0).toLocaleString("en-IN");
                      doc.text(netAmount, pageWidth - 45, amountsY + 15, { align: "right" });
                      doc.setFont("helvetica", "normal");
                      
                      // Draw a line below amounts section
                      doc.setDrawColor(200, 200, 200);
                      doc.line(20, amountsY + 25, pageWidth - 20, amountsY + 25);

                      // Add more space before footer
                      const footerY = amountsY + 45; // Increased from 40 to 45

                      // Footer - Adjusted position with more spacing
                      doc.setFontSize(10);
                      doc.text("Thank you for your business!", pageWidth / 2, footerY, { align: "center" });

                      // Save PDF
                      doc.save(`GiftCard_Invoice_${selectedCard.orderId}.pdf`);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Download Invoice
                  </button>
                </>
              )}
            </div>
            {/* Invoice Preview Modal */}
            {showInvoicePreview && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl shadow-2xl relative">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                    onClick={() => setShowInvoicePreview(false)}
                  >
                    <FaTimes size={18} />
                  </button>
                  <h3 className="text-lg font-bold mb-4 text-center">Invoice Preview</h3>
                  <div className="border rounded p-4 bg-gray-50 text-sm mb-4">
                    <div className="flex items-center justify-center mb-2">
                      <img src={Logo} alt="Logo" className="h-6 mr-2" />
                      <span className="font-bold text-base">XM RETAIL</span>
                    </div>
                    <div className="text-center font-bold text-lg mb-2">Bill of Supply</div>
                    <div className="flex justify-between mb-1">
                      <span>Invoice Number:</span>
                      <span>{selectedCard.orderId}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Invoice Date:</span>
                      <span>{new Date(selectedCard.issuanceDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Payment Method:</span>
                      <span>UPI</span>
                    </div>
                    <div className="mt-2 font-semibold">Bill To:</div>
                    <div className="ml-2 text-gray-700">
                      <div>{user.name}</div>
                      <div>{user.phone}</div>
                      <div>{user.email}</div>
                    </div>
                    <div className="mt-3 border-t pt-2">
                      <div className="flex justify-between">
                        <span>Product:</span>
                        <span>{selectedCard.productName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span>1</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unit Price:</span>
                        <span>₹{selectedCard.amount}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Net Amount Paid:</span>
                        <span>₹{selectedCard.amount}</span>
                      </div>
                    </div>
                    <div className="mt-4 text-center text-xs text-gray-500">
                      Thank you for your business!
                    </div>
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200"
                      onClick={async () => {
                        const doc = new jsPDF();

                        // Add your logo (centered)
                        const logoImg = new Image();
                        logoImg.src = Logo;
                        await new Promise((resolve) => {
                          logoImg.onload = resolve;
                        });

                        // Center logo and 'XM RETAIL' text side by side, with smaller logo
                        const logoWidth = 18;
                        const logoHeight = 9;
                        const logoY = 14;
                        const text = "XM RETAIL";
                        doc.setFontSize(14);
                        const textWidth = doc.getTextWidth(text);
                        const totalWidth = logoWidth + 3 + textWidth;
                        const pageWidth = doc.internal.pageSize.getWidth();
                        const startX = (pageWidth - totalWidth) / 2;
                        doc.addImage(logoImg, "PNG", startX, logoY, logoWidth, logoHeight);
                        doc.text(text, startX + logoWidth + 3, logoY + 7);

                        // Title with more spacing
                        doc.setFontSize(18);
                        doc.setFont("helvetica", "bold");
                        doc.text("Bill of Supply", pageWidth / 2, logoY + logoHeight + 14, { align: "center" });
                        doc.setFont("helvetica", "normal");

                        // Draw a line below header
                        doc.setDrawColor(200, 200, 200);
                        doc.line(20, logoY + logoHeight + 18, pageWidth - 20, logoY + logoHeight + 18);

                        // Company Details (left) and Invoice Info (right)
                        doc.setFontSize(10);
                        let detailsY = logoY + logoHeight + 28;
                        
                        // Company Details (left side)
                        doc.text("Xstream Minds Pvt Ltd", 20, detailsY);
                        doc.text("402, Sri Geetanjali Towers, Beside Nexus Mall,", 20, detailsY + 5);
                        doc.text("Kukatpally Housing Board Colony,", 20, detailsY + 10);
                        doc.text("Hyderabad, Telangana, India 500072.", 20, detailsY + 15);

                        // Invoice Info (right side) - Adjusted position
                        const infoX = pageWidth - 80; // Increased distance from right edge
                        doc.text("Invoice Number: " + (selectedCard.orderId || ''), infoX, detailsY);
                        doc.text("Invoice Date: " + (selectedCard.issuanceDate ? new Date(selectedCard.issuanceDate).toLocaleDateString() : ''), infoX, detailsY + 5);
                        doc.text("Payment Method: UPI", infoX, detailsY + 10);

                        // Bill To - Increased spacing from previous section
                        let billToY = detailsY + 30; // Increased spacing
                        doc.setFontSize(12);
                        doc.setFont("helvetica", "bold");
                        doc.text("Bill To:", 20, billToY);
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(10);
                        doc.text(user.name || '', 20, billToY + 5);
                        doc.text(user.phone || '', 20, billToY + 10);
                        doc.text(user.email || '', 20, billToY + 15); // Added email

                        // Product Table Header - Increased spacing
                        let tableY = billToY + 25; // Increased spacing
                        
                        // Table Header Background
                        doc.setFillColor(255, 153, 0);
                        doc.rect(20, tableY, pageWidth - 40, 10, "F");
                        
                        // Table Header Text
                        doc.setTextColor(0, 0, 0);
                        doc.setFont("helvetica", "bold");
                        doc.text("PRODUCT DESCRIPTION", 22, tableY + 7);
                        doc.text("QUANTITY", pageWidth / 2, tableY + 7, { align: "center" });
                        doc.text("UNIT PRICE", pageWidth - 45, tableY + 7, { align: "right" });
                        doc.setFont("helvetica", "normal");

                        // Product Table Row - Enhanced styling
                        let rowY = tableY + 13;
                        
                        // Add subtle background to row
                        doc.setFillColor(245, 245, 245);
                        doc.rect(20, rowY - 3, pageWidth - 40, 12, "F");
                        
                        // Add border to row
                        doc.setDrawColor(200, 200, 200);
                        doc.rect(20, rowY - 3, pageWidth - 40, 12);
                        
                        // Product details with better spacing
                        doc.setTextColor(80, 80, 80);
                        doc.setFontSize(10);
                        
                        // Product Name with ellipsis if too long
                        const productName = selectedCard.productName || '';
                        const maxWidth = pageWidth / 2 - 45;
                        let displayName = productName;
                        if (doc.getTextWidth(productName) > maxWidth) {
                          while (doc.getTextWidth(displayName + '...') > maxWidth) {
                            displayName = displayName.slice(0, -1);
                          }
                          displayName += '...';
                        }
                        doc.text(displayName, 22, rowY + 3);
                        
                        // Quantity with centered alignment
                        doc.text("1", pageWidth / 2, rowY + 3, { align: "center" });
                        
                        // Price with right alignment and currency symbol
                        const price = Number(selectedCard.amount || 0).toLocaleString("en-IN");
                        doc.text(price, pageWidth - 45, rowY + 3, { align: "right" });
                        
                        // Reset text color for next section
                        doc.setTextColor(0, 0, 0);
                        doc.setFontSize(12);

                        // Amounts Section - Increased spacing
                        let amountsY = rowY + 20; // Adjusted spacing after table row
                        
                        // Draw a line above amounts section
                        doc.setDrawColor(200, 200, 200);
                        doc.line(20, amountsY - 5, pageWidth - 20, amountsY - 5);
                        
                        // Amount details with proper formatting
                        doc.setFontSize(11);
                        doc.text("Amount (INR):", pageWidth / 2, amountsY, { align: "center" });
                        const amount = Number(selectedCard.amount || 0).toLocaleString("en-IN");
                        doc.text(amount, pageWidth - 45, amountsY, { align: "right" });
                        
                        // Net Amount with bold formatting
                        doc.setFontSize(12);
                        doc.setFont("helvetica", "bold");
                        doc.text("Net Amount Paid (INR):", pageWidth / 2, amountsY + 15, { align: "center" });
                        const netAmount = Number(selectedCard.amount || 0).toLocaleString("en-IN");
                        doc.text(netAmount, pageWidth - 45, amountsY + 15, { align: "right" });
                        doc.setFont("helvetica", "normal");
                        
                        // Draw a line below amounts section
                        doc.setDrawColor(200, 200, 200);
                        doc.line(20, amountsY + 25, pageWidth - 20, amountsY + 25);

                        // Add more space before footer
                        const footerY = amountsY + 45; // Increased from 40 to 45

                        // Footer - Adjusted position with more spacing
                        doc.setFontSize(10);
                        doc.text("Thank you for your business!", pageWidth / 2, footerY, { align: "center" });

                        // Save PDF
                        doc.save(`GiftCard_Invoice_${selectedCard.orderId}.pdf`);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      Download Invoice
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Section */}
      <div className="mt-6 max-w-4xl mx-auto text-gray-600 text-sm flex justify-between items-center">
        <div>
          <p>Terms of Service</p>
          <p>Privacy Policy</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
    </div>
  );
}