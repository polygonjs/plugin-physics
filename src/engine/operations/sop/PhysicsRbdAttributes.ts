import {BaseSopOperation} from '@polygonjs/polygonjs/dist/src/engine/operations/sop/_Base';
import {DefaultOperationParams} from '@polygonjs/polygonjs/dist/src/engine/operations/_Base';
import {CoreGroup} from '@polygonjs/polygonjs/dist/src/core/geometry/Group';
import {InputCloneMode} from '@polygonjs/polygonjs/dist/src/engine/poly/InputCloneMode';
import {Vector3} from 'three/src/math/Vector3';
import {Quaternion} from 'three/src/math/Quaternion';
import {Mesh} from 'three/src/objects/Mesh';
import {CoreObject} from '@polygonjs/polygonjs/dist/src/core/geometry/Object';
import {RBDAttribute, RBD_SHAPES, RBDShape} from '../../../core/physics/ammo/RBDBodyHelper';
import {TypeAssert} from '@polygonjs/polygonjs/dist/src/engine/poly/Assert';

export enum RBDAttributeMode {
	OBJECTS = 'objects',
	POINTS = 'points',
}
export const RBD_ATTRIBUTE_MODES: Array<RBDAttributeMode> = [RBDAttributeMode.OBJECTS, RBDAttributeMode.POINTS];

interface PhysicsRbdAttributesSopParams extends DefaultOperationParams {
	mode: number;
	active: boolean;
	shape: number;
	addId: boolean;
	mass: number;
	restitution: number;
	damping: number;
	angularDamping: number;
	friction: number;
	simulated: number;
}

export class PhysicsRbdAttributesSopOperation extends BaseSopOperation {
	static readonly DEFAULT_PARAMS: PhysicsRbdAttributesSopParams = {
		mode: RBD_ATTRIBUTE_MODES.indexOf(RBDAttributeMode.OBJECTS),
		active: true,
		shape: RBD_SHAPES.indexOf(RBDShape.BOX),
		addId: true,
		mass: 1,
		restitution: 0.5,
		damping: 0,
		angularDamping: 0,
		friction: 0.5,
		simulated: 1,
	};
	static readonly INPUT_CLONED_STATE = InputCloneMode.FROM_NODE;
	static type(): Readonly<'physicsRbdAttributes'> {
		return 'physicsRbdAttributes';
	}
	cook(input_contents: CoreGroup[], params: PhysicsRbdAttributesSopParams) {
		if (RBD_ATTRIBUTE_MODES[params.mode] == RBDAttributeMode.OBJECTS) {
			this._add_object_attributes(input_contents[0], params);
		} else {
			this._add_point_attributes(input_contents[0], params);
		}
		return input_contents[0];
	}

	private _add_object_attributes(core_group: CoreGroup, params: PhysicsRbdAttributesSopParams) {
		const core_objects = core_group.coreObjects();
		let core_object: CoreObject;
		for (let i = 0; i < core_objects.length; i++) {
			core_object = core_objects[i];
			core_object.setAttribValue(RBDAttribute.ACTIVE, params.active ? 1 : 0);
			core_object.setAttribValue(RBDAttribute.MASS, params.mass);
			core_object.setAttribValue(RBDAttribute.RESTITUTION, params.restitution);
			core_object.setAttribValue(RBDAttribute.DAMPING, params.damping);
			core_object.setAttribValue(RBDAttribute.ANGULAR_DAMPING, params.angularDamping);
			core_object.setAttribValue(RBDAttribute.FRICTION, params.friction);
			core_object.setAttribValue(RBDAttribute.SIMULATED, params.simulated);

			if (params.addId == true) {
				// core_object.setAttribValue(RBDAttribute.ID, `${this.fullPath()}:${i}`);
				core_object.setAttribValue(RBDAttribute.ID, core_object.object().uuid);
			}

			// shape
			this._add_object_shape_specific_attributes(core_object, params);
		}
	}
	private _bbox_size = new Vector3();
	private _object_t = new Vector3();
	private _object_q = new Quaternion();
	private _object_s = new Vector3();
	private _add_object_shape_specific_attributes(core_object: CoreObject, params: PhysicsRbdAttributesSopParams) {
		core_object.setAttribValue(RBDAttribute.SHAPE, params.shape);
		const shape = RBD_SHAPES[params.shape];
		const object = core_object.object() as Mesh;
		object.matrix.decompose(this._object_t, this._object_q, this._object_s);
		switch (shape) {
			case RBDShape.BOX: {
				const geometry = object.geometry;
				geometry.computeBoundingBox();
				const bbox = geometry.boundingBox;
				if (bbox) {
					bbox.getSize(this._bbox_size);
					this._bbox_size.multiply(this._object_s);
					core_object.setAttribValue(RBDAttribute.SHAPE_SIZE_BOX, this._bbox_size);
				}
				return;
			}
			case RBDShape.SPHERE: {
				const geometry = object.geometry;
				geometry.computeBoundingSphere();
				const bounding_sphere = geometry.boundingSphere;
				if (bounding_sphere) {
					const diameter = 2 * bounding_sphere.radius * this._object_s.x;
					core_object.setAttribValue(RBDAttribute.SHAPE_SIZE_SPHERE, diameter);
				}
				return;
			}
		}
		TypeAssert.unreachable(shape);
	}
	private _add_point_attributes(core_group: CoreGroup, params: PhysicsRbdAttributesSopParams) {
		for (let core_point of core_group.points()) {
			core_point.setAttribValue(RBDAttribute.ACTIVE, params.active ? 1 : 0);
		}
	}
}
