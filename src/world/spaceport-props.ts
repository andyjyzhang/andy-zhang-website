import * as T from 'three';
import {BrickBatch,sign} from './brick-kit';
import {PLATE as H,STUD as S,LDRAW_SCALE} from './part-catalog';
import {partGeometry} from './part-library';
import {consolidateStatic} from './consolidate';
import {blocked,type Obstacle} from './collision';
import type {ActivityDefinition} from '../interactions/activities';

export class SpaceportProps {
  readonly root=new T.Group();readonly staticObstacles:Obstacle[]=[];
  private drone=new T.Group();private crane=new T.Group();private crate=new T.Group();private bowl=new T.Group();private receiver=new T.Group();private core=new T.Group();
  private droneTime=10;private cargoTime=10;private dishTime=10;private cooling=false;private elapsed=0;
  private sweep=true;private lockedSignal=0;private indicator:T.InstancedMesh;private indicators=new Map<string,number>();
  private cargoReturning=false;
  private lamps:T.InstancedMesh;
  private tether=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:'#05131d'}));
  get signal(){return this.sweep?Math.floor(this.elapsed*1.8)%3:this.lockedSignal;}
  get coolingActive(){return this.cooling;}
  busy(id:string){return id==='repair'?this.droneTime<7:id==='cargo'?this.cargoTime<8:false;}
  unavailable(id:string,reduced:boolean,player?:{x:number;y:number;z:number}) {
    if(!reduced&&this.busy(id))return this.phase(id);
    if(id==='cargo'&&reduced&&player) {
      const returning=this.cargoTime<8?this.cargoReturning:this.crate.position.x>-66.24,x=returning?-67.84:-64.64,z=returning?39.68:36.48;
      if(blocked(player.x,player.z,.7,[{x,z,w:2.56,d:2.56,height:2.304}]))return 'Please clear the delivery pad before dispatching cargo.';
    }
    return '';
  }
  phase(id:string) {
    if(id==='repair')return this.droneTime<1.5?'Preflight complete. Lifting off.':this.droneTime<5?'Hover test in progress.':this.droneTime<7?'Returning to the test cradle.':'Drone test complete. Ready for another flight.';
    if(id==='cargo')return this.cargoTime<2?'Lifting the supply crate.':this.cargoTime<5.6?'Moving between loading pads.':this.cargoTime<8?'Lowering the crate. Delivery pad must stay clear.':'Cargo delivered. Gantry ready.';
    if(id==='radio')return this.dishTime<4?'Searching the sky. Receiver turning.':'Channel locked. Press E to tune again.';
    return '';
  }
  get obstacles():Obstacle[]{return [{x:this.crate.position.x,z:this.crate.position.z,w:2.56,d:2.56,bottom:this.crate.position.y,height:this.crate.position.y+1.536,label:'gantry cargo'}];}
  constructor(parent:T.Object3D,definitions:ActivityDefinition[]) {
    this.drone.name='survey-drone';this.crane.name='cargo-gantry-arm';this.crate.name='supply-crate';this.bowl.name='noodle-order';this.receiver.name='radio-receiver';this.core.name='cooling-rotor';
    this.root.name='spaceport-activities';parent.add(this.root);const fixed=new T.Group();this.root.add(fixed);const b=new BrickBatch();
    const selected=definitions.filter(d=>d.kind!=='crew'&&d.kind!=='arcade');
    this.indicator=new T.InstancedMesh(partGeometry('roundTile').clone().scale(LDRAW_SCALE,-LDRAW_SCALE,-LDRAW_SCALE),new T.MeshStandardMaterial({color:'white',emissive:'white',emissiveIntensity:.2,roughness:.2}),selected.length);
    const matrix=new T.Matrix4(),dummy=new T.Object3D();
    selected.forEach((a,i)=>{
      if(a.kind!=='facility') {
        b.stack('#0a3463',a.x,.512,a.z,2,9,2,'stud');
        b.obstacle({x:a.x,z:a.z,w:1.28,d:1.28,height:2.816,bottom:.512,label:`${a.kind} console`});
        sign(fixed,a.kind.toUpperCase(),a.x,2.304,a.z+.672,1.28,.64,'#05131d','#aee9ef');
      }
      dummy.position.set(a.x,3.072,a.z);dummy.rotation.set(0,0,0);dummy.updateMatrix();matrix.copy(dummy.matrix);
      this.indicator.setMatrixAt(i,matrix);this.indicator.setColorAt(i,new T.Color('#f2cd37'));this.indicators.set(a.id,i);
    });
    this.indicator.computeBoundingSphere();this.root.add(this.indicator);
    // Connected cooling rotor on the fixed core column.
    const rotor=new BrickBatch();rotor.stack('#05131d',0,0,0,6,1,2,'stud');rotor.stack('#008f9b',0,H,0,2,1,6,'stud');rotor.build(this.core);this.core.position.set(0,5.12,-3.84);this.root.add(this.core);
    b.stack('#9ba19d',25.6,.512,-26.24,4,7,4,'stud');b.obstacle({x:25.6,z:-26.24,w:2.56,d:2.56,height:2.304,bottom:.512,label:'drone cradle'});
    const drone=new BrickBatch();drone.stack('#05131d',0,0,0,6,1,2,'stud');drone.stack('#0a3463',0,H,0,2,1,6,'stud');drone.stack('#fe8a18',0,2*H,0,2,2,2,'stud');
    for(const x of [-2,2])for(const z of [-2,2])drone.mold('roundPlate','#9ba19d',x*S,3*H,z*S);drone.build(this.drone);this.drone.position.set(25.6,2.304,-26.24);this.root.add(this.drone);
    // Supply gantry rotates at a round-brick turntable, on a braced mast.
    b.stack('#05131d',-67.84,.512,36.48,6,2,6,'stud');b.stack('#9ba19d',-67.84,1.024,36.48,2,22,2,'stud');b.mold('roundBrick','#f2cd37',-67.84,7.424,36.48);
    b.obstacle({x:-67.84,z:36.48,w:3.84,d:3.84,height:8.192,bottom:.512,label:'gantry mast'});
    const arm=new BrickBatch();arm.stack('#f2cd37',0,0,1.28,2,3,10,'stud');for(const z of [-1.28,1.28,3.84])arm.stack('#05131d',0,3*H,z,2,2,1,'stud');arm.build(this.crane);this.crane.position.set(-67.84,8.192,36.48);this.root.add(this.crane);
    const crate=new BrickBatch();crate.stack('#fe8a18',0,0,0,4,6,4,'stud');for(const side of [-1,1])crate.stack('#0a3463',side*.96,0,0,1,6,4,'tile');crate.build(this.crate);this.crate.position.set(-67.84,.512,39.68);this.root.add(this.crate,this.tether);
    b.stack('#6074a1',-64.64,.512,36.48,6,1,6,'tile');
    b.stack('#0a3463',-69.12,.512,4.48,2,9,2,'stud');b.mold('dish','@cyan',-69.12,3.584,4.48);
    b.obstacle({x:-69.12,z:4.48,w:1.28,d:1.28,height:3.712,bottom:.512,label:'parcel scanner'});
    // Noodle vending hatch faces the market street.
    b.stack('#0a3463',60.16,.512,26.24,8,8,2,'stud');b.stack('#fe8a18',60.16,2.56,26.24,8,1,4,'tile');
    b.obstacle({x:60.16,z:26.24,w:5.12,d:2.56,height:2.816,bottom:.512,label:'noodle hatch'});
    const bowl=new BrickBatch();bowl.mold('dish','#f4f4f4',0,0,0);bowl.mold('roundTile','#f2cd37',0,0,0);bowl.mold('mug','#fe8a18',3*S,H,0);bowl.build(this.bowl);this.bowl.position.set(60.16,3.328,25.6);this.bowl.visible=false;this.root.add(this.bowl);
    b.stack('#9ba19d',-67.84,.512,68.48,4,9,4,'stud');b.mold('roundBrick','#0a3463',-67.84,3.584,68.48);
    b.obstacle({x:-67.84,z:68.48,w:2.56,d:2.56,height:4.352,bottom:.512,label:'receiver pedestal'});
    const receiver=new BrickBatch();receiver.stack('#008f9b',0,0,0,2,3,4,'stud');receiver.mold('sideStud','#008f9b',S/2,6*H,1.5*S);receiver.mold('dish','@cyan',S/2,6*H,3*S,0,-Math.PI/2);receiver.build(this.receiver);this.receiver.position.set(-67.84,3.584,68.48);this.root.add(this.receiver);
    b.build(fixed,'station-consoles-and-machinery');this.staticObstacles.push(...b.colliders);consolidateStatic(fixed);
    this.lamps=new T.InstancedMesh(partGeometry('roundTile').clone().scale(LDRAW_SCALE,-LDRAW_SCALE,-LDRAW_SCALE),new T.MeshStandardMaterial({color:'white',emissive:'white',emissiveIntensity:.3}),3);
    for(let i=0;i<3;i++) {dummy.position.set(-35.84+(i-1)*S,3.584,34.624);dummy.rotation.x=-Math.PI/2;dummy.updateMatrix();this.lamps.setMatrixAt(i,dummy.matrix);this.lamps.setColorAt(i,new T.Color('#1c2948'));}
    this.lamps.computeBoundingSphere();this.root.add(this.lamps);
  }
  activate(id:string,on:boolean,command:string,reduced:boolean) {
    if(this.busy(id)&&!reduced)return false;
    const index=this.indicators.get(id);if(index!==undefined){this.indicator.setColorAt(index,new T.Color(on?'#aee9ef':'#f2cd37'));this.indicator.instanceColor!.needsUpdate=true;}
    if(id==='reactor')this.cooling=on;
    if(id==='repair')this.droneTime=reduced?10:0;
    if(id==='cargo'&&this.cargoTime>=8){this.cargoReturning=this.crate.position.x>-66.24;this.cargoTime=reduced?10:0;}
    if(id==='noodles')this.bowl.visible=true;
    if(id==='radio'){this.dishTime=reduced?10:0;if(reduced)this.receiver.rotation.y+=Math.PI/3;}
    if(id==='arcade'){if(command==='stop'||command==='step'){this.lockedSignal=(this.signal+(command==='step'?1:0))%3;this.sweep=false;}else this.sweep=true;}
    if(reduced&&id==='cargo'){this.crate.position.set(this.cargoReturning?-67.84:-64.64,this.cargoReturning?.512:.768,this.cargoReturning?39.68:36.48);this.crane.rotation.y=this.cargoReturning?0:Math.PI/2;}
    return true;
  }
  update(dt:number,reduced:boolean,player?:{x:number;y:number;z:number}) {
    if(!reduced) {
      this.elapsed+=dt;if(this.cooling)this.core.rotation.y+=dt*1.8;
      this.droneTime+=dt;this.cargoTime+=dt;this.dishTime+=dt;
      if(this.droneTime<7) {const lift=Math.sin(Math.min(1,this.droneTime/7)*Math.PI);this.drone.position.y=2.304+lift*2.56;this.drone.rotation.y=Math.sin(this.droneTime*2)*.3;}else{this.drone.position.y=2.304;this.drone.rotation.y=0;}
      if(this.cargoTime<8) {
        const t=this.cargoTime/8,sweep=T.MathUtils.smoothstep(t,.3,.7),turn=this.cargoReturning?1-sweep:sweep,lift=T.MathUtils.smoothstep(t,0,.25)*(1-T.MathUtils.smoothstep(t,.75,1));
        const angle=turn*Math.PI/2,x=-67.84+3.2*Math.sin(angle),y=.512+.256*turn+5.12*lift,z=36.48+3.2*Math.cos(angle);
        if(player&&y<player.y+3.8&&y+1.536>player.y&&blocked(player.x,player.z,.7,[{x,z,w:2.56,d:2.56,height:y+1.536}]))this.cargoTime-=dt;
        else{this.crane.rotation.y=angle;this.crate.position.set(x,y,z);}
      }
      if(this.dishTime<4)this.receiver.rotation.y+=dt*.9;
    } else {
      this.drone.position.y=2.304;this.drone.rotation.y=0;this.droneTime=10;
      if(this.cargoTime<8&&!this.unavailable('cargo',true,player)) {
        this.crate.position.set(this.cargoReturning?-67.84:-64.64,this.cargoReturning?.512:.768,this.cargoReturning?39.68:36.48);
        this.crane.rotation.y=this.cargoReturning?0:Math.PI/2;this.cargoTime=10;
      }
    }
    const positions=this.tether.geometry.getAttribute('position');positions.setXYZ(0,this.crate.position.x,8.192,this.crate.position.z);positions.setXYZ(1,this.crate.position.x,this.crate.position.y+1.536,this.crate.position.z);positions.needsUpdate=true;this.tether.geometry.computeBoundingSphere();
    for(let i=0;i<3;i++)this.lamps.setColorAt(i,new T.Color(i===this.signal?['#aee9ef','#f2cd37','#fe8a18'][i]:'#1c2948'));
    this.lamps.instanceColor!.needsUpdate=true;
  }
}
