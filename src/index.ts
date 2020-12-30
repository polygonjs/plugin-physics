import {Poly} from 'polygonjs-engine/src/engine/Poly';
import {CATEGORY_SOP} from 'polygonjs-engine/src/engine/poly/registers/nodes/Category';

import {ExtendedGeoNodeChildrenMap} from './ExtendedGeoNodeChildrenMap';
export {ExtendedGeoNodeChildrenMap};

import {OcclusionSopOperation} from './core/operations/sop/Occlusion';
import {PhysicsForceAttributesSopNode} from './engine/nodes/sop/PhysicsForceAttributes';
import {PhysicsRbdAttributesSopNode} from './engine/nodes/sop/PhysicsRbdAttributes';
import {PhysicsSolverSopNode} from './engine/nodes/sop/PhysicsSolver';
export function PolygonjsPluginPhysics(poly: Poly) {
	poly.registerOperation(OcclusionSopOperation);
	poly.registerNode(PhysicsForceAttributesSopNode, CATEGORY_SOP.PHYSICS);
	poly.registerNode(PhysicsRbdAttributesSopNode, CATEGORY_SOP.PHYSICS);
	poly.registerNode(PhysicsSolverSopNode, CATEGORY_SOP.PHYSICS);
}
