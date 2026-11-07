import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ArrowLeft, Sparkles, Layers } from 'lucide-react';

export const PlaceholderPage = ({ pageNumber, title, description, category }) => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <Card padding="lg" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <Layers size={30} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Badge variant="primary" size="md">
            Page {pageNumber} of 16
          </Badge>
          <Badge variant="default" size="md">
            {category}
          </Badge>
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
          {title}
        </h2>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            maxWidth: '560px',
            margin: '0 auto 2rem',
          }}
        >
          {description}
        </p>

        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--light-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '2rem',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            <Sparkles size={16} color="var(--primary-blue)" />
            <span>Development Plan Status</span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
            In accordance with Rule 1 <em>("Build one page at a time")</em>, Page 1 (Login) and Page 2 (Registration) and Core Dashboard are fully operational. Tell Antigravity to build this page next to implement its dedicated models, APIs, and interactive UI views!
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/invoices')}
          >
            Explore Billing System
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
