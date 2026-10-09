import * as T from 'three';
// Fold static assemblies/sign backings into one instanced draw per geometry/finish.
// Keep the four intro stages separate. Moving players/vehicles are never passed here.
export function consolidateStatic(root:T.Group) {
  root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert();
  const buckets=new Map<string,T.InstancedMesh[]>();
  root.traverse(o=>{if(o instanceof T.InstancedMesh){const material=Array.isArray(o.material)?o.material[0]:o.material;const key=`${o.geometry.uuid}/${material.uuid}/${o.castShadow}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key)!.push(o);}});
  const matrix=new T.Matrix4(),color=new T.Color();
  for(const sources of buckets.values()) {
    if(sources.length<2)continue;
    const first=sources[0],count=sources.reduce((sum,m)=>sum+m.count,0),merged=new T.InstancedMesh(first.geometry,first.material,count);let index=0;
    for(const source of sources) {
      const local=inverse.clone().multiply(source.matrixWorld);
      for(let i=0;i<source.count;i++){source.getMatrixAt(i,matrix);matrix.premultiply(local);merged.setMatrixAt(index,matrix);if(source.instanceColor){source.getColorAt(i,color);merged.setColorAt(index,color);}index++;}
      source.removeFromParent();source.dispose();
    }
    merged.castShadow=first.castShadow;merged.receiveShadow=true;merged.computeBoundingSphere();root.add(merged);
  }
}
