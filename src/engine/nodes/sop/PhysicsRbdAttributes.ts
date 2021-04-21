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
import {
	PhysicsRbdAttributesSopOperation,
	RBD_ATTRIBUTE_MODES,
	RBDAttributeMode,
} from '../../operations/sop/PhysicsRbdAttributes';
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
	tmass = ParamConfig.BOOLEAN(DEFAULT.tmass, {separatorBefore: true});
	mass = ParamConfig.FLOAT(DEFAULT.mass, {visibleIf: {tmass: 1}});
	trestitution = ParamConfig.BOOLEAN(DEFAULT.trestitution, {separatorBefore: true});
	restitution = ParamConfig.FLOAT(DEFAULT.restitution, {visibleIf: {trestitution: 1}});
	tdamping = ParamConfig.BOOLEAN(DEFAULT.tdamping, {separatorBefore: true});
	damping = ParamConfig.FLOAT(DEFAULT.damping, {visibleIf: {tdamping: 1}});
	tangularDamping = ParamConfig.BOOLEAN(DEFAULT.tangularDamping, {separatorBefore: true});
	angularDamping = ParamConfig.FLOAT(DEFAULT.angularDamping, {visibleIf: {tangularDamping: 1}});
	tfriction = ParamConfig.BOOLEAN(DEFAULT.tfriction, {separatorBefore: true});
	friction = ParamConfig.FLOAT(DEFAULT.friction, {visibleIf: {tfriction: 1}});
	tsimulated = ParamConfig.BOOLEAN(DEFAULT.tsimulated, {separatorBefore: true});
	simulated = ParamConfig.FLOAT(DEFAULT.simulated, {visibleIf: {tsimulated: 1}});
	sizeBox = ParamConfig.VECTOR3(DEFAULT.sizeBox.toArray(), {
		separatorBefore: true,
		visibleIf: {mode: RBD_ATTRIBUTE_MODES.indexOf(RBDAttributeMode.POINTS)},
	});
	sizeSphereDiameter = ParamConfig.FLOAT(DEFAULT.sizeSphereDiameter, {
		visibleIf: {mode: RBD_ATTRIBUTE_MODES.indexOf(RBDAttributeMode.POINTS)},
	});
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

	setMode(mode: RBDAttributeMode) {
		this.p.mode.set(RBD_ATTRIBUTE_MODES.indexOf(mode));
	}

	private _operation: PhysicsRbdAttributesSopOperation | undefined;
	cook(input_contents: CoreGroup[]) {
		this._operation = this._operation || new PhysicsRbdAttributesSopOperation(this._scene, this.states);
		const core_group = this._operation.cook(input_contents, this.pv);
		this.setCoreGroup(core_group);
	}
}
