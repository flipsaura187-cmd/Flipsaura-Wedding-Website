export default function Image({src, alt='', width, height, fill, style, className, ...props}) {
  const s={...style}; if(fill){s.width='100%';s.height='100%';} return <img src={src} alt={alt} width={fill?undefined:width} height={fill?undefined:height} className={className} style={s} {...props}/>;
}
