import {PolyEngine} from '@polygonjs/polygonjs/dist/src/engine/Poly';
import {CATEGORY_SOP} from '@polygonjs/polygonjs/dist/src/engine/poly/registers/nodes/Category';

import {PhysicsRbdAttributesSopOperation} from './engine/operations/sop/PhysicsRbdAttributes';
import {PhysicsForceAttributesSopNode} from './engine/nodes/sop/PhysicsForceAttributes';
import {PhysicsRbdAttributesSopNode} from './engine/nodes/sop/PhysicsRbdAttributes';
import {PhysicsSolverSopNode} from './engine/nodes/sop/PhysicsSolver';
import {PolyPlugin} from '@polygonjs/polygonjs/dist/src/engine/poly/registers/plugins/Plugin';
function PolygonjsPluginPhysics(poly: PolyEngine) {
	poly.registerOperation(PhysicsRbdAttributesSopOperation);
	poly.registerNode(PhysicsForceAttributesSopNode, CATEGORY_SOP.PHYSICS);
	poly.registerNode(PhysicsRbdAttributesSopNode, CATEGORY_SOP.PHYSICS);
	poly.registerNode(PhysicsSolverSopNode, CATEGORY_SOP.PHYSICS);
}
export const polyPluginPhysics = new PolyPlugin('physics', PolygonjsPluginPhysics, {
	libraryName: '@polygonjs/plugin-physics',
	libraryImportPath: '@polygonjs/plugin-physics/dist',
});
