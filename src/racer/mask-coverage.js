// Subtract mask rectangles from a footprint, without creating any mesh. Only
// return true when the union covers the entire footprint; partial tiles retain
// the existing clipping path and its exact edges.
export function fullyMasked(footprint,masks){
  let remaining=[footprint];
  for(const [l,r,n,f] of masks){
    const next=[];
    for(const [a,b,c,d] of remaining){
      const x0=Math.max(a,l),x1=Math.min(b,r),z0=Math.max(c,n),z1=Math.min(d,f);
      if(x0>=x1||z0>=z1){next.push([a,b,c,d]);continue;}
      if(a<x0)next.push([a,x0,c,d]);if(x1<b)next.push([x1,b,c,d]);
      if(c<z0)next.push([x0,x1,c,z0]);if(z1<d)next.push([x0,x1,z1,d]);
    }
    remaining=next;if(!remaining.length)return true;
  }
  return false;
}
