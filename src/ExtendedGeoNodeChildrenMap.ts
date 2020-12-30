import {GeoNodeChildrenMap} from 'polygonjs-engine/src/engine/poly/registers/nodes/Sop';
import {PhysicsForceAttributesSopNode} from './engine/nodes/sop/PhysicsForceAttributes';
import {PhysicsRbdAttributesSopNode} from './engine/nodes/sop/PhysicsRbdAttributes';
import {PhysicsSolverSopNode} from './engine/nodes/sop/PhysicsSolver';

export interface ExtendedGeoNodeChildrenMap extends GeoNodeChildrenMap {
	physicsForceAttributes: PhysicsForceAttributesSopNode;
	physicsRbdAttributes: PhysicsRbdAttributesSopNode;
	physicsSolver: PhysicsSolverSopNode;
}
