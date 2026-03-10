import Card from '../components/cards/Card';
import { FaRegMoneyBillAlt, FaClock } from 'react-icons/fa';
import Navbar from '../components/navbar/Navbar';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', width: '100vw', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar title="Home" />
      <div style={{ maxWidth: 1200, padding: 40, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <Card
              title="Finanzas"
              color="#2E7D32"
              icon={<FaRegMoneyBillAlt size={36} />}
              onClick={() => navigate('/finance')}
            />
            <Card
              title="Horarios"
              color="#1565C0"
              icon={<FaClock size={36} />}
              onClick={() => navigate('/horarios')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
