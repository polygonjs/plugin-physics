import {Poly} from '@polygonjs/polygonjs/dist/src/engine/Poly';
import {PolyScene} from '@polygonjs/polygonjs/dist/src/engine/scene/PolyScene';
import {ExtendedGeoObjNode} from './engine/nodes/obj/ExtendedGeo';

// register all nodes
// import {AllRegister} from '@polygonjs/polygonjs/dist/src/engine/poly/registers/All';
// AllRegister.run();
import {AllAssemblersRegister} from '@polygonjs/polygonjs/dist/src/engine/poly/registers/assemblers/All';
AllAssemblersRegister.run(Poly);
import {AllCamerasRegister} from '@polygonjs/polygonjs/dist/src/engine/poly/registers/cameras/All';
import {AllExpressionsRegister} from '@polygonjs/polygonjs/dist/src/engine/poly/registers/expressions/All';
AllCamerasRegister.run(Poly);
AllExpressionsRegister.run(Poly);
import {GeoObjNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/obj/Geo';
import {AddSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/Add';
import {MaterialSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/Material';
import {TextSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/Text';
import {TransformSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/Transform';
import {CopySopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/Copy';
import {MaterialsNetworkObjNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/obj/MaterialsNetwork';
import {MaterialsNetworkSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/MaterialsNetwork';
import {MeshLambertMatNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/mat/MeshLambert';
import {HemisphereLightObjNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/obj/HemisphereLight';
import {CopNetworkObjNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/obj/CopNetwork';
import {WebCamCopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/cop/WebCam';
import {MeshBasicMatNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/mat/MeshBasic';
import {BoxSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/Box';
import {EventsNetworkSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/EventsNetwork';
import {PerspectiveCameraObjNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/obj/PerspectiveCamera';
import {CameraOrbitControlsEventNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/event/CameraOrbitControls';
import {SphereSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/Sphere';
import {PlaneSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/Plane';
import {MergeSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/Merge';
import {MeshBasicBuilderMatNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/mat/MeshBasicBuilder';
import {RoundedBoxSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/RoundedBox';
import {JitterSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/Jitter';
import {AttribCreateSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/AttribCreate';
import {TransformResetSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/TransformReset';
Poly.registerNode(TransformResetSopNode);
Poly.registerNode(AttribCreateSopNode);
Poly.registerNode(JitterSopNode);
Poly.registerNode(RoundedBoxSopNode);
Poly.registerNode(MeshBasicBuilderMatNode);
Poly.registerNode(MergeSopNode);
Poly.registerNode(PlaneSopNode);
Poly.registerNode(SphereSopNode);
Poly.registerNode(PerspectiveCameraObjNode);
Poly.registerNode(CameraOrbitControlsEventNode);
Poly.registerNode(EventsNetworkSopNode);
Poly.registerNode(BoxSopNode);
Poly.registerNode(MeshBasicMatNode);
Poly.registerNode(WebCamCopNode);
Poly.registerNode(CopNetworkObjNode);
Poly.registerNode(GeoObjNode);
Poly.registerNode(AddSopNode);
Poly.registerNode(MaterialSopNode);
Poly.registerNode(TextSopNode);
Poly.registerNode(TransformSopNode);
Poly.registerNode(CopySopNode);
Poly.registerNode(MaterialsNetworkObjNode);
Poly.registerNode(MaterialsNetworkSopNode);
Poly.registerNode(MeshLambertMatNode);
Poly.registerNode(HemisphereLightObjNode);

// register nodes for this plugin
import {polyPluginPhysics} from './index';
import {TransformTargetType} from '@polygonjs/polygonjs/dist/src/core/Transform';
import {TransformObjectMode} from '@polygonjs/polygonjs/dist/src/engine/operations/sop/Transform';
Poly.registerPlugin(polyPluginPhysics);

// create a scene
const scene = new PolyScene();

// create a box
const geo = scene.root().createNode('geo') as ExtendedGeoObjNode;
const box = geo.createNode('roundedBox');
box.p.size.set([0.63, 0.63, 0.63]);

// create points to instantiate boxes onto
const plane = geo.createNode('plane');
plane.p.size.set([8, 8]);
const planeTransform = geo.createNode('transform');
planeTransform.setInput(0, plane);
planeTransform.p.t.y.set(3);
const jitter = geo.createNode('jitter');
jitter.setInput(0, planeTransform);
jitter.p.amount.set(2.8);

// instantiate boxes
const copy = geo.createNode('copy');
copy.setInput(0, box);
copy.setInput(1, jitter);

// add physics attributes
const boxPhysicsAttributes = geo.createNode('physicsRbdAttributes');
boxPhysicsAttributes.setInput(0, copy);
// vary the restitution
const boxAttribCreateRestitution = geo.createNode('attribCreate');
boxAttribCreateRestitution.setInput(0, boxPhysicsAttributes);
boxAttribCreateRestitution.p.name.set('restitution');
boxAttribCreateRestitution.p.value1.set('rand(@ptnum+254)');

// rotate boxes
const boxTransform = geo.createNode('transform');
boxTransform.setInput(0, boxAttribCreateRestitution);
boxTransform.setApplyOn(TransformTargetType.OBJECTS);
boxTransform.setObjectMode(TransformObjectMode.UPDATE_MATRIX);
boxTransform.p.r.x.set(35);

// create ground
const boxGround = geo.createNode('box');
const boxGroundTransform = geo.createNode('transform');
boxGroundTransform.setInput(0, boxGround);
boxGroundTransform.p.t.y.set(-2);
boxGroundTransform.p.s.set([5, 1, 50]);
const boxGroundTransformReset = geo.createNode('transformReset');
boxGroundTransformReset.setInput(0, boxGroundTransform);
boxGroundTransformReset.p.mode.set(2);
const groundPhysicsAttributes = geo.createNode('physicsRbdAttributes');
groundPhysicsAttributes.setInput(0, boxGroundTransformReset);
groundPhysicsAttributes.p.active.set(0);
groundPhysicsAttributes.p.mass.set(100000); // inactive objects currently require a high mass

// merge objects
const merge = geo.createNode('merge');
merge.p.compact.set(0);
merge.setInput(0, groundPhysicsAttributes);
merge.setInput(1, boxTransform);
merge.flags.display.set(true);

// create solver
const physicsSolver = geo.createNode('physicsSolver');
physicsSolver.setInput(0, merge);
physicsSolver.flags.display.set(true);

// add a light
scene.root().createNode('hemisphereLight');

// create a camera
const perspectiveCamera1 = scene.root().createNode('perspectiveCamera');
perspectiveCamera1.p.t.set([15, 15, 15]);
// add orbitControls
const events1 = perspectiveCamera1.createNode('eventsNetwork');
const orbitsControls = events1.createNode('cameraOrbitControls');
perspectiveCamera1.p.controls.setNode(orbitsControls);

perspectiveCamera1.createViewer(document.getElementById('app')!);

scene.play();

// make some nodes globals to access in html controls
(window as any).scene = scene;
(window as any).plane = plane;
