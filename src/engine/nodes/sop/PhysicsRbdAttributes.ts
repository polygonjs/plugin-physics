/**
 * Create RBD attributes to be used with the Ammo physics solver
 *
 * @remarks
 * TBD
 *
 *
 */
import {TypedSopNode} from 'polygonjs-engine/src/engine/nodes/sop/_Base';
import {InputCloneMode} from 'polygonjs-engine/src/engine/poly/InputCloneMode';
import {CoreGroup} from 'polygonjs-engine/src//core/geometry/Group';
import {RBDAttribute, RBD_SHAPES, RBDShape} from 'polygonjs-engine/src/core/physics/ammo/RBDBodyHelper';
import {Mesh} from 'three/src/objects/Mesh';
import {Vector3} from 'three/src/math/Vector3';
import {Quaternion} from 'three/src/math/Quaternion';
import {CoreObject} from 'polygonjs-engine/src/core/geometry/Object';
import {TypeAssert} from 'polygonjs-engine/src/engine/poly/Assert';

enum RBDAttributeMode {
	OBJECTS = 'objects',
	POINTS = 'points',
}
const RBD_ATTRIBUTE_MODES: Array<RBDAttributeMode> = [RBDAttributeMode.OBJECTS, RBDAttributeMode.POINTS];

import {NodeParamsConfig, ParamConfig} from 'polygonjs-engine/src/engine/nodes/utils/params/ParamsConfig';
class PhysicsRBDAttributesSopParamsConfig extends NodeParamsConfig {
	mode = ParamConfig.INTEGER(RBD_ATTRIBUTE_MODES.indexOf(RBDAttributeMode.OBJECTS), {
		menu: {
			entries: RBD_ATTRIBUTE_MODES.map((name, value) => {
				return {name, value};
			}),
		},
	});
	active = ParamConfig.BOOLEAN(1);
	shape = ParamConfig.INTEGER(RBD_SHAPES.indexOf(RBDShape.BOX), {
		menu: {
			entries: RBD_SHAPES.map((name, value) => {
				return {name: name, value: value};
			}),
		},
	});
	// shape_size_sphere = ParamConfig.FLOAT(1, {
	// 	visibleIf: {shape: RBD_SHAPES.indexOf(RBDShape.SPHERE)},
	// });
	// shape_size_box = ParamConfig.VECTOR3([1, 1, 1], {
	// 	visibleIf: {shape: RBD_SHAPES.indexOf(RBDShape.BOX)},
	// });
	add_id = ParamConfig.BOOLEAN(1);
	mass = ParamConfig.FLOAT(1);
	restitution = ParamConfig.FLOAT(0.5);
	damping = ParamConfig.FLOAT(0);
	angular_damping = ParamConfig.FLOAT(0);
	friction = ParamConfig.FLOAT(0.5);
	simulated = ParamConfig.FLOAT(1);
}
const ParamsConfig = new PhysicsRBDAttributesSopParamsConfig();

export class PhysicsRbdAttributesSopNode extends TypedSopNode<PhysicsRBDAttributesSopParamsConfig> {
	params_config = ParamsConfig;
	static type() {
		return 'physicsRbdAttributes';
	}

	initialize_node() {
		this.io.inputs.set_count(1);
		this.io.inputs.init_inputs_cloned_state(InputCloneMode.FROM_NODE);
	}

	cook(input_contents: CoreGroup[]) {
		if (RBD_ATTRIBUTE_MODES[this.pv.mode] == RBDAttributeMode.OBJECTS) {
			this._add_object_attributes(input_contents[0]);
		} else {
			this._add_point_attributes(input_contents[0]);
		}
		this.set_core_group(input_contents[0]);
	}

	private _add_object_attributes(core_group: CoreGroup) {
		const core_objects = core_group.core_objects();
		let core_object: CoreObject;
		for (let i = 0; i < core_objects.length; i++) {
			core_object = core_objects[i];
			core_object.set_attrib_value(RBDAttribute.ACTIVE, this.pv.active ? 1 : 0);
			core_object.set_attrib_value(RBDAttribute.MASS, this.pv.mass);
			core_object.set_attrib_value(RBDAttribute.RESTITUTION, this.pv.restitution);
			core_object.set_attrib_value(RBDAttribute.DAMPING, this.pv.damping);
			core_object.set_attrib_value(RBDAttribute.ANGULAR_DAMPING, this.pv.angular_damping);
			core_object.set_attrib_value(RBDAttribute.FRICTION, this.pv.friction);
			core_object.set_attrib_value(RBDAttribute.SIMULATED, this.pv.simulated);

			if (this.pv.add_id == true) {
				core_object.set_attrib_value(RBDAttribute.ID, `${this.fullPath()}:${i}`);
			}

			// shape
			this._add_object_shape_specific_attributes(core_object);
		}
	}
	private _bbox_size = new Vector3();
	private _object_t = new Vector3();
	private _object_q = new Quaternion();
	private _object_s = new Vector3();
	private _add_object_shape_specific_attributes(core_object: CoreObject) {
		core_object.set_attrib_value(RBDAttribute.SHAPE, this.pv.shape);
		const shape = RBD_SHAPES[this.pv.shape];
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
					core_object.set_attrib_value(RBDAttribute.SHAPE_SIZE_BOX, this._bbox_size);
				}
				return;
			}
			case RBDShape.SPHERE: {
				const geometry = object.geometry;
				geometry.computeBoundingSphere();
				const bounding_sphere = geometry.boundingSphere;
				if (bounding_sphere) {
					const diameter = 2 * bounding_sphere.radius * this._object_s.x;
					core_object.set_attrib_value(RBDAttribute.SHAPE_SIZE_SPHERE, diameter);
				}
				return;
			}
		}
		TypeAssert.unreachable(shape);
	}
	private _add_point_attributes(core_group: CoreGroup) {
		for (let core_point of core_group.points()) {
			core_point.set_attrib_value(RBDAttribute.ACTIVE, this.pv.active ? 1 : 0);
		}
	}
}
