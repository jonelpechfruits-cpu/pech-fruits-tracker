import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { FiSearch, FiLogOut, FiPackage, FiTruck, FiClock, FiAlertCircle } from 'react-icons/fi';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailMap, setEmailMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Load email map
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/data/email-consignee-map.js';
    script.async = true;
    script.onload = () => {
      if (window.EMAIL_CONSIGNEE_MAP) {
        console.log('Map loaded:', window.EMAIL_CONSIGNEE_MAP);
        setEmailMap(window.EMAIL_CONSIGNEE_MAP);
      }
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  // Load shipments + filtering
  useEffect(() => {
    if (user && Object.keys(emailMap).length > 0) {
      setLoading(true);
      fetch('/data/shipments.json')
        .then(res => res.json())
        .then(data => {
          const userEmail = user.email.toLowerCase();
          const userConsignee = emailMap[userEmail];

          if (!userConsignee) {
            setShipments([]); setFilteredShipments([]); setLoading(false);
            return;
          }

          let filtered = data;
          if (userConsignee !== "ALL") {
            filtered = data.filter(row =>
              (row['CONSIGNEE'] || '').trim().toUpperCase() === userConsignee.trim().toUpperCase()
            );
          }

          setShipments(filtered);
          setFilteredShipments(filtered);
          setLoading(false);
        });
    }
  }, [user, emailMap]);

  // Search functionality
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredShipments(shipments);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredShipments(shipments.filter(row =>
        Object.values(row).some(val =>
          val.toString().toLowerCase().includes(term)
        )
      ));
    }
  }, [searchTerm, shipments]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const uc = await signInWithEmailAndPassword(auth, email, password);
        setUser(uc.user);
      } else {
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        setUser(uc.user);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const userConsignee = user ? emailMap[user.email.toLowerCase()] || 'Restricted' : '';

  const total = filteredShipments.length;
  const delayed = filteredShipments.filter(s => s.STATUS?.includes('Delayed')).length;
  const onTime = total > 0 ? Math.round(((total - delayed) / total) * 100) : 0;

  const centeredColumns = ['REF', 'INV', 'STATUS', 'POL', 'POD', 'ETD', 'LIVE ETA', 'DOCS'];

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        {/* Sticky Professional Nav */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-green-600 rounded-lg mr-3"></div>
                <h1 className="text-2xl font-bold text-gray-800">Pech Fruits Tracker</h1>
              </div>
              <div className="flex items-center space-x-6">
                <a href="#" className="text-gray-700 font-medium hover:text-orange-600 transition">Dashboard</a>
                <a href="#" className="text-orange-600 font-semibold border-b-2 border-orange-600">Shipments</a>
                <a href="#" className="text-gray-700 font-medium hover:text-orange-600 transition">Documents</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {userConsignee === "ALL" ? "ALL CLIENTS" : userConsignee}
              </span>
              <button
                onClick={() => auth.signOut().then(() => setUser(null))}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                <FiLogOut /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Shipments</p>
                  <p className="text-3xl font-bold text-gray-800">{total}</p>
                </div>
                <FiPackage className="text-4xl text-orange-500 opacity-80" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">On Time</p>
                  <p className="text-3xl font-bold text-green-600">{onTime}%</p>
                </div>
                <FiTruck className="text-4xl text-green-500 opacity-80" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Delayed</p>
                  <p className="text-3xl font-bold text-red-600">{delayed}</p>
                </div>
                <FiAlertCircle className="text-4xl text-red-500 opacity-80" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">This Week</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {filteredShipments.filter(s => {
                      const eta = s['LIVE ETA'];
                      if (!eta) return false;
                      const diff = (new Date(eta) - new Date()) / (1000*60*60*24);
                      return diff >= 0 && diff <= 7;
                    }).length}
                  </p>
                </div>
                <FiClock className="text-4xl text-blue-500 opacity-80" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
            <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3">
              <FiSearch className="text-gray-400 text-xl mr-3" />
              <input
                type="text"
                placeholder="Search by container, vessel, reference, product..."
                className="w-full bg-transparent outline-none text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-orange-600 to-green-700 px-8 py-5">
              <h2 className="text-2xl font-bold text-white">Live Shipments</h2>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading shipments...</div>
            ) : filteredShipments.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No shipments found {searchTerm && `for "${searchTerm}"`}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      {Object.keys(filteredShipments[0]).map(header => {
                        const width = {
                          'NR': 60, 'VESSEL': 220, 'CONTAINER': 150, 'REF': 100,
                          'INV': 110, 'STATUS': 130, 'CONSIGNEE': 220, 'PRODUCTS': 240,
                          'POL': 130, 'POD': 130, 'ETD': 120, 'LIVE ETA': 120, 'DOCS': 80
                        }[header] || 140;

                        const centered = centeredColumns.includes(header);

                        return (
                          <th
                            key={header}
                            style={{ minWidth: width + 'px', width: width + 'px' }}
                            className={`px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider ${centered ? 'text-center' : ''}`}
                          >
                            {header}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredShipments.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        {Object.entries(row).map(([key, cell]) => {
                          const centered = centeredColumns.includes(key);
                          const isStatus = key === 'STATUS';
                          const statusColor = isStatus
                            ? cell.includes('Delayed') ? 'text-red-600 bg-red-50' :
                              cell.includes('On Time') ? 'text-green-600 bg-green-50' :
                              'text-blue-600 bg-blue-50'
                            : '';

                          return (
                            <td
                              key={key}
                              className={`px-6 py-4 text-sm ${centered ? 'text-center' : ''} ${isStatus ? statusColor + ' font-medium rounded-full mx-2' : 'text-gray-800'}`}
                            >
                              {cell}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-16 text-center text-gray-500 text-sm">
            <p>© 2025 Pech Fruits (Pty) Ltd. All rights reserved. | Professional shipment tracking portal</p>
          </footer>
        </div>
      </div>
    );
  }

  // Login Screen (clean & professional)
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-green-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-green-600 rounded-2xl mx-auto mb-4"></div>
          <h1 className="text-3xl font-bold text-gray-800">Pech Fruits Tracker</h1>
          <p className="text-gray-600 mt-2">Sign in to access your shipments</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <input
            type="email" placeholder="Email address" required
            value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 transition"
          />
          <input
            type="password" placeholder="Password" required
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 transition"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-green-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          {isLogin ? "Don't have access? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-orange-600 font-bold hover:underline">
            {isLogin ? 'Contact us' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default App;
