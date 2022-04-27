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
import {InstanceSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/Instance';
Poly.registerNode(InstanceSopNode);
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

import {polyPluginPhysics} from '../src/index';
import {Poly} from '@polygonjs/polygonjs/dist/src/engine/Poly';
Poly.registerPlugin(polyPluginPhysics);

import './helpers/setup';
import './tests';

QUnit.start();
