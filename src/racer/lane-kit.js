import lane from '../../public/assets/track/phase-lane-r1.js';
import edgeMarker from '../../public/assets/track/neutral-edge-marker-r1.js';
import { PHASES, stripCenter } from './track.js';

// The same records populate STRIPS for actual matching-phase turbo behavior.
export const PHASE_REVIEW_STRIPS = [
  { start:25, end:325, phase:0, from:-.48, to:-.48, width:.18 },
  { start:25, end:325, phase:1, from:0, to:0, width:.18 },
  { start:25, end:325, phase:2, from:.48, to:.48, width:.18 },
  { start:425, end:650, phase:1, from:0, to:0, width:.18 },
  { start:750, end:975, phase:2, from:.46, to:.46, width:.18 },
  { start:1100, end:1450, phase:0, from:-.48, to:-.48, width:.18 },
  { start:1100, end:1450, phase:1, from:0, to:0, width:.18 },
  { start:1100, end:1450, phase:2, from:.48, to:.48, width:.18 },
  { start:1550, end:1725, phase:2, from:0, to:0, width:.18 },
];

export function addPhaseLanes(THREE, foundation, start, strips = PHASE_REVIEW_STRIPS) {
  const end = start + 100, pitch = 12.5;
  for (const strip of strips) {
    // Split on global module boundaries, retaining the same end caps when a
    // renderer chunk clips a module. Phase-review endpoints lie on this grid.
    for (let at = strip.start; at < strip.end; at += pitch) {
      const tail = Math.min(at + pitch, strip.end), a = Math.max(at,start), b = Math.min(tail,end);
      if (a >= b) continue;
      const kind = a === strip.start ? 'start' : b === strip.end ? 'end' : 'middle';
      const module = lane(THREE,{kind,phase:strip.phase,color:PHASES[strip.phase].hex,length:b-a,width:strip.width*36});
      // Lanes follow the same linear lateral path as stripCenter, including
      // their borders, symbols and fittings. The road adapter supplies bends.
      module.updateMatrixWorld(true);
      module.traverse(mesh => {
        if (!mesh.isMesh) return;
        mesh.geometry.applyMatrix4(mesh.matrixWorld);
        const p = mesh.geometry.attributes.position;
        for (let i=0;i<p.count;i++) {
          const s = (a+b)/2-p.getZ(i);
          p.setXYZ(i,p.getX(i)+stripCenter(strip,s)*18,p.getY(i)+.6,start+50-s);
        }
        mesh.position.set(0,0,0); mesh.rotation.set(0,0,0); mesh.geometry.computeVertexNormals();
      });
      foundation.add(module);
    }
  }
  // Edge location is visible during bare-road intervals; no centerline that
  // could be mistaken for a fourth phase lane.
  for (let s = Math.ceil(start/25)*25+2; s < end-1; s+=25) for (const side of [-1,1]) {
    const marker = edgeMarker(THREE); marker.position.set(side*17.45,.6,start+50-s); foundation.add(marker);
  }
}
