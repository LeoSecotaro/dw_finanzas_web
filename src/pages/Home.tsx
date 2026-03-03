import Card from '../components/cards/Card';
import { FaRegMoneyBillAlt } from 'react-icons/fa';
import Navbar from '../components/navbar/Navbar';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', width: '100vw', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar title="Home" />
      <div style={{ maxWidth: 1200, padding: 40, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Card
            title="Finanzas"
            color="#2E7D32"
            icon={<FaRegMoneyBillAlt size={36} />}
            onClick={() => navigate('/finance')}
          />
        </div>
      </div>
    </div>
  );
}
