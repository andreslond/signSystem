export const mockContractorData = {
    contractor: {
        id: 1,
        name: "Juan Pérez",
        role: "Operador de Maquinaria",
        avatarUrl: "https://via.placeholder.com/150",
    },
    pendingDocuments: [
        {
            id: 101,
            title: "Renovación de Licencia",
            subtitle: "Vence: Mañana",
            status: "urgent"
        },
        {
            id: 102,
            title: "Actualización de Datos",
            subtitle: "Vence: 30 Oct, 2023",
            status: "pending"
        }
    ],
    signedDocuments: [
        {
            id: 201,
            title: "Contrato de Confidencialidad",
            subtitle: "Firmado el 12 Oct",
            status: "signed"
        },
        {
            id: 202,
            title: "Política de Seguridad",
            subtitle: "Firmado el 10 Oct",
            status: "signed"
        },
        {
            id: 203,
            title: "Acuse de Recibo de Equipo",
            subtitle: "Firmado el 05 Sep",
            status: "signed"
        }
    ]
};
