import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { auth, storage } from './firebase';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailMap, setEmailMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [shipmentDocs, setShipmentDocs] = useState([]);

  useEffect(() => {
    const s = document.createElement('script');
    s.src = '/data/email-consignee-map.js'; s.async = true;
    s.onload = () => window.EMAIL_CONSIGNEE_MAP && setEmailMap(window.EMAIL_CONSIGNEE_MAP);
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (user && Object.keys(emailMap).length) {
      setLoading(true);
      fetch('/data/shipments.json')
        .then(r => r.json())
        .then(data => {
          const consignee = emailMap[user.email.toLowerCase()];
          let filtered = data;
          if (consignee && consignee !== "ALL") {
            filtered = data.filter(r => 
              (r.CONSIGNEE || '').trim().toUpperCase() === consignee.trim().toUpperCase()
            );
          }
          setShipments(filtered);
          setFilteredShipments(filtered);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user, emailMap]);

  useEffect(() => {
    if (!searchTerm) setFilteredShipments(shipments);
    else setFilteredShipments(shipments.filter(r =>
      Object.values(r).some(v => v?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    ));
  }, [searchTerm, shipments]);

  const handleLogin = e => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then(u => setUser(u.user))
      .catch(err => alert(err.message));
  };

  // Load documents for selected shipment
  const loadShipmentDocs = async (shipment) => {
    setDocsLoading(true);
    setShipmentDocs([]);
    const refId = shipment.REF || shipment.CONTAINER || 'unknown';
    try {
      const folderRef = ref(storage, `documents/${refId}`);
      const result = await listAll(folderRef);
      const urls = await Promise.all(result.items.map(item => getDownloadURL(item)));
      setShipmentDocs(result.items.map((item, i) => ({
        name: item.name,
        url: urls[i],
        type: item.name.includes('order-confirmation') ? 'Order Confirmation' : 'Export Document'
      })));
    } catch (err) {
      console.error('Docs error:', err);
      setShipmentDocs([{ name: 'No documents found', type: 'Info' }]);
    }
    setDocsLoading(false);
    setSelectedShipment(shipment);
  };

  if (!user) return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#f97316,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'}}>
      <div style={{background:'white', padding:'3rem', borderRadius:'1.5rem', boxShadow:'0 25px 50px rgba(0,0,0,0.3)', width:'420px', maxWidth:'95%', textAlign:'center'}}>
        <img src="/logo.jpg" alt="Pech Fruits" style={{width:'140px', height:'auto', margin:'0 auto 1.5rem', display:'block'}} />
        <h1 style={{fontSize:'2.2rem', fontWeight:'bold', color:'#1e293b', marginBottom:'0.5rem'}}>Pech Fruits Tracker</h1>
        <p style={{color:'#64748b', marginBottom:'2rem'}}>Sign in to view your live shipments</p>
        <form onSubmit={handleLogin} style={{display:'grid', gap:'1rem'}}>
          <input type="email" placeholder="Email" required value={email} onChange={e=>setEmail(e.target.value)}
            style={{padding:'1rem 1.2rem', border:'1px solid #cbd5e1', borderRadius:'0.8rem', fontSize:'1.1rem'}} />
          <input type="password" placeholder="Password" required value={password} onChange={e=>setPassword(e.target.value)}
            style={{padding:'1rem 1.2rem', border:'1px solid #cbd5e1', borderRadius:'0.8rem', fontSize:'1.1rem'}} />
          <button type="submit"
            style={{padding:'1rem', background:'linear-gradient(to right,#ea580c,#16a34a)', color:'white', fontWeight:'bold', border:'none', borderRadius:'0.8rem', fontSize:'1.1rem', cursor:'pointer'}}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );

  const userConsignee = emailMap[user.email.toLowerCase()] || 'Restricted';
  const total = filteredShipments.length;

  return (
    <div style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif'}}>
      <header style={{background:'white', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', position:'sticky', top:0, zIndex:50}}>
        <div style={{padding:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem'}}>
          <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
            <img src="/logo.jpg" alt="Pech Fruits" style={{height:'52px', width:'auto'}} />
            <h1 style={{fontSize:'1.6rem', fontWeight:'bold', color:'#1e293b', margin:0}}>Pech Fruits Tracker</h1>
          </div>
          <button onClick={()=>auth.signOut().then(()=>setUser(null))}
            style={{background:'#dc2626', color:'white', padding:'0.7rem 1.3rem', borderRadius:'0.7rem', border:'none', fontWeight:'bold'}}>
            Logout
          </button>
        </div>
      </header>

      <div style={{padding:'1rem', width:'100vw', marginLeft:'calc(50% - 50vw)', boxSizing:'border-box'}}>
        <h2 style={{fontSize:'1.8rem', fontWeight:'bold', color:'#1e293b', marginBottom:'1rem', textAlign:'center'}}>
          Live Shipments ({total})
        </h2>

        <input
          type="text"
          placeholder="Search anything..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{width:'100%', padding:'1rem', marginBottom:'1.5rem', border:'1px solid #cbd5e1', borderRadius:'1rem', fontSize:'1rem', boxSizing:'border-box'}}
        />

        <div style={{background:'white', borderRadius:'1rem', boxShadow:'0 10px 25px rgba(0,0,0,0.1)', overflow:'hidden'}}>
          <div style={{overflowX:'auto', WebkitOverflowScrolling:'touch'}}>
            <table style={{width:'100%', minWidth:'1200px', borderCollapse:'collapse'}}>
              <thead style={{background:'#f1f5f9', position:'sticky', top:0}}>
                <tr>
                  {Object.keys(filteredShipments[0] || {}).map((h, i) => {
                    const isRefColumn = i === 3; // Assuming REF is the 4th column (index 3)
                    return (
                      <th 
                        key={h} 
                        style={{padding:'1rem 0.6rem', textAlign:'left', fontSize:'0.85rem', fontWeight:'bold', color:'#1e293b', whiteSpace:'nowrap'}}
                        onClick={isRefColumn ? () => setSelectedShipment(filteredShipments.find(r => r[h] === h)) : undefined}
                        style={isRefColumn ? {cursor:'pointer', color:'#ea580c'} : {}}
                      >
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredShipments.slice(0, 100).map((row, i) => (
                  <tr key={i} style={{background:i%2===0?'#fdfdfd':'#ffffff', borderTop:'1px solid #f1f5f9'}}>
                    {Object.values(row).map((cell, j) => (
                      <td key={j} style={{padding:'0.9rem 0.6rem', fontSize:'0.9rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'150px'}}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DOCUMENTS MODAL */}
        {selectedShipment && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem'}}>
            <div style={{background:'white', borderRadius:'1.5rem', width:'90%', maxWidth:'500px', maxHeight:'90vh', overflow:'auto', boxShadow:'0 25px 60px rgba(0,0,0,0.4)'}}>
              <div style={{padding:'1.5rem', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={{fontSize:'1.5rem', fontWeight:'bold', color:'#1e293b'}}>
                  Documents – {selectedShipment.REF || selectedShipment.CONTAINER}
                </h3>
                <button onClick={() => setSelectedShipment(null)} style={{fontSize:'2rem', color:'#6b7280', border:'none', background:'none', cursor:'pointer'}}>×</button>
              </div>
              <div style={{padding:'1.5rem', display:'grid', gap:'1rem'}}>
                <a 
                  href={`https://drive.google.com/drive/folders/1xAfTZm40KfAFWL1nrRd-0a5IEzUelKP1?usp=sharing/${selectedShipment.REF || selectedShipment.CONTAINER}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{padding:'1.4rem', background:'#f0f9ff', border:'2px solid #0ea5e9', borderRadius:'1rem', textAlign:'center', color:'#0c4a6e', fontWeight:'bold', textDecoration:'none', fontSize:'1.1rem'}}
                >
                  Open All Documents (Order Conf + Export Docs)
                </a>
              </div>
              <div style={{padding:'0 1.5rem 1.5rem', fontSize:'0.9rem', color:'#6b7280', textAlign:'center'}}>
                All your documents are in one private folder – updated in real time
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
