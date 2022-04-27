import {Ammo} from './AmmoImport';
import {CoreObject} from '@polygonjs/polygonjs/dist/src/core/geometry/Object';
import {Vector3} from 'three';
import {Quaternion} from 'three';
import {Matrix4} from 'three';
import {TypeAssert} from '@polygonjs/polygonjs/dist/src/engine/poly/Assert';
import {Object3D} from 'three';
import {CoreType} from '@polygonjs/polygonjs/dist/src/core/Type';
import {RBDBaseHelper} from './_Base';
import {RBDAttribute, RBDShape, RBD_SHAPES} from './_Base';

// also investigate btMultiSphereShape, btConvexHullShape, btCompoundShape, btConcaveShape, btConvexShape,

export class AmmoRBDBodyHelper extends RBDBaseHelper<CoreObject> {
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

	private _t = new Vector3();
	private _q = new Quaternion();
	private _s = new Vector3();
	transformBodyFromEntity(body: Ammo.btRigidBody, core_object: CoreObject) {
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
	transformEntityFromBody(object: Object3D, body: Ammo.btRigidBody) {
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
}
