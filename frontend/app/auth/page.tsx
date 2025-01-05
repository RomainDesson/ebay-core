'use client';

import { signIn } from 'next-auth/react';

export default function AuthPage() {
  return (
    <div>
      <h1>Connexion à eBay</h1>
      <button 
        onClick={() => signIn('ebay', { callbackUrl: '/dashboard' })}
        className="btn btn-primary"
      >
        Se connecter avec eBay
      </button>
    </div>
  );
} 