# Revisión del Proceso de Firmado de Documentos

## Resumen de Problemas Encontrados

Durante la revisión del código se identificaron varios problemas críticos que afectan la experiencia del usuario y el funcionamiento correcto de la aplicación.

---

## 1. Bucle Infinito de Llamadas API (PROBLEMA CRÍTICO)

### Ubicación
[`frontend/src/hooks/useDocuments.js:156`](frontend/src/hooks/useDocuments.js:156)

### Problema
El hook `useDocuments` tiene una dependencia incorrecta que causa múltiples llamadas API innecesarias:

```javascript
}, [status, pagination.page, pagination.limit, documents.length]); // ❌ documents.length causa re-fetches
```

### Causa
- `fetchDocumentsData` depende de `documents.length`
- Cuando se actualiza `documents`, cambia `documents.length`
- Esto recrea `fetchDocumentsData` via `useCallback`
- El `useEffect` se ejecuta de nuevo, causando otro fetch
- **Bucle infinito**

### Solución
Remover `documents.length` de las dependencias del `useCallback`:

```javascript
}, [status, pagination.page, pagination.limit]); // ✅ Solo parámetros de paginación
```

---

## 2. Falta de Datos del Empleado en Modal de Firma

### Ubicación
[`frontend/src/pages/DocumentViewerPending.jsx:305-389`](frontend/src/pages/DocumentViewerPending.jsx:305)

### Problema
El modal de confirmación de firma solo muestra el campo de contraseña. No incluye información del empleado como nombre completo e identificación.

### Solución Propuesta
Agregar campos informativos no editables con iconos:

```jsx
<div className="flex flex-col gap-4">
    {/* Información del empleado */}
    <div className="bg-surface-alt dark:bg-surface-alt p-4 rounded-2xl border border-border dark:border-border-light">
        <div className="flex items-center gap-3 mb-3">
            <User size={18} className="text-primary" />
            <span className="text-sm font-medium text-text-secondary">Información del Empleado</span>
        </div>
        <div className="space-y-2">
            <div className="flex justify-between">
                <span className="text-sm text-text-muted">Nombre completo</span>
                <span className="text-sm font-medium text-text-primary">{doc.employee_name}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-sm text-text-muted">Número de identificación</span>
                <span className="text-sm font-medium text-text-primary">{doc.employee_identification_number}</span>
            </div>
        </div>
    </div>

    <Input
        label="Tu contraseña"
        type="password"
        // ... resto del campo
    />
</div>
```

---

## 3. Texto Incorrecto en Modal de Éxito

### Ubicación
[`frontend/src/pages/DocumentViewerPending.jsx:406`](frontend/src/pages/DocumentViewerPending.jsx:406)

### Problema
El modal de éxito contiene caracteres cirílicos (rusos) accidentales:

```jsx
<p className="text-[14px] text-text-secondary font-medium transition-colors">
    Tu documento ha sido firmado y теперь estará disponible en la lista de documentos firmados.
</p>
```

### Solución
Corregir el texto:

```jsx
<p className="text-[14px] text-text-secondary font-medium transition-colors">
    Tu documento ha sido firmado y ahora estará disponible en la lista de documentos firmados.
</p>
```

---

## 4. Título y Subtítulo del Documento

### Ubicación
[`frontend/src/pages/DocumentViewerPending.jsx:220-226`](frontend/src/pages/DocumentViewerPending.jsx:220)

### Problema Actual
```jsx
<h2 className="text-[22px] font-bold text-text-primary mb-1 leading-tight transition-colors">
    {doc.employee_name || `Documento #${doc.employee_id || doc.id.slice(0, 8)}`}
</h2>
```

### Requerimiento del Usuario
- **Título**: "Cuenta de Cobro"
- **Subtítulo**: Fecha inicio y fecha fin en formato `DD/MM/YYYY - DD/MM/YYYY`

### Solución
El backend tiene los campos `payroll_period_start` y `payroll_period_end`. Se debe formatear y mostrar en ambas listas.

```jsx
// Función helper para formatear fechas
const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// En el componente
<h2 className="text-[22px] font-bold text-text-primary mb-1 leading-tight transition-colors">
    Cuenta de Cobro
</h2>
<p className="text-[14px] text-text-secondary font-medium transition-colors">
    {formatDateForDisplay(doc.payroll_period_start)} - {formatDateForDisplay(doc.payroll_period_end)}
</p>
```

### Listas de Documentos (Pendientes y Firmados)
En `transformDocument` en ambos archivos (`DocumentListPending.jsx` y `DocumentListSigned.jsx`):

```javascript
const transformDocument = (doc) => ({
    id: doc.id,
    title: 'Cuenta de Cobro',
    subtitle: doc.payroll_period_start && doc.payroll_period_end
        ? `${formatDateForDisplay(doc.payroll_period_start)} - ${formatDateForDisplay(doc.payroll_period_end)}`
        : doc.subtitle || doc.description || 'Sin período',
    // ... resto de propiedades
});
```

---

## 5. Navegación y Refetch Después de Firmar

### Ubicación
[`frontend/src/pages/DocumentViewerPending.jsx:96-100`](frontend/src/pages/DocumentViewerPending.jsx:96)

### Flujo Actual
```javascript
const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    navigate('/documents/pending', { replace: true });
}, [navigate]);
```

### Problema
Al navegar a `/documents/pending`, el hook `useDocuments` en `DocumentListPending` se inicializa nuevamente, pero no hay mecanismo para forzar un refresh de los datos desde el servidor.

### Solución
Pasar un parámetro de query para forzar refresh:

```javascript
const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    navigate('/documents/pending?refresh=true', { replace: true });
}, [navigate]);
```

Opcionalmente, en `DocumentListPending.jsx`:

```javascript
useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('refresh') === 'true') {
        refetch();
    }
}, [refetch]);
```

---

## 6. Datos del Documento desde el Repositorio

### Ubicación
[`backend/src/repositories/DocumentUserRepository.ts:134-191`](backend/src/repositories/DocumentUserRepository.ts:134)

### Verificación
El método `getDocumentByIdWithEmployee` ya obtiene correctamente:
- Datos del documento (`documents`)
- Datos del empleado (`employees`): name, email, identification_number, identification_type
- Datos de firma si está firmado (`signatures`): name, identification_number

### Campos Disponibles en el Frontend
- `doc.employee_name`
- `doc.employee_email`
- `doc.employee_identification_number`
- `doc.employee_identification_type`

---

## 7. Diagrama del Flujo de Firmado

```mermaid
flowchart TD
    A[Usuario hace clic en Firmar] --> B[Se abre Modal de Confirmación]
    B --> C[Usuario ingresa contraseña]
    C --> D[Click en Confirmar Firma]
    D --> E[Llama a signDocument API]
    E --> F{¿Éxito?}
    F -->|Sí| --> G[Actualiza estado a SIGNED en BD]
    G --> H[Carga PDF firmado a GCS]
    H --> I[Inserta registro de firma]
    I --> J[Cierra modal de confirmación]
    J --> K[Muestra modal de éxito]
    K --> L[Navega a lista de pendientes]
    F -->|No| M[Muestra error en modal]
    M --> C
```

---

## Plan de Implementación

### Fase 1: Correcciones Críticas
1. **Corregir bucle infinito** - Remover `documents.length` de dependencias
2. **Corregir texto del modal** - Eliminar caracteres cirílicos

### Fase 2: Mejoras de UX
1. **Agregar info del empleado** - Campos informativos en modal de firma
2. **Mejorar navegación post-firma** - Implementar refresh de lista

### Fase 3: Mejoras de Contenido
1. **Actualizar título del documento** - "Cuenta de Cobro"
2. **Agregar subtítulo** - Período de nómina

---

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `frontend/src/hooks/useDocuments.js` | Quitar `documents.length` de dependencias | Crítica |
| `frontend/src/pages/DocumentViewerPending.jsx` | Corregir texto, agregar info empleado, título "Cuenta de Cobro", subtítulo con fechas | Alta |
| `frontend/src/pages/DocumentListPending.jsx` | Actualizar subtitle con fechas, agregar refresh post-firma | Alta |
| `frontend/src/pages/DocumentListSigned.jsx` | Actualizar subtitle con fechas | Media |

---

## Notas Adicionales

### Verificación de Base de Datos
El proceso de firmado correctamente implementado:
1. ✅ Descarga PDF original de GCS
2. ✅ Genera hash SHA-256 del PDF
3. ✅ Crea datos de firma
4. ✅ Genera PDF firmado con bloque de firma
5. ✅ Calcula hash del PDF firmado
6. ✅ Sube PDF firmado a GCS
7. ✅ Inserta registro en tabla `signatures`
8. ✅ Actualiza documento con `status='SIGNED'`, hash y signed_at

### Posible Causa de "No se ven cambios en BD"
- El bucle infinito de llamadas API podría estar saturando la conexión
- Error de red durante el proceso de firma
- Permisos RLS en las tablas
