import Ammo from 'ammojs-typed';
import {CollisionFlag} from './Constant';
import {Vector3} from 'three/src/math/Vector3';
import {Quaternion} from 'three/src/math/Quaternion';
import {TypeAssert} from '@polygonjs/polygonjs/dist/src/engine/poly/Assert';
import {Object3D} from 'three/src/core/Object3D';
import {AttribValue} from '@polygonjs/polygonjs/dist/src/types/GlobalTypes';
import {CoreType} from '@polygonjs/polygonjs/dist/src/core/Type';
import {CorePoint} from '@polygonjs/polygonjs/dist/src/core/geometry/Point';
import {RBDAttribute, RBDShape, RBD_SHAPES} from './RBDBodyHelper';
import {CoreGeometry} from '@polygonjs/polygonjs/dist/src/core/geometry/Geometry';
import {InstanceAttrib} from '@polygonjs/polygonjs/dist/src/core/geometry/Instancer';

export class AmmoRBDPointBodyHelper {
	private _default_shape_size_box: Vector3 = new Vector3(1, 1, 1);
	private _corePointByBody: WeakMap<Ammo.btRigidBody, CorePoint> = new WeakMap();
	createBody(corePoint: CorePoint) {
		// read attributes

		let mass = this.readAttribute<number>(corePoint, RBDAttribute.MASS, 1);
		// if (!active) {
		// 	mass = 0;
		// }
		const shape_index = this.readAttribute<number>(corePoint, RBDAttribute.SHAPE, RBD_SHAPES.indexOf(RBDShape.BOX));
		const restitution = this.readAttribute<number>(corePoint, RBDAttribute.RESTITUTION, 1);
		const damping = this.readAttribute<number>(corePoint, RBDAttribute.DAMPING, 1);
		const angular_damping = this.readAttribute<number>(corePoint, RBDAttribute.ANGULAR_DAMPING, 1);
		const friction = this.readAttribute<number>(corePoint, RBDAttribute.FRICTION, 0.5);

		// create body
		const startTransform = new Ammo.btTransform();
		startTransform.setIdentity();
		const localInertia = new Ammo.btVector3(0, 0, 0);

		const shape = this._findOrCreateShape(RBD_SHAPES[shape_index], corePoint);

		shape.calculateLocalInertia(mass, localInertia);
		const motion_state = new Ammo.btDefaultMotionState(startTransform);
		const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motion_state, shape, localInertia);
		const body = new Ammo.btRigidBody(rbInfo);
		this._corePointByBody.set(body, corePoint);

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
	finalizeBody(body: Ammo.btRigidBody, corePoint: CorePoint) {
		const active = this.readAttribute<boolean>(corePoint, RBDAttribute.ACTIVE, true);
		if (!active) {
			//} || mass == 0) {
			this.make_kinematic(body);
		}

		// set transform
		this.transformBodyFromPoint(body, corePoint);

		return body;
	}

	make_kinematic(body: Ammo.btRigidBody) {
		body.setCollisionFlags(CollisionFlag.KINEMATIC_OBJECT);
		// body.setActivationState(BodyState.DISABLE_DEACTIVATION);
	}
	make_active(body: Ammo.btRigidBody, world: Ammo.btDiscreteDynamicsWorld) {
		body.setCollisionFlags(0);
		// body.setActivationState(BodyState.ACTIVE_TAG);
		// body.activate(true);
		// body.setMassProps(1, new Ammo.btVector3(0, 0, 0));
		// body.setGravity(world.getGravity());
	}
	is_kinematic(body: Ammo.btRigidBody) {
		return body.isKinematicObject();
		// return body.getCollisionFlags() == CollisionFlag.KINEMATIC_OBJECT;
	}
	is_active(body: Ammo.btRigidBody) {
		// return body.isActive();
		return !this.is_kinematic(body);
	}

	private _t = new Vector3();
	private _q = new Quaternion();
	// private _s = new Vector3();
	transformBodyFromPoint(body: Ammo.btRigidBody, corePoint: CorePoint) {
		const position = this.readAttribute(corePoint, InstanceAttrib.POSITION, this._t);
		const orientation = this.readAttribute(corePoint, InstanceAttrib.ORIENTATION, this._q);

		const rbd_transform = body.getWorldTransform();
		const origin = rbd_transform.getOrigin();
		const rotation = rbd_transform.getRotation();
		origin.setValue(position.x, position.y, position.z);
		rotation.setValue(orientation.x, orientation.y, orientation.z, orientation.w);
		rotation.normalize();
		rbd_transform.setRotation(rotation);

		if (this.is_kinematic(body)) {
			body.getMotionState().setWorldTransform(rbd_transform);
		}
	}
	private _read_t = new Ammo.btTransform();
	private _read_quat = new Quaternion();
	// private _read_mat4 = new Matrix4();
	transform_core_object_from_body(object: Object3D, body: Ammo.btRigidBody) {
		body.getMotionState().getWorldTransform(this._read_t);
		const o = this._read_t.getOrigin();
		const r = this._read_t.getRotation();
		this._read_quat.set(r.x(), r.y(), r.z(), r.w());

		object.position.set(o.x(), o.y(), o.z());
		object.rotation.setFromQuaternion(this._read_quat);

		if (!object.matrixAutoUpdate) {
			object.updateMatrix();
		}
	}

	private _tv = new Vector3();
	transformPointsFromBodies(bodies: Ammo.btRigidBody[]) {
		let coreGeo: CoreGeometry | undefined;
		for (let body of bodies) {
			const corePoint = this._corePointByBody.get(body);
			if (corePoint) {
				coreGeo = coreGeo || corePoint.core_geometry();
				body.getMotionState().getWorldTransform(this._read_t);
				const o = this._read_t.getOrigin();
				const r = this._read_t.getRotation();
				this._read_quat.set(r.x(), r.y(), r.z(), r.w());

				this._tv.set(o.x(), o.y(), o.z());
				corePoint.setAttribValue(InstanceAttrib.POSITION, this._tv);
				corePoint.setAttribValue(InstanceAttrib.ORIENTATION, this._read_quat);
			}
		}
		if (coreGeo) {
			coreGeo.geometry().attributes[InstanceAttrib.POSITION].needsUpdate = true;
			coreGeo.geometry().attributes[InstanceAttrib.ORIENTATION].needsUpdate = true;
		}
	}

	private _findOrCreateShape(shape: RBDShape, corePoint: CorePoint): Ammo.btCollisionShape {
		switch (shape) {
			case RBDShape.BOX: {
				const shape_size = this.readAttribute(
					corePoint,
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
				const shape_size = this.readAttribute(corePoint, RBDAttribute.SHAPE_SIZE_SPHERE, 0.5);
				if (!CoreType.isNumber(shape_size)) {
					console.warn('shape_size attribute expected to be a number', shape_size);
				}
				return new Ammo.btSphereShape(shape_size * 0.5);
			}
		}
		TypeAssert.unreachable(shape);
	}

	readAttribute<A extends AttribValue>(corePoint: CorePoint, attrib_name: string, default_value: A): A {
		const val = corePoint.attribValue(attrib_name) as A;
		if (val == null) {
			return default_value;
		} else {
			return val;
		}
	}
}
