// Cut unwrapped road meshes before bending them. Every layer uses the same
// X/Z opening; UVs and normals are interpolated at the exact intersection.
export function subtractRectangles(THREE,geometry,rectangles){
  if(!rectangles.length)return geometry;
  const input=geometry.index?geometry.toNonIndexed():geometry;
  const names=Object.keys(input.attributes),sizes=names.map(n=>input.attributes[n].itemSize);
  const offsets=[];let stride=0;for(const size of sizes){offsets.push(stride);stride+=size;}
  const pos=offsets[names.indexOf('position')],out=names.map(()=>[]);
  const read=i=>names.flatMap((n,k)=>Array.from({length:sizes[k]},(_,j)=>input.attributes[n].array[i*sizes[k]+j]));
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  function half(poly,axis,bound,sign){
    const result=[];
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length],da=(a[pos+axis]-bound)*sign,db=(b[pos+axis]-bound)*sign;
      if(da>=0)result.push(a);
      if((da<0&&db>0)||(da>0&&db<0))result.push(mix(a,b,da/(da-db)));
    }
    return result;
  }
  function subtract(poly,[left,right,near,far]){
    const xs=poly.map(v=>v[pos]),zs=poly.map(v=>v[pos+2]);
    if(Math.max(...xs)<=left||Math.min(...xs)>=right||Math.max(...zs)<=near||Math.min(...zs)>=far)return [poly];
    const outside=[];let inside=poly;
    for(const [axis,bound,sign]of [[0,left,1],[0,right,-1],[2,near,1],[2,far,-1]]){
      if(inside.length<3)break;
      const part=half(inside,axis,bound,-sign);if(part.length>=3)outside.push(part);
      inside=half(inside,axis,bound,sign);
    }
    return outside;
  }
  for(let i=0;i<input.attributes.position.count;i+=3){
    let polygons=[[read(i),read(i+1),read(i+2)]];
    for(const rect of rectangles)polygons=polygons.flatMap(poly=>subtract(poly,rect));
    for(const poly of polygons)for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]])
      names.forEach((_,k)=>out[k].push(...v.slice(offsets[k],offsets[k]+sizes[k])));
  }
  const result=new THREE.BufferGeometry();names.forEach((name,k)=>result.setAttribute(name,new THREE.Float32BufferAttribute(out[k],sizes[k])));
  if(input!==geometry)input.dispose();geometry.dispose();return result;
}

// Curving a large flat triangle would make its surface a chord through the
// tube. Subdivide in circumference metres before applying the shared wrap.
export function subdivideAcross(THREE,geometry,maxSpan=.35){
  const source=geometry.attributes.position,index=geometry.index;
  let needsSubdivision=false;
  for(let i=0;i<(index?index.count:source.count);i+=3){
    const a=source.getX(index?index.getX(i):i),b=source.getX(index?index.getX(i+1):i+1),c=source.getX(index?index.getX(i+2):i+2);
    if(Math.max(a,b,c)-Math.min(a,b,c)>maxSpan){needsSubdivision=true;break;}
  }
  if(!needsSubdivision)return geometry;
  const input=geometry.index?geometry.toNonIndexed():geometry;
  const p=input.attributes.position,uv=input.attributes.uv,positions=[],uvs=[];
  const read=i=>[p.getX(i),p.getY(i),p.getZ(i),uv.getX(i),uv.getY(i)];
  function clip(poly,bound,sign){
    const result=[];
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length],da=(a[0]-bound)*sign,db=(b[0]-bound)*sign;
      if(da>=0)result.push(a);
      if((da<0&&db>0)||(da>0&&db<0)){const t=da/(da-db);result.push(a.map((v,j)=>v+(b[j]-v)*t));}
    }
    return result;
  }
  function emit(poly){
    for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]]){positions.push(v[0],v[1],v[2]);uvs.push(v[3],v[4]);}
  }
  function triangle(a,b,c){
    const lo=Math.min(a[0],b[0],c[0]),hi=Math.max(a[0],b[0],c[0]);
    if(hi-lo<=maxSpan){emit([a,b,c]);return;}
    // Parallel strips bound the added vertex count by circumference width;
    // long triangles do not need repeated subdivision along the travel axis.
    for(let n=Math.floor(lo/maxSpan);n<Math.ceil(hi/maxSpan);n++)emit(clip(clip([a,b,c],n*maxSpan,1),(n+1)*maxSpan,-1));
  }
  for(let i=0;i<p.count;i+=3)triangle(read(i),read(i+1),read(i+2));
  const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));result.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));result.computeVertexNormals();
  if(input!==geometry)input.dispose();geometry.dispose();return result;
}
