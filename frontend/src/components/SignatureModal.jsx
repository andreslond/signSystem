import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export default function SignatureModal({ isOpen, onClose, onConfirm, docTitle }) {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            onConfirm();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Confirmar firma</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                        <p className="text-sm text-amber-800">
                            Al firmar <strong>{docTitle}</strong> confirmas que estás de acuerdo con la información presentada.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Ingresa tu contraseña para verificar tu identidad
                            </label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                disabled={!password || isLoading}
                            >
                                {isLoading ? 'Firmando...' : 'Firmar Documento'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
