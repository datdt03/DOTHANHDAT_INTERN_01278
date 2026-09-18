import { type ReactNode } from 'react';
import { IconTools } from './icons';

export interface CenteredPlaceholderPageProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function CenteredPlaceholderPage({
  title,
  subtitle = 'Tính năng đang trong lộ trình phát triển',
  icon = <IconTools size={36} />,
}: CenteredPlaceholderPageProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem 1rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
        }}
        aria-hidden="true"
      >
        {icon}
      </div>

      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--rf-text-main, #0f172a)',
          margin: '0 0 0.5rem 0',
        }}
      >
        {title}
      </h1>

      <span
        style={{
          display: 'inline-block',
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: '#0369a1',
          backgroundColor: '#e0f2fe',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          marginTop: '0.25rem',
        }}
      >
        {subtitle}
      </span>
    </div>
  );
}
