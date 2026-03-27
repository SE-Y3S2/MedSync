'use client';

import React, { useState, useEffect } from 'react';

/* ── Card ── */
interface CardProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ title, icon, children, className }: CardProps) => (
  <div className={`med-card ${className || ''}`}>
    <h3 className="card-title">
      {icon && <span className="card-icon">{icon}</span>}
      {title}
    </h3>
    <div className="card-content">{children}</div>
  </div>
);

/* ── Button ── */
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
  icon?: string;
}

export const Button = ({ children, onClick, type = 'button', variant = 'primary', size, disabled = false, icon }: ButtonProps) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`med-button ${variant} ${size || ''}`}
  >
    {icon && <span>{icon}</span>}
    {children}
  </button>
);

/* ── Input ── */
interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export const Input = ({ label, type = 'text', value, onChange, placeholder, required = false, disabled = false }: InputProps) => (
  <div className="med-input-group">
    {label && <label className="med-label">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="med-input"
    />
  </div>
);

/* ── Tabs ── */
interface TabsProps {
  tabs: string[];
  activeTab: number;
  onChange: (index: number) => void;
}

export const Tabs = ({ tabs, activeTab, onChange }: TabsProps) => (
  <div className="tabs-container">
    <div className="tabs-header">
      {tabs.map((tab, i) => (
        <button
          key={i}
          className={`tab-button ${i === activeTab ? 'active' : ''}`}
          onClick={() => onChange(i)}
        >
          {tab}
        </button>
      ))}
    </div>
  </div>
);

/* ── Badge ── */
interface BadgeProps {
  text: string;
  variant?: 'low' | 'medium' | 'high' | 'emergency' | 'info';
}

export const Badge = ({ text, variant = 'info' }: BadgeProps) => (
  <span className={`badge ${variant}`}>{text}</span>
);

/* ── Skeleton ── */
export const Skeleton = ({ type = 'text' }: { type?: 'text' | 'title' | 'card' | 'avatar' }) => (
  <div className={`skeleton skeleton-${type}`} />
);

/* ── Toast System ── */
interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

let toastId = 0;
const toastListeners: Array<(toast: ToastMessage) => void> = [];

export const showToast = (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  const toast: ToastMessage = { id: ++toastId, text, type };
  toastListeners.forEach(fn => fn(toast));
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (toast: ToastMessage) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 4000);
    };
    toastListeners.push(handler);
    return () => {
      const idx = toastListeners.indexOf(handler);
      if (idx > -1) toastListeners.splice(idx, 1);
    };
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' && '✓ '}
          {t.type === 'error' && '✕ '}
          {t.type === 'warning' && '⚠ '}
          {t.type === 'info' && 'ℹ '}
          {t.text}
        </div>
      ))}
    </div>
  );
};

/* ── Modal ── */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9998
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 'var(--radius-lg)',
        padding: '28px', maxWidth: '500px', width: '90%',
        boxShadow: 'var(--shadow-lg)', maxHeight: '80vh', overflow: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
};
