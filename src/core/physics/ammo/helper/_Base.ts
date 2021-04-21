import {CoreEntity} from '@polygonjs/polygonjs/dist/src/core/geometry/Entity';
import {AttribValue} from '@polygonjs/polygonjs/dist/src/types/GlobalTypes';
import Ammo from 'ammojs-typed';
import {CollisionFlag} from '../Constant';

export enum RBDAttribute {
	ATTRIBUTE_MODE = 'physicsAttributesMode',
	ACTIVE = 'active',
	ANGULAR_DAMPING = 'angularDamping',
	DAMPING = 'damping',
	FRICTION = 'friction',
	ID = 'id',
	MASS = 'mass',
	RESTITUTION = 'restitution',
	SIMULATED = 'simulated',
	SHAPE = 'shape',
	SHAPE_SIZE_SPHERE = 'shapeSizeSphere',
	SHAPE_SIZE_BOX = 'shapeSizeBox',
}
export enum RBDShape {
	BOX = 'box',
	// CAPSULE = 'capsule',
	// CONE = 'cone',
	// CYLINDER = 'cylinder',
	SPHERE = 'sphere',
}
export const RBD_SHAPES: Array<RBDShape> = [
	RBDShape.BOX,
	// RBDShape.CAPSULE,
	// RBDShape.CONE,
	// RBDShape.CYLINDER,
	RBDShape.SPHERE,
];

export abstract class RBDBaseHelper<E extends CoreEntity> {
	abstract createBody(corePoint: E): Ammo.btRigidBody;

	// It is crucial to make the body kinematic AFTER it being added to the physics world.
	// Otherwise, when it switches state, such as starting kinematic and then becoming dynamic,
	// It will not be assigned to the correct collition group, and therefore will not collide with
	// static bodies
	finalizeBody(body: Ammo.btRigidBody, core_object: E) {
		const active = this.readAttribute<boolean>(core_object, RBDAttribute.ACTIVE, true);
		if (!active) {
			//} || mass == 0) {
			this.makeKinematic(body);
		}

		// set transform
		this.transformBodyFromEntity(body, core_object);

		return body;
	}

	abstract transformBodyFromEntity(body: Ammo.btRigidBody, core_object: E): void;

	makeKinematic(body: Ammo.btRigidBody) {
		body.setCollisionFlags(CollisionFlag.KINEMATIC_OBJECT);
		// body.setActivationState(BodyState.DISABLE_DEACTIVATION);
	}
	makeActive(body: Ammo.btRigidBody, world: Ammo.btDiscreteDynamicsWorld) {
		body.setCollisionFlags(0);
		// in most tests, body.activate does not seem necessary.
		// But in some sims with 100+ RBDs (the number is not precise, it could be 60+)
		// some RBDs fail to change state when asked to do so,
		// unless body.activate is called
		body.activate(true);
		// body.setActivationState(BodyState.ACTIVE_TAG);
		// body.setMassProps(1, new Ammo.btVector3(0, 0, 0));
		// body.setGravity(world.getGravity());
	}
	isKinematic(body: Ammo.btRigidBody) {
		return body.isKinematicObject();
		// return body.getCollisionFlags() == CollisionFlag.KINEMATIC_OBJECT;
	}
	isActive(body: Ammo.btRigidBody) {
		// return body.isActive();
		return !this.isKinematic(body);
	}

	updateKinematicTransform(body: Ammo.btRigidBody, entity: E) {
		if (this.isKinematic(body)) {
			this.transformBodyFromEntity(body, entity);
		}
	}

	readAttribute<A extends AttribValue>(entity: E, attrib_name: string, default_value: A): A {
		const val = entity.attribValue(attrib_name) as A;
		if (val == null) {
			return default_value;
		} else {
			return val;
		}
	}
}
