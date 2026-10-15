import * as T from 'three';
// Fold static assemblies/sign backings into one instanced draw per geometry/finish.
// Keep the four intro stages separate. Moving players/vehicles are never passed here.
export function consolidateStatic(root:T.Group,spatialCellSize=0) {
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
  if(spatialCellSize>0)partitionDenseDetail(root,spatialCellSize);
}

// A city-wide stud batch defeats frustum culling: every street camera submits
// all roof detail. Partition only dense, opaque, non-shadow batches, keeping
// shadows and transparent draw order intact. No pieces or geometry are removed.
function partitionDenseDetail(root:T.Group,size:number) {
  const meshes:T.InstancedMesh[]=[];
  root.traverse(o=>{if(o instanceof T.InstancedMesh)meshes.push(o);});
  const matrix=new T.Matrix4(),point=new T.Vector3(),color=new T.Color();
  for(const mesh of meshes) {
    const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    if(mesh.castShadow||mesh.count<512||materials.some(m=>m.transparent))continue;
    mesh.computeBoundingBox();const bounds=mesh.boundingBox!;
    if(Math.max(bounds.max.x-bounds.min.x,bounds.max.z-bounds.min.z)<size*2)continue;
    const cells=new Map<string,number[]>();
    for(let i=0;i<mesh.count;i++) {
      mesh.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);
      const key=`${Math.floor(point.x/size)}/${Math.floor(point.y/(size/2))}/${Math.floor(point.z/size)}`;
      if(!cells.has(key))cells.set(key,[]);cells.get(key)!.push(i);
    }
    if(cells.size<2)continue;
    for(const indices of cells.values()) {
      const chunk=new T.InstancedMesh(mesh.geometry,mesh.material,indices.length);
      chunk.name='spatial-brick-detail';chunk.position.copy(mesh.position);chunk.quaternion.copy(mesh.quaternion);chunk.scale.copy(mesh.scale);
      chunk.receiveShadow=mesh.receiveShadow;chunk.layers.mask=mesh.layers.mask;chunk.renderOrder=mesh.renderOrder;
      indices.forEach((source,i)=>{mesh.getMatrixAt(source,matrix);chunk.setMatrixAt(i,matrix);if(mesh.instanceColor){mesh.getColorAt(source,color);chunk.setColorAt(i,color);}});
      chunk.computeBoundingSphere();mesh.parent!.add(chunk);
    }
    mesh.removeFromParent();mesh.dispose();
  }
}

// Call only after stationary world assemblies are placed. Animated subtrees
// stay fully live; construction changes instance buffers, not these transforms.
export function freezeStaticTransforms(root:T.Object3D,dynamic:T.Object3D[]=[]) {
  root.updateWorldMatrix(true,true);const excluded=new Set(dynamic);
  const freeze=(object:T.Object3D)=>{
    if(excluded.has(object))return;
    object.matrixAutoUpdate=false;object.matrixWorldAutoUpdate=false;
    for(const child of object.children)freeze(child);
  };
  freeze(root);
}
