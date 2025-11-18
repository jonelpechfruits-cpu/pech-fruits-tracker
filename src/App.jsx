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
  const [emailMap, setEmailMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const s = document.createElement('script');
    s.src = '/data/email-consignee-map.js'; s.async = true;
    s.onload = () => window.EMAIL_CONSIGNEE_MAP && setEmailMap(window.EMAIL_CONSIGNEE_MAP);
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (user && Object.keys(emailMap).length) {
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

          // SORT BY STATUS CATEGORY
          filtered.sort((a, b) => {
            const statusA = (a.STATUS || '').toUpperCase();
            const statusB = (b.STATUS || '').toUpperCase();

            const priority = {
              'PORT': 1,
              'STACK': 2,
              'PLANNED': 3,
              'EN ROUTE': 4
            };

            const priA = priority[statusA] || 5; // OFFLOADED = 5
            const priB = priority[statusB] || 5;

            return priA - priB;
          });

          setShipments(filtered);
          setFilteredShipments(filtered);
        });
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

  const openDocuments = async (shipment) => {
    const refValue = shipment.REF || shipment.CONTAINER;
    setSelectedShipment(shipment);
    setDocsLoading(true);
    setDocs([]);

    try {
      const folderRef = ref(storage, `documents/${refValue}`);
      const result = await listAll(folderRef);
      const urls = await Promise.all(result.items.map(item => getDownloadURL(item)));
      
      const docsList = result.items.map((item, i) => ({
        name: item.name,
        url: urls[i],
        isOrderConf: item.name.toLowerCase().includes('order')
      }));

      setDocs(docsList.sort((a) => a.isOrderConf ? -1 : 1));
    } catch (err) {
      setDocs([{ name: 'No documents found', url: null }]);
    }
    setDocsLoading(false);
  };

  // STATUS COLORS — YOUR ORIGINAL REQUEST
  const getStatusColor = (status) => {
    const s = (status || '').toUpperCase();
    if (s.includes('PORT')) return {bg: '#fee2e2', text: '#991b1b'};     // Red
    if (s.includes('EN ROUTE')) return {bg: '#fef9c3', text: '#854d0e'}; // Light Yellow
    if (s.includes('FEEDBACK')) return {bg: '#fed7aa', text: '#9c4221'}; // Light Orange
    if (s.includes('PLANNED')) return {bg: '#e5e7eb', text: '#4b5563'};  // Light Grey
    if (s.includes('OFFLOAD')) return {bg: '#f0fdf4', text: '#166534'};  // Green
    return {bg: '#f3f4f6', text: '#6b7280'}; // Default
  };

  if (!user) return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#f97316,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'}}>
      <div style={{background:'white', padding:'3rem', borderRadius:'1.5rem', boxShadow:'0 25px 50px rgba(0,0,0,0.3)', width:'420px', maxWidth:'95%', textAlign:'center'}}>
        <img src="/logo.jpg" alt="Pech Fruits" style={{width:'160px', height:'auto', margin:'0 auto 1.5rem', display:'block'}} />
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

  const currentConsignee = user ? emailMap[user.email.toLowerCase()] || user.email : '';
  const total = filteredShipments.length;

  return (
    <div style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'system-ui,sans-serif'}}>
      {/* HEADER */}
      <header style={{background:'white', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', position:'sticky', top:0, zIndex:50}}>
        <div style={{padding:'1rem', position:'relative', minHeight:'80px', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{textAlign:'center', position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -50%)'}}>
            <img src="/logo.jpg" alt="Pech Fruits" style={{height:'56px', width:'auto', display:'block', margin:'0 auto 0.4rem'}} />
            <h1 style={{fontSize:'1.6rem', fontWeight:'bold', color:'#1e293b', margin:0}}>Pech Fruits Tracker</h1>
          </div>
          <div style={{position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', fontSize:'0.95rem', color:'#475569'}}>
            Logged in as <strong style={{color:'#1e293b'}}>{currentConsignee}</strong>
          </div>
          <div style={{position:'absolute', right:'1rem', top:'50%', transform:'translateY(-50%)'}}>
            <button onClick={()=>auth.signOut().then(()=>setUser(null))}
              style={{background:'#dc2626', color:'white', padding:'0.65rem 1.3rem', borderRadius:'0.6rem', border:'none', fontWeight:'bold', fontSize:'0.95rem'}}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* BOTTOM NAV */}
      <nav style={{position:'fixed', bottom:0, left:0, right:0, background:'white', borderTop:'1px solid #e2e8f0', zIndex:50}}>
        <div style={{display:'flex', justifyContent:'space-around', padding:'0.8rem 0'}}>
          <button onClick={()=>setActiveTab('dashboard')} style={{color:activeTab==='dashboard'?'#ea580c':'#64748b', fontWeight:activeTab==='dashboard'?'bold':'normal', fontSize:'1rem'}}>
            Dashboard
          </button>
          <button onClick={()=>setActiveTab('shipments')} style={{color:activeTab==='shipments'?'#ea580c':'#64748b', fontWeight:activeTab==='shipments'?'bold':'normal', fontSize:'1rem'}}>
            Shipments
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{padding:'1rem', paddingBottom:'5rem', width:'100vw', marginLeft:'calc(50% - 50vw)', boxSizing:'border-box'}}>
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

        {/* DASHBOARD TAB — GORGEOUS CARDS WITH YOUR STATUS COLORS */}
        {activeTab === 'dashboard' && (
          <div style={{display:'grid', gap:'1.2rem'}}>
            {filteredShipments.map((shipment, i) => {
              const color = getStatusColor(shipment.STATUS);

              return (
                <div key={i} onClick={() => openDocuments(shipment)} style={{background:'white', borderRadius:'1.2rem', boxShadow:'0 8px 25px rgba(0,0,0,0.1)', padding:'1.5rem', cursor:'pointer'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'0.8rem'}}>
                    <h3 style={{fontSize:'1.4rem', fontWeight:'bold', color:'#1e293b'}}>{shipment.VESSEL || 'No Vessel'}</h3>
                    <span style={{background:color.bg, color:color.text, padding:'0.4rem 0.8rem', borderRadius:'0.5rem', fontSize:'0.8rem', fontWeight:'bold'}}>
                      {shipment.STATUS || 'Unknown'}
                    </span>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem', fontSize:'1rem', color:'#475569'}}>
                    <div><strong>Container:</strong> {shipment.CONTAINER || '-'}</div>
                    <div><strong>REF:</strong> {shipment.REF || shipment.CONTAINER || '-'}</div>
                    <div><strong>INV:</strong> {shipment.INV || '-'}</div>
                    <div><strong>Customer:</strong> {shipment.CONSIGNEE || '-'}</div>
                    <div><strong>Commodity:</strong> {shipment.PRODUCTS || '-'}</div>
                    <div><strong>ETA:</strong> {shipment['LIVE ETA'] || shipment.ETD || '-'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SHIPMENTS TAB — CLASSIC TABLE */}
        {activeTab === 'shipments' && (
          <div style={{background:'white', borderRadius:'1rem', boxShadow:'0 10px 25px rgba(0,0,0,0.1)', overflow:'hidden'}}>
            <div style={{maxHeight:'70vh', overflow:'auto'}}>
              <table style={{width:'100%', minWidth:'1200px', borderCollapse:'collapse'}}>
                <thead style={{background:'#f1f5f9', position:'sticky', top:0, zIndex:10, boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
                  <tr>
                    {Object.keys(filteredShipments[0] || {}).map((h, i) => (
                      <th key={i} style={{padding:'1rem 0.6rem', textAlign:'left', fontSize:'0.85rem', fontWeight:'bold', color:'#1e293b'}}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredShipments.map((row, i) => {
                    const refValue = row.REF || row.CONTAINER || '';
                    const refIndex = Object.keys(row).findIndex(k => row[k] === refValue);

                    return (
                      <tr key={i} style={{background:i%2===0?'#fdfdfd':'#ffffff', borderTop:'1px solid #f1f5f9'}}>
                        {Object.entries(row).map(([key, cell], j) => (
                          <td key={j} style={{padding:'0.9rem 0.6rem', fontSize:'0.9rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                            {j === refIndex ? (
                              <span onClick={() => openDocuments(row)} style={{color:'#ea580c', fontWeight:'bold', textDecoration:'underline', cursor:'pointer'}}>
                                {cell}
                              </span>
                            ) : cell}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DOCUMENTS MODAL */}
        {selectedShipment && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem'}}>
            <div style={{background:'white', borderRadius:'1.5rem', width:'90%', maxWidth:'500px', maxHeight:'90vh', overflow:'auto', boxShadow:'0 25px 60px rgba(0,0,0,0.4)'}}>
              <div style={{padding:'1.5rem', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={{fontSize:'1.5rem', fontWeight:'bold', color:'#1e293b'}}>
                  Documents – {selectedShipment.REF || selectedShipment.CONTAINER}
                </h3>
                <button onClick={() => {setSelectedShipment(null); setDocs([])}} style={{fontSize:'2.5rem', color:'#6b7280', background:'none', border:'none', cursor:'pointer'}}>×</button>
              </div>
              <div style={{padding:'1.5rem', display:'grid', gap:'1rem'}}>
                {docsLoading ? <div style={{textAlign:'center', padding:'2rem', color:'#64748b'}}>Loading documents...</div>
                : docs.length === 0 ? <div style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No documents uploaded yet</div>
                : docs.map((doc, i) => (
                    <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                      style={{padding:'1.2rem', background:doc.isOrderConf?'#f0fdf4':'#fefce8', border:doc.isOrderConf?'2px solid #86efac':'2px solid #fbbf24', borderRadius:'1rem', textAlign:'center', color:doc.isOrderConf?'#166534':'#92400e', fontWeight:'bold', textDecoration:'none', fontSize:'1rem'}}>
                      {doc.isOrderConf ? 'Order Confirmation' : 'Export Document'}<br/>
                      <small style={{fontWeight:'normal', color:'#475569'}}>{doc.name}</small>
                    </a>
                  ))
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
