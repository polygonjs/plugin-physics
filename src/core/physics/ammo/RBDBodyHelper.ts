import Ammo from 'ammojs-typed';
import {CollisionFlag} from './Constant';
import {CoreObject} from '@polygonjs/polygonjs/dist/src/core/geometry/Object';
import {Vector3} from 'three/src/math/Vector3';
import {Quaternion} from 'three/src/math/Quaternion';
import {Matrix4} from 'three/src/math/Matrix4';
import {TypeAssert} from '@polygonjs/polygonjs/dist/src/engine/poly/Assert';
import {Object3D} from 'three/src/core/Object3D';
import {AttribValue} from '@polygonjs/polygonjs/dist/src/types/GlobalTypes';
import {CoreType} from '@polygonjs/polygonjs/dist/src/core/Type';

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
// also investigate btMultiSphereShape, btConvexHullShape, btCompoundShape, btConcaveShape, btConvexShape,

export class AmmoRBDBodyHelper {
	private _default_shape_size_box: Vector3 = new Vector3(1, 1, 1);
	createBody(core_object: CoreObject) {
		// read attributes

		let mass = this.readAttribute<number>(core_object, RBDAttribute.MASS, 1);
		// if (!active) {
		// 	mass = 0;
		// }
		const shape_index = this.readAttribute<number>(
			core_object,
			RBDAttribute.SHAPE,
			RBD_SHAPES.indexOf(RBDShape.BOX)
		);
		const restitution = this.readAttribute<number>(core_object, RBDAttribute.RESTITUTION, 1);
		const damping = this.readAttribute<number>(core_object, RBDAttribute.DAMPING, 1);
		const angular_damping = this.readAttribute<number>(core_object, RBDAttribute.ANGULAR_DAMPING, 1);
		const friction = this.readAttribute<number>(core_object, RBDAttribute.FRICTION, 0.5);

		// create body
		const startTransform = new Ammo.btTransform();
		startTransform.setIdentity();
		const localInertia = new Ammo.btVector3(0, 0, 0);

		const shape = this._findOrCreateShape(RBD_SHAPES[shape_index], core_object);

		shape.calculateLocalInertia(mass, localInertia);
		const motion_state = new Ammo.btDefaultMotionState(startTransform);
		const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motion_state, shape, localInertia);
		const body = new Ammo.btRigidBody(rbInfo);

		// apply attributes
		body.setRestitution(restitution);
		body.setDamping(damping, angular_damping);
		body.setFriction(friction);
		return body;
	}
	// It is crucial to make the body kinematic AFTER it being added to the physics world.
	// Otherwise, when it switches state, such as starting kinematic and then becoming dynamic,
	// It will not be assigned to the correct collition group, and therefore will not collide with
	// static bodies
	finalizeBody(body: Ammo.btRigidBody, core_object: CoreObject) {
		const active = this.readAttribute<boolean>(core_object, RBDAttribute.ACTIVE, true);
		if (!active) {
			//} || mass == 0) {
			this.makeKinematic(body);
		}

		// set transform
		this.transformBodyFromCoreObject(body, core_object);

		return body;
	}

	makeKinematic(body: Ammo.btRigidBody) {
		body.setCollisionFlags(CollisionFlag.KINEMATIC_OBJECT);
		// body.setActivationState(BodyState.DISABLE_DEACTIVATION);
	}
	makeActive(body: Ammo.btRigidBody, world: Ammo.btDiscreteDynamicsWorld) {
		body.setCollisionFlags(0);
		// body.setActivationState(BodyState.ACTIVE_TAG);
		// body.activate(true);
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

	private _t = new Vector3();
	private _q = new Quaternion();
	private _s = new Vector3();
	transformBodyFromCoreObject(body: Ammo.btRigidBody, core_object: CoreObject) {
		const matrix = core_object.object().matrix;
		matrix.decompose(this._t, this._q, this._s);

		const rbd_transform = body.getWorldTransform();
		const origin = rbd_transform.getOrigin();
		const rotation = rbd_transform.getRotation();
		origin.setValue(this._t.x, this._t.y, this._t.z);
		rotation.setValue(this._q.x, this._q.y, this._q.z, this._q.w);
		rotation.normalize();
		rbd_transform.setRotation(rotation);

		if (this.isKinematic(body)) {
			body.getMotionState().setWorldTransform(rbd_transform);
		}
	}
	private _read_t = new Ammo.btTransform();
	private _read_quat = new Quaternion();
	private _read_mat4 = new Matrix4();
	transformCoreObjectFromBody(object: Object3D, body: Ammo.btRigidBody) {
		body.getMotionState().getWorldTransform(this._read_t);
		const o = this._read_t.getOrigin();
		const r = this._read_t.getRotation();
		this._read_quat.set(r.x(), r.y(), r.z(), r.w());

		this._read_mat4.identity();
		object.position.set(o.x(), o.y(), o.z());
		object.rotation.setFromQuaternion(this._read_quat);

		if (!object.matrixAutoUpdate) {
			object.updateMatrix();
		}
	}

	private _findOrCreateShape(shape: RBDShape, core_object: CoreObject): Ammo.btCollisionShape {
		switch (shape) {
			case RBDShape.BOX: {
				const shape_size = this.readAttribute(
					core_object,
					RBDAttribute.SHAPE_SIZE_BOX,
					this._default_shape_size_box
				);
				if (
					!(
						CoreType.isNumber(shape_size.x) &&
						CoreType.isNumber(shape_size.y) &&
						CoreType.isNumber(shape_size.z)
					)
				) {
					console.warn('shape_size attribute expected to be a vector', shape_size);
				}

				const size_v = new Ammo.btVector3(shape_size.x * 0.5, shape_size.y * 0.5, shape_size.z * 0.5);
				return new Ammo.btBoxShape(size_v);
			}
			case RBDShape.SPHERE: {
				const shape_size = this.readAttribute(core_object, RBDAttribute.SHAPE_SIZE_SPHERE, 0.5);
				if (!CoreType.isNumber(shape_size)) {
					console.warn('shape_size attribute expected to be a number', shape_size);
				}
				return new Ammo.btSphereShape(shape_size * 0.5);
			}
		}
		TypeAssert.unreachable(shape);
	}

	readAttribute<A extends AttribValue>(core_object: CoreObject, attrib_name: string, default_value: A): A {
		const val = core_object.attribValue(attrib_name) as A;
		if (val == null) {
			return default_value;
		} else {
			return val;
		}
	}
}
