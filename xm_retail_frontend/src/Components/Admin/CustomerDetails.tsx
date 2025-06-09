import React, { useEffect, useState } from "react";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

const CustomerData: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await fetch("http://localhost:4000/cust/data/");
        const data = await response.json();

        if (data.success) {
          setCustomers(data.data);
        } else {
          setError("No customers found.");
        }
      } catch (err) {
        setError("Error fetching data.");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-2 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center text-gray-800">
        Customer List
      </h2>

      {loading ? (
        <p className="text-center">Loading customer data...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse shadow rounded-lg bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">
                    ID
                  </th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">
                    Phone
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="py-2 px-4">{customer.id}</td>
                    <td className="py-2 px-4">{customer.name}</td>
                    <td className="py-2 px-4">{customer.email}</td>
                    <td className="py-2 px-4">{customer.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card/List */}
          <div className="md:hidden space-y-4">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white rounded-lg shadow p-4"
              >
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-gray-700">ID:</span>
                  <span>{customer.id}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700">Name:</span>
                  <span>{customer.name}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700">Email:</span>
                  <span>{customer.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-700">Phone:</span>
                  <span>{customer.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerData;
