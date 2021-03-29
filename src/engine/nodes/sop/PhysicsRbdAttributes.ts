/**
 * Create RBD attributes to be used with the Ammo physics solver
 *
 * @remarks
 * TBD
 *
 *
 */
import {TypedSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/_Base';
import {InputCloneMode} from '@polygonjs/polygonjs/dist/src/engine/poly/InputCloneMode';
import {CoreGroup} from '@polygonjs/polygonjs/dist/src/core/geometry/Group';
import {RBD_SHAPES} from '../../../core/physics/ammo/RBDBodyHelper';
import {PhysicsRbdAttributesSopOperation, RBD_ATTRIBUTE_MODES} from '../../operations/sop/PhysicsRbdAttributes';
import {NodeParamsConfig, ParamConfig} from '@polygonjs/polygonjs/dist/src/engine/nodes/utils/params/ParamsConfig';
const DEFAULT = PhysicsRbdAttributesSopOperation.DEFAULT_PARAMS;
class PhysicsRBDAttributesSopParamsConfig extends NodeParamsConfig {
	mode = ParamConfig.INTEGER(DEFAULT.mode, {
		menu: {
			entries: RBD_ATTRIBUTE_MODES.map((name, value) => {
				return {name, value};
			}),
		},
	});
	active = ParamConfig.BOOLEAN(DEFAULT.active);
	shape = ParamConfig.INTEGER(DEFAULT.shape, {
		menu: {
			entries: RBD_SHAPES.map((name, value) => {
				return {name: name, value: value};
			}),
		},
	});
	// shapeSizeSphere = ParamConfig.FLOAT(1, {
	// 	visibleIf: {shape: RBD_SHAPES.indexOf(RBDShape.SPHERE)},
	// });
	// shapeSizeBox = ParamConfig.VECTOR3([1, 1, 1], {
	// 	visibleIf: {shape: RBD_SHAPES.indexOf(RBDShape.BOX)},
	// });
	addId = ParamConfig.BOOLEAN(DEFAULT.addId);
	mass = ParamConfig.FLOAT(DEFAULT.mass);
	restitution = ParamConfig.FLOAT(DEFAULT.restitution);
	damping = ParamConfig.FLOAT(DEFAULT.damping);
	angularDamping = ParamConfig.FLOAT(DEFAULT.angularDamping);
	friction = ParamConfig.FLOAT(DEFAULT.friction);
	simulated = ParamConfig.FLOAT(DEFAULT.simulated);
}
const ParamsConfig = new PhysicsRBDAttributesSopParamsConfig();

export class PhysicsRbdAttributesSopNode extends TypedSopNode<PhysicsRBDAttributesSopParamsConfig> {
	paramsConfig = ParamsConfig;
	static type() {
		return 'physicsRbdAttributes';
	}

	initializeNode() {
		this.io.inputs.setCount(1);
		this.io.inputs.initInputsClonedState(InputCloneMode.FROM_NODE);
	}

	private _operation: PhysicsRbdAttributesSopOperation | undefined;
	cook(input_contents: CoreGroup[]) {
		this._operation = this._operation || new PhysicsRbdAttributesSopOperation(this._scene, this.states);
		const core_group = this._operation.cook(input_contents, this.pv);
		this.setCoreGroup(core_group);
	}
}
