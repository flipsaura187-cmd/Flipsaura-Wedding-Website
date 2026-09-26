import { useNavigate, useParams as rpUseParams, useSearchParams as rpUseSearchParams, useLocation } from 'react-router-dom';
export function useRouter(){ const navigate=useNavigate(); return { push:(p)=>navigate(p), replace:(p)=>navigate(p,{replace:true}), back:()=>navigate(-1), refresh:()=>window.location.reload() }; }
export const useParams=rpUseParams;
export const useSearchParams=rpUseSearchParams;
export function usePathname(){ return useLocation().pathname; }
export function notFound(){ throw new Error('Not Found'); }
