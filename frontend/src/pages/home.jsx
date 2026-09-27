import { useEffect, useState } from 'react';
import Link from '@/compat/Link';
import ItemCard from '@/components/ItemCard';
import HeroSlideshow from '@/components/Hero';
import api from "@/api/axios";
const indianWeddingImages=[
{url:'https://images.unsplash.com/photo-1611106211090-8f3c79eb8552?q=80&w=687&auto=format&fit=crop',alt:'Indian bride in red lehenga'},
{url:'https://images.unsplash.com/photo-1597157639073-69284dc0fdaf?q=80&w=1174&auto=format&fit=crop',alt:'Indian groom and baraat'},
{url:'https://images.unsplash.com/photo-1635919254233-38ea27301900?q=80&w=1170&auto=format&fit=crop',alt:'Mehndi ceremony'},
{url:'https://images.unsplash.com/photo-1735052712489-f45220126a0c?q=80&w=680&auto=format&fit=crop',alt:'Decorated mandap'},
{url:'https://images.unsplash.com/photo-1587271339318-2e78fdf79586?q=80&w=1169&auto=format&fit=crop',alt:'Wedding ceremony'},
{url:'https://images.unsplash.com/photo-1601121141503-c4796ffc4b52?q=80&w=1170&auto=format&fit=crop',alt:'Indian wedding food'}];
const reviews=[['Aisha & Rahul','FlipsAura made venue booking a breeze. Stunning decor, smooth process.'],['Priya & Karan','The planners we booked were absolute magic. Worth every rupee.'],['Neha & Aman','From mandap to lighting — everything was just perfect.']];
export default function HomePage(){
 const [data,setData]=useState({categories:[],featured:[]});
 useEffect(()=>{Promise.all([api.get('/api/categories'),api.get('/api/items?limit=8&sort=newest')]).then(([c,i])=>setData({categories:c.data.data?.categories||[],featured:i.data.data?.items||[]})).catch(()=>{});},[]);
 return <><HeroSlideshow/><section className="section"><div className="container"><div className="section-head"><h2>Shop by category</h2></div><div className="grid grid-4">{data.categories.map(c=><Link key={c.slug} to={`/categories/${c.slug}`} className="cat-card"><div className="cat-card-bg"><img src={c.image||'/images/fallback-category.jpg'} alt={c.name}/><div className="cat-card-overlay"/></div><div className="cat-card-content"><h3>{c.name}</h3></div></Link>)}</div></div></section>
 <section className="section" style={{background:'var(--pink-50)'}}><div className="container"><div className="section-head"><div><span className="eyebrow">Inspiration</span><h2>From real FlipsAura weddings</h2></div></div><div className="gallery">{indianWeddingImages.map((img,i)=><div className="gallery-item" key={i}><img src={img.url} alt={img.alt}/></div>)}</div></div></section>
 <section className="section"><div className="container"><div className="section-head"><div><span className="eyebrow">Trending</span><h2>Featured listings</h2></div></div>{data.featured.length?<div className="grid grid-4">{data.featured.map(it=><ItemCard key={it._id} item={it}/>)}</div>:<div className="empty">No listings yet — admins can add categories & items from /admin.</div>}</div></section>
 <section className="section" style={{background:'var(--pink-50)'}}><div className="container"><div className="section-head"><div><span className="eyebrow">Loved by couples</span><h2>Stories from our brides & grooms</h2></div></div><div className="grid grid-3">{reviews.map(([name,text])=><div className="review" key={name}><div className="stars">★★★★★</div><p>"{text}"</p><div className="review-author">— {name}</div></div>)}</div></div></section></>;
}
