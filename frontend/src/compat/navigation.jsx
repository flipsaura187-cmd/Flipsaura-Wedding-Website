import { useNavigate, useParams as rpUseParams, useSearchParams as rpUseSearchParams, useLocation } from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (p) => navigate(p),
    replace: (p) => navigate(p, { replace: true }),
    back: () => navigate(-1),
    refresh: () => window.location.reload(),
  };
}

export const useParams = rpUseParams;

// Support both Next.js pattern: const sp = useSearchParams(); sp.get('key')
// AND React Router pattern: const [sp, setSp] = useSearchParams(); sp.get('key')
export function useSearchParams() {
  const [params, setParams] = rpUseSearchParams();

  // Create an array tuple that also delegates URLSearchParams methods directly
  const tuple = [params, setParams];
  tuple.get = (key) => params.get(key);
  tuple.getAll = (key) => params.getAll(key);
  tuple.has = (key) => params.has(key);
  tuple.forEach = (...args) => params.forEach(...args);
  tuple.entries = () => params.entries();
  tuple.keys = () => params.keys();
  tuple.values = () => params.values();
  tuple.toString = () => params.toString();

  return tuple;
}

export function usePathname() {
  return useLocation().pathname;
}

export function notFound() {
  throw new Error('Not Found');
}
