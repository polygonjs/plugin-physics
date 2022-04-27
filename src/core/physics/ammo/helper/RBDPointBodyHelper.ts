import {Ammo} from './AmmoImport';
import {Vector3} from 'three';
import {Quaternion} from 'three';
import {TypeAssert} from '@polygonjs/polygonjs/dist/src/engine/poly/Assert';
import {CoreType} from '@polygonjs/polygonjs/dist/src/core/Type';
import {CorePoint} from '@polygonjs/polygonjs/dist/src/core/geometry/Point';
import {RBDAttribute, RBDShape, RBD_SHAPES} from './_Base';
import {CoreGeometry} from '@polygonjs/polygonjs/dist/src/core/geometry/Geometry';
import {InstanceAttrib} from '@polygonjs/polygonjs/dist/src/core/geometry/Instancer';
import {RBDBaseHelper} from './_Base';

export class AmmoRBDPointBodyHelper extends RBDBaseHelper<CorePoint> {
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

	private _t = new Vector3();
	private _q = new Quaternion();
	// private _s = new Vector3();
	transformBodyFromEntity(body: Ammo.btRigidBody, corePoint: CorePoint) {
		const position = this.readAttribute(corePoint, InstanceAttrib.POSITION, this._t);
		const orientation = this.readAttribute(corePoint, InstanceAttrib.ORIENTATION, this._q);

		const rbd_transform = body.getWorldTransform();
		const origin = rbd_transform.getOrigin();
		const rotation = rbd_transform.getRotation();
		origin.setValue(position.x, position.y, position.z);
		rotation.setValue(orientation.x, orientation.y, orientation.z, orientation.w);
		rotation.normalize();
		rbd_transform.setRotation(rotation);

		if (this.isKinematic(body)) {
			body.getMotionState().setWorldTransform(rbd_transform);
		}
	}
	private _read_t = new Ammo.btTransform();
	private _read_quat = new Quaternion();
	// private _read_mat4 = new Matrix4();
	// transform_core_object_from_body(object: Object3D, body: Ammo.btRigidBody) {
	// 	body.getMotionState().getWorldTransform(this._read_t);
	// 	const o = this._read_t.getOrigin();
	// 	const r = this._read_t.getRotation();
	// 	this._read_quat.set(r.x(), r.y(), r.z(), r.w());

	// 	object.position.set(o.x(), o.y(), o.z());
	// 	object.rotation.setFromQuaternion(this._read_quat);

	// 	if (!object.matrixAutoUpdate) {
	// 		object.updateMatrix();
	// 	}
	// }

	private _tv = new Vector3();
	transformPointsFromBodies(bodies: Ammo.btRigidBody[]) {
		let coreGeo: CoreGeometry | undefined;
		for (let body of bodies) {
			const corePoint = this._corePointByBody.get(body);
			if (corePoint) {
				coreGeo = coreGeo || corePoint.coreGeometry();
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
}
