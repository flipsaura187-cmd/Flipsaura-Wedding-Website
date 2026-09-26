import { useEffect } from 'react';
export default function Script({src,onLoad}) { useEffect(()=>{ if(!src)return; const s=document.createElement('script'); s.src=src; s.async=true; s.onload=onLoad; document.body.appendChild(s); return()=>s.remove(); },[src,onLoad]); return null; }
