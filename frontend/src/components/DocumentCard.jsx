import React from 'react';
import { FileText, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { Card, CardBody } from './ui/Card';
import { useNavigate } from 'react-router-dom';

export default function DocumentCard({ doc }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/documents/${doc.id}`);
    };

    const statusColor = doc.status === 'signed' ? 'text-green-500' : 'text-amber-500';
    const StatusIcon = doc.status === 'signed' ? CheckCircle : Clock;

    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={handleClick}>
            <CardBody className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${doc.status === 'signed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {doc.title}
                        </h3>
                        <p className="text-sm text-gray-500">{doc.subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {/* Mobile view might hide specific status text, keep icon */}
                    <div className="flex flex-col items-end">
                        <span className={`text-xs font-medium uppercase tracking-wider ${statusColor} hidden sm:block`}>
                            {doc.status === 'signed' ? 'Firmado' : 'Pendiente'}
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5">{doc.date}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </div>
            </CardBody>
        </Card>
    );
}
