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
import {isBooleanTrue} from '@polygonjs/polygonjs/dist/src/core/BooleanValue';
import {CorePoint} from '@polygonjs/polygonjs/dist/src/core/geometry/Point';
import {CoreEntity} from '@polygonjs/polygonjs/dist/src/core/geometry/Entity';

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
	tmass: boolean;
	mass: number;
	trestitution: boolean;
	restitution: number;
	tdamping: boolean;
	damping: number;
	tangularDamping: boolean;
	angularDamping: number;
	tfriction: boolean;
	friction: number;
	tsimulated: boolean;
	simulated: number;
	// sizes for point mode
	sizeBox: Vector3;
	sizeSphereDiameter: number;
}

export class PhysicsRbdAttributesSopOperation extends BaseSopOperation {
	static readonly DEFAULT_PARAMS: PhysicsRbdAttributesSopParams = {
		mode: RBD_ATTRIBUTE_MODES.indexOf(RBDAttributeMode.OBJECTS),
		active: true,
		shape: RBD_SHAPES.indexOf(RBDShape.BOX),
		addId: true,
		tmass: true,
		mass: 1,
		trestitution: true,
		restitution: 0.5,
		tdamping: true,
		damping: 0,
		tangularDamping: true,
		angularDamping: 0,
		tfriction: true,
		friction: 0.5,
		tsimulated: true,
		simulated: 1,
		sizeBox: new Vector3(1, 1, 1),
		sizeSphereDiameter: 1,
	};
	static readonly INPUT_CLONED_STATE = InputCloneMode.FROM_NODE;
	static type(): Readonly<'physicsRbdAttributes'> {
		return 'physicsRbdAttributes';
	}
	cook(input_contents: CoreGroup[], params: PhysicsRbdAttributesSopParams) {
		const core_objects = input_contents[0].coreObjects();
		for (let core_object of core_objects) {
			core_object.addAttribute(RBDAttribute.ATTRIBUTE_MODE, params.mode);
		}
		if (RBD_ATTRIBUTE_MODES[params.mode] == RBDAttributeMode.OBJECTS) {
			this._add_object_attributes(input_contents[0], params);
		} else {
			this._add_point_attributes(input_contents[0], params);
		}
		return input_contents[0];
	}

	private _add_object_attributes(core_group: CoreGroup, params: PhysicsRbdAttributesSopParams) {
		const core_objects = core_group.coreObjects();
		for (let core_object of core_objects) {
			this._addEntityAttribute(core_object, core_object.object().uuid, params);

			// shape
			this._add_object_shape_specific_attributes(core_object, params);
		}
	}
	private _bbox_size = new Vector3();
	private _object_t = new Vector3();
	private _object_q = new Quaternion();
	private _object_s = new Vector3();
	private _add_object_shape_specific_attributes(core_object: CoreObject, params: PhysicsRbdAttributesSopParams) {
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
		const points = core_group.points();
		const firstObjectUuid = core_group.objects()[0].uuid;

		// make sure to add attributes if they do not exist
		if (!core_group.hasAttrib(RBDAttribute.ACTIVE)) {
			core_group.addNumericVertexAttrib(RBDAttribute.ACTIVE, 1, params.active ? 1 : 0);
		}
		if (!core_group.hasAttrib(RBDAttribute.SHAPE)) {
			core_group.addNumericVertexAttrib(RBDAttribute.SHAPE, 1, params.shape);
		}
		if (!core_group.hasAttrib(RBDAttribute.MASS)) {
			if (isBooleanTrue(params.tmass)) {
				core_group.addNumericVertexAttrib(RBDAttribute.MASS, 1, params.mass);
			}
		}
		if (!core_group.hasAttrib(RBDAttribute.RESTITUTION)) {
			if (isBooleanTrue(params.trestitution)) {
				core_group.addNumericVertexAttrib(RBDAttribute.RESTITUTION, 1, params.restitution);
			}
		}
		if (!core_group.hasAttrib(RBDAttribute.DAMPING)) {
			if (isBooleanTrue(params.tdamping)) {
				core_group.addNumericVertexAttrib(RBDAttribute.DAMPING, 1, params.damping);
			}
		}
		if (!core_group.hasAttrib(RBDAttribute.ANGULAR_DAMPING)) {
			if (isBooleanTrue(params.tangularDamping)) {
				core_group.addNumericVertexAttrib(RBDAttribute.ANGULAR_DAMPING, 1, params.angularDamping);
			}
		}
		if (!core_group.hasAttrib(RBDAttribute.FRICTION)) {
			if (isBooleanTrue(params.tfriction)) {
				core_group.addNumericVertexAttrib(RBDAttribute.FRICTION, 1, params.friction);
			}
		}
		if (!core_group.hasAttrib(RBDAttribute.SIMULATED)) {
			if (isBooleanTrue(params.tsimulated)) {
				core_group.addNumericVertexAttrib(RBDAttribute.SIMULATED, 1, params.simulated);
			}
		}
		if (!core_group.hasAttrib(RBDAttribute.ID)) {
			if (isBooleanTrue(params.addId)) {
				core_group.addNumericVertexAttrib(RBDAttribute.ID, 1, 0);
			}
		}

		this._add_core_group_specific_attributes(core_group, params);

		let i = 0;
		for (let core_point of points) {
			// core_point.setAttribValue(RBDAttribute.ACTIVE, params.active ? 1 : 0);
			this._addEntityAttribute(core_point, `${firstObjectUuid}-${i}`, params);
			this._add_point_shape_specific_attributes(core_point, params);
			i++;
		}
	}

	private _addEntityAttribute(entity: CoreEntity, id: string, params: PhysicsRbdAttributesSopParams) {
		entity.setAttribValue(RBDAttribute.ACTIVE, params.active ? 1 : 0);
		entity.setAttribValue(RBDAttribute.SHAPE, params.shape);
		if (isBooleanTrue(params.tmass)) {
			entity.setAttribValue(RBDAttribute.MASS, params.mass);
		}
		if (isBooleanTrue(params.trestitution)) {
			entity.setAttribValue(RBDAttribute.RESTITUTION, params.restitution);
		}
		if (isBooleanTrue(params.tdamping)) {
			entity.setAttribValue(RBDAttribute.DAMPING, params.damping);
		}
		if (isBooleanTrue(params.tangularDamping)) {
			entity.setAttribValue(RBDAttribute.ANGULAR_DAMPING, params.angularDamping);
		}
		if (isBooleanTrue(params.tfriction)) {
			entity.setAttribValue(RBDAttribute.FRICTION, params.friction);
		}
		if (isBooleanTrue(params.tsimulated)) {
			entity.setAttribValue(RBDAttribute.SIMULATED, params.simulated);
		}

		if (isBooleanTrue(params.addId)) {
			// core_object.setAttribValue(RBDAttribute.ID, `${this.fullPath()}:${i}`);
			entity.setAttribValue(RBDAttribute.ID, id);
		}
	}
	private _add_core_group_specific_attributes(coreGroup: CoreGroup, params: PhysicsRbdAttributesSopParams) {
		const shape = RBD_SHAPES[params.shape];
		switch (shape) {
			case RBDShape.BOX: {
				coreGroup.addNumericVertexAttrib(RBDAttribute.SHAPE_SIZE_BOX, 3, params.sizeBox);
				return;
			}
			case RBDShape.SPHERE: {
				coreGroup.addNumericVertexAttrib(RBDAttribute.SHAPE_SIZE_SPHERE, 1, 1);
				return;
			}
		}
		TypeAssert.unreachable(shape);
	}
	private _add_point_shape_specific_attributes(corePoint: CorePoint, params: PhysicsRbdAttributesSopParams) {
		const shape = RBD_SHAPES[params.shape];
		switch (shape) {
			case RBDShape.BOX: {
				corePoint.setAttribValue(RBDAttribute.SHAPE_SIZE_BOX, params.sizeBox);
				return;
			}
			case RBDShape.SPHERE: {
				corePoint.setAttribValue(RBDAttribute.SHAPE_SIZE_SPHERE, params.sizeSphereDiameter);
				return;
			}
		}
		TypeAssert.unreachable(shape);
	}
}
