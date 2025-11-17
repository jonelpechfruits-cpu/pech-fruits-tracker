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
      if (window.EMAIL_CONSIGNEE_MAP) setEmailMap(window.EMAIL_CONSIGNEE_MAP);
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  // Load shipments
  useEffect(() => {
    if (user && Object.keys(emailMap).length > 0) {
      setLoading(true);
      fetch('/data/shipments.json')
        .then(r => r.json())
        .then(data => {
          const userEmail = user.email.toLowerCase();
          const consignee = emailMap[userEmail];
          let filtered = data;
          if (consignee && consignee !== "ALL") {
            filtered = data.filter(row => (row['CONSIGNEE'] || '').trim().toUpperCase() === consignee.trim().toUpperCase());
          }
          setShipments(filtered);
          setFilteredShipments(filtered);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user, emailMap]);

  // Search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredShipments(shipments);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredShipments(shipments.filter(row =>
        Object.values(row).some(v => v.toString().toLowerCase().includes(term))
      ));
    }
  }, [searchTerm, shipments]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const uc = isLogin
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);
      setUser(uc.user);
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
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-green-100">
        {/* PERFECT PROFESSIONAL TOP BAR */}
        <header className="sticky top-0 z-50 bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center space-x-12">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-green-600 rounded-lg mr-3"></div>
                <h1 className="text-2xl font-bold text-gray-900">Pech Fruits Tracker</h1>
              </div>
              <nav className="hidden lg:flex space-x-10">
                <a href="#" className="text-gray-600 hover:text-orange-600 font-medium transition">Dashboard</a>
                <a href="#" className="text-orange-600 font-bold border-b-2 border-orange-600 pb-1">Shipments</a>
                <a href="#" className="text-gray-600 hover:text-orange-600 font-medium transition">Documents</a>
              </nav>
            </div>

            {/* Right */}
            <div className="flex items-center space-x-8">
              <div className="text-right">
                <p className="text-xs text-gray-500">Logged in as</p>
                <p className="font-bold text-gray-900">{userConsignee === "ALL" ? "ALL CLIENTS" : userConsignee}</p>
              </div>
              <button
                onClick={() => auth.signOut().then(() => setUser(null))}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-lg transition"
              >
                <FiLogOut />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="max-w-7xl mx-auto px-6 py-10">

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { title: "Total Shipments", value: total, icon: FiPackage, color: "orange" },
              { title: "On Time", value: `${onTime}%`, icon: FiTruck, color: "green" },
              { title: "Delayed", value: delayed, icon: FiAlertCircle, color: "red" },
              { title: "This Week", value: filteredShipments.filter(s => {
                const eta = s['LIVE ETA'];
                if (!eta) return false;
                const days = (new Date(eta) - new Date()) / (1000*60*60*24);
                return days >= 0 && days <= 7;
              }).length, icon: FiClock, color: "blue" },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{kpi.title}</p>
                    <p className={`text-3xl font-bold text-${kpi.color}-600`}>{kpi.value}</p>
                  </div>
                  <kpi.icon className={`text-5xl text-${kpi.color}-500 opacity-70`} />
                </div>
              </div>
            ))}
          </div>

          {/* SEARCH */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex items-center bg-gray-50 rounded-xl px-5 py-4">
              <FiSearch className="text-gray-400 text-xl mr-4" />
              <input
                type="text"
                placeholder="Search by container, vessel, reference, product..."
                className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-green-700 px-8 py-5">
              <h2 className="text-2xl font-bold text-white">Live Shipments</h2>
            </div>
            {loading ? (
              <div className="p-16 text-center text-gray-500">Loading...</div>
            ) : filteredShipments.length === 0 ? (
              <div className="p-16 text-center text-gray-500">No shipments found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(filteredShipments[0]).map(h => (
                        <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredShipments.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(row).map((cell, j) => (
                          <td key={j} className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // LOGIN SCREEN
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-green-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
        <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-green-600 rounded-2xl mx-auto mb-6"></div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Pech Fruits Tracker</h1>
        <p className="text-gray-600 mb-10">Sign in to view your shipments</p>

        <form onSubmit={handleAuth} className="space-y-6">
          <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none transition" />
          <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none transition" />
          <button type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-green-600 text-white font-bold py-5 rounded-xl hover:shadow-2xl transform hover:scale-105 transition">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
