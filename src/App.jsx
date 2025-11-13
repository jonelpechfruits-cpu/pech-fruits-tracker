import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailMap, setEmailMap] = useState({});

  // Load email → consignee map
  useEffect(() => {
    fetch('/data/email-consignee-map.json')
      .then(res => res.json())
      .then(map => setEmailMap(map))
      .catch(() => console.error('Failed to load email map'));
  }, []);

  // Load and filter shipments
  useEffect(() => {
    if (user && Object.keys(emailMap).length > 0) {
      setLoading(true);
      fetch('/data/shipments.json')
        .then(res => res.json())
        .then(data => {
          const userConsignee = emailMap[user.email.toLowerCase()];
          if (!userConsignee) {
            setShipments([]);
            setLoading(false);
            return;
          }

          const filtered = data.filter(row =>
            row['CONSIGNEE'] && row['CONSIGNEE'].toUpperCase().includes(userConsignee.toUpperCase())
          );

          setShipments(filtered);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [user, emailMap]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const centeredColumns = ['REF', 'INV', 'STATUS', 'ETD', 'LIVE ETA', 'DOCS'];

  if (user) {
    const userConsignee = emailMap[user.email.toLowerCase()] || 'Unknown';

    return (
      <div className="min-h-screen p-6">
        {/* Header Card */}
        <div className="glass-card max-w-7xl mx-auto p-6 text-center rounded-2xl mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">Pech Fruits Tracker</h1>
          <p className="text-white text-lg">
            Logged in as: <span className="font-semibold">{user.email}</span>
            <br />
            <span className="text-sm text-yellow-300">Viewing: {userConsignee}</span>
          </p>
          <button
            onClick={() => auth.signOut().then(() => setUser(null))}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {/* Table Card */}
        <div className="glass-card max-w-7xl mx-auto rounded-2xl shadow-2xl">
          <div className="bg-gradient-to-r from-orange-600 to-green-700 p-5 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white">Live Shipments</h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center text-white py-8">Loading shipments...</div>
            ) : shipments.length === 0 ? (
              <div className="text-center text-white py-8">
                No shipments found for <strong>{userConsignee}</strong>
                <br />
                <small className="text-gray-300">Contact admin if this is incorrect.</small>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-sm min-w-max">
                  <thead className="bg-white bg-opacity-15">
                    <tr>
                      {Object.keys(shipments[0]).map((header) => {
                        const width = {
                          'NR': 10,
                          'VESSEL': 230,
                          'CONTAINER': 143,
                          'REF': 61,
                          'INV': 110,
                          'STATUS': 113,
                          'CONSIGNEE': 197,
                          'PRODUCTS': 203,
                          'POL': 159,
                          'POD': 159,
                          'ETD': 100,
                          'LIVE ETA': 100,
                          'DOCS': 66
                        }[header] || 120;

                        const isCentered = centeredColumns.includes(header);

                        return (
                          <th
                            key={header}
                            style={{
                              width: `${width}px`,
                              minWidth: `${width}px`,
                              textAlign: isCentered ? 'center' : 'left'
                            }}
                            className="px-4 py-2 font-bold uppercase tracking-wider whitespace-nowrap text-white"
                          >
                            {header}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white divide-opacity-20">
                    {shipments.map((row, i) => (
                      <tr key={i} className="hover:bg-white hover:bg-opacity-10 transition">
                        {Object.entries(row).map(([key, cell], j) => {
                          const width = {
                            'NR': 10,
                            'VESSEL': 230,
                            'CONTAINER': 143,
                            'REF': 61,
                            'INV': 110,
                            'STATUS': 113,
                            'CONSIGNEE': 197,
                            'PRODUCTS': 203,
                            'POL': 159,
                            'POD': 159,
                            'ETD': 100,
                            'LIVE ETA': 100,
                            'DOCS': 66
                          }[key] || 120;

                          const isCentered = centeredColumns.includes(key);

                          return (
                            <td
                              key={j}
                              style={{
                                width: `${width}px`,
                                minWidth: `${width}px`,
                                textAlign: isCentered ? 'center' : 'left'
                              }}
                              className="px-4 py-2 whitespace-nowrap align-top text-gray-100"
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
        </div>
      </div>
    );
  }

  // Login Screen
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-md p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-white mb-8">
          {isLogin ? 'Login' : 'Register'}
        </h1>

        <form onSubmit={handleAuth} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:border-white transition"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:border-white transition"
            required
          />
          <button
            type="submit"
            className="w-full bg-white text-orange-600 py-4 rounded-xl font-bold text-lg hover:bg-opacity-90 transition"
          >
            {isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-200">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-white font-bold hover:underline"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default App;