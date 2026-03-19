import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Loader2 } from 'lucide-react';

// Read the requested experiment from the iframe's URL query parameter
const params = new URLSearchParams(window.location.search);
const experimentId = params.get('id');

// Dynamically import the specific sandbox component
const Experiment = experimentId
    ? lazy(() => import(`./sandbox/${experimentId}/index.tsx`).catch(() => {
        return { default: () => <div style={{ color: 'red', padding: '2rem', fontFamily: 'monospace' }}>Failed to load src/sandbox/{experimentId}/index.tsx</div> };
    }))
    : () => <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>No experiment ID provided.</div>;

const Fallback = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', gap: '0.5rem', fontFamily: 'sans-serif' }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Mounting Isolated Environment...</span>
    </div>
);

createRoot(document.getElementById('sandbox-root')!).render(
    <StrictMode>
        <Suspense fallback={<Fallback />}>
            <Experiment />
        </Suspense>
    </StrictMode>
);