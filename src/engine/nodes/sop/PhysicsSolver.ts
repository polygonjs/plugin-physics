/**
 * Applies physics with the Ammo physics solver
 *
 * @remarks
 * TBD
 *
 *
 */
// https://stackblitz.com/edit/ammojs-typed-falling-cubes?file=simulation.ts
import {TypedSopNode} from 'polygonjs-engine/src/engine/nodes/sop/_Base';
import {CoreGroup} from 'polygonjs-engine/src/core/geometry/Group';
import {AmmoRBDBodyHelper, RBDAttribute} from '../../../core/physics/ammo/RBDBodyHelper';
import {BaseNodeType} from 'polygonjs-engine/src/engine/nodes/_Base';
import {CoreObject} from 'polygonjs-engine/src/core/geometry/Object';
import {CorePoint} from 'polygonjs-engine/src/core/geometry/Point';
import {AmmoForceHelper} from '../../../core/physics/ammo/ForceHelper';
import Ammo from 'ammojs-typed';

const NULL_ID = '';
import {PhysicsSolverSopOperation} from '../../../core/operations/sop/PhysicsSolver';
import {NodeParamsConfig, ParamConfig} from 'polygonjs-engine/src/engine/nodes/utils/params/ParamsConfig';
import {Object3D} from 'three/src/core/Object3D';
import {CoreType} from 'polygonjs-engine/src/core/Type';
const DEFAULT = PhysicsSolverSopOperation.DEFAULT_PARAMS;
class AmmoSolverSopParamsConfig extends NodeParamsConfig {
	startFrame = ParamConfig.INTEGER(DEFAULT.startFrame);
	gravity = ParamConfig.VECTOR3(DEFAULT.gravity.toArray());
	maxSubsteps = ParamConfig.INTEGER(DEFAULT.maxSubsteps, {
		range: [1, 10],
		rangeLocked: [true, false],
	});
	reset = ParamConfig.BUTTON(null, {
		callback: (node: BaseNodeType) => {
			PhysicsSolverSopNode.PARAM_CALLBACK_reset(node as PhysicsSolverSopNode);
		},
	});
}
const ParamsConfig = new AmmoSolverSopParamsConfig();

export class PhysicsSolverSopNode extends TypedSopNode<AmmoSolverSopParamsConfig> {
	params_config = ParamsConfig;
	static type() {
		return 'physicsSolver';
	}
	private config: Ammo.btDefaultCollisionConfiguration | undefined;
	private dispatcher: Ammo.btCollisionDispatcher | undefined;
	private overlappingPairCache: Ammo.btDbvtBroadphase | undefined;
	private solver: Ammo.btSequentialImpulseConstraintSolver | undefined;
	private world: Ammo.btDiscreteDynamicsWorld | undefined;
	private bodies: Ammo.btRigidBody[] = [];
	// private boxShape: Ammo.btBoxShape | undefined;
	// private sphereShape: Ammo.btSphereShape | undefined;
	// private transform: Ammo.btTransform | undefined;
	private _gravity: Ammo.btVector3 | undefined;
	private _bodies_by_id: Map<string, Ammo.btRigidBody> = new Map();
	private _bodies_active_state_by_id: Map<string, boolean> = new Map();
	// helpers
	private _body_helper: AmmoRBDBodyHelper | undefined;
	private _force_helper: AmmoForceHelper | undefined;
	// inputs
	private _input_init: CoreObject[] | undefined;
	private _input_force_points: CorePoint[] | undefined;
	private _input_attributes_update: CoreObject[] | undefined;
	private _objects_with_RBDs: Object3D[] = [];

	static displayed_input_names(): string[] {
		return ['RBDs', 'Forces', 'Updated RBD Attributes'];
	}

	initialize_node() {
		this.io.inputs.set_count(1, 3);

		// this has to clone for now, to allow for reposition the input core_objects
		// when re-initializing the sim. If we do not clone, the objects will be modified,
		// and therefore the reseting the transform of the RBDs will be based on moved objects, which is wrong. Oh so very wrong.
		// But we also set the cook controller to disallow_inputs_evaluation
		// to ensure it is not cloned on every frame
		this.io.inputs.init_inputs_cloned_state(PhysicsSolverSopOperation.INPUT_CLONED_STATE);
		this.cook_controller.disallow_inputs_evaluation();

		// physics
		this.add_graph_input(this.scene.time_controller.graph_node);
		Ammo(Ammo).then(() => {
			this.prepare();
		});
	}
	prepare() {
		this._body_helper = new AmmoRBDBodyHelper();
		this._force_helper = new AmmoForceHelper();
		this.config = new Ammo.btDefaultCollisionConfiguration();
		this.dispatcher = new Ammo.btCollisionDispatcher(this.config);
		this.overlappingPairCache = new Ammo.btDbvtBroadphase();
		this.solver = new Ammo.btSequentialImpulseConstraintSolver();
		this.world = new Ammo.btDiscreteDynamicsWorld(
			this.dispatcher,
			this.overlappingPairCache,
			this.solver,
			this.config
		);
		this.world.setGravity(new Ammo.btVector3(0, -10, 0));
		this._gravity = new Ammo.btVector3(0, 0, 0);
	}

	async cook(input_contents: CoreGroup[]) {
		if (this.scene.frame == this.pv.startFrame) {
			this.reset();
		}
		if (!this._input_init) {
			this._input_init = await this._fetch_input_objects(0);
			this.init();
			// this.createGroundShape();
		}
		// if (this.pv.emit_every_frame && this.scene.frame != this.pv.start_frame) {
		// 	this.check_for_new_RBDs(input_contents[0]);
		// }

		this._input_force_points = await this._fetch_input_points(1);
		this._input_attributes_update = await this._fetch_input_objects(2);
		this.simulate(0.05);
		this.set_objects(this._objects_with_RBDs);
	}

	private async _fetch_input_objects(input_index: number) {
		const input_node = this.io.inputs.input(input_index);
		if (input_node) {
			const container = await this.container_controller.request_input_container(input_index);
			if (container) {
				const core_group = container.core_content_cloned();
				if (core_group) {
					return core_group.core_objects();
				}
			}
		}
		return [];
	}
	private async _fetch_input_points(input_index: number) {
		const input_node = this.io.inputs.input(input_index);
		if (input_node) {
			const container = await this.container_controller.request_input_container(input_index);
			if (container) {
				const core_group = container.core_content_cloned();
				if (core_group) {
					return core_group.points();
				}
			}
		}
		return undefined;
	}

	// protected createGroundShape() {
	// 	if (!this.world) {
	// 		return;
	// 	}
	// 	const shape = new Ammo.btBoxShape(new Ammo.btVector3(50, 1, 50));
	// 	const transform = new Ammo.btTransform();
	// 	transform.setIdentity();
	// 	transform.setOrigin(new Ammo.btVector3(0, -1, 0));

	// 	const localInertia = new Ammo.btVector3(0, 0, 0);
	// 	const myMotionState = new Ammo.btDefaultMotionState(transform);
	// 	// if the mass is more than 0, the ground will react awkwardly
	// 	const mass = 0;
	// 	shape.calculateLocalInertia(mass, localInertia);
	// 	const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);
	// 	const body = new Ammo.btRigidBody(rbInfo);
	// 	body.setRestitution(1);
	// 	// console.log("mass", body.setM)

	// 	this.world.addRigidBody(body);
	// 	// this.bodies.push(body);
	// }
	private init() {
		if (!(this.world && this._gravity && this._input_init && this._body_helper)) {
			return;
		}
		this._gravity.setValue(this.pv.gravity.x, this.pv.gravity.y, this.pv.gravity.z);
		this.world.setGravity(this._gravity);

		for (let i = 0; i < this._input_init.length; i++) {
			const core_object = this._input_init[i];
			this._add_rbd_from_object(core_object, this._body_helper, this.world);
		}
		this._transform_core_objects_from_bodies();
		// this._create_constraints();
	}
	protected _create_constraints() {
		const rbd0 = this._bodies_by_id.get('/geo1/physics_rbd_attributes1:0')!;
		const rbd1 = this._bodies_by_id.get('/geo1/physics_rbd_attributes1:1')!;
		var pivotA = new Ammo.btVector3(0, 0.5, 0);
		var pivotB = new Ammo.btVector3(0, -0.5, 0);
		var axis = new Ammo.btVector3(0, 1, 0);
		const hinge = new Ammo.btHingeConstraint(rbd0, rbd1, pivotA, pivotB, axis, axis, true);
		const disable_collision_between_linked_bodies = true;
		this.world?.addConstraint(hinge, disable_collision_between_linked_bodies);
	}

	private simulate(dt: number) {
		if (!(this._input_init && this._body_helper)) {
			return;
		}

		this.world?.stepSimulation(dt, this.pv.maxSubsteps);
		this._apply_custom_forces();
		this._apply_rbd_update();
		this._transform_core_objects_from_bodies();
	}
	private _apply_custom_forces() {
		if (!(this._input_force_points && this._force_helper)) {
			return;
		}
		for (let i = 0; i < this._input_force_points.length; i++) {
			this._force_helper.apply_force(this._input_force_points[i], this.bodies);
		}
	}

	// TODO: use a deleted attribute to remove RBDs?
	// TODO: keep track of newly added ids
	private _apply_rbd_update() {
		if (!(this._input_attributes_update && this._body_helper)) {
			return;
		}
		for (let core_object of this._input_attributes_update) {
			const id = core_object.attrib_value(RBDAttribute.ID);
			if (CoreType.isString(id)) {
				const body = this._bodies_by_id.get(id);
				if (body) {
					this._update_active_state(id, body, core_object);
					this._update_kinematic_transform(body, core_object);
				}
			}
		}
	}
	private _update_active_state(id: string, body: Ammo.btRigidBody, core_object: CoreObject) {
		const current_state = this._bodies_active_state_by_id.get(id);
		const active_attr = core_object.attrib_value(RBDAttribute.ACTIVE);
		const new_state = active_attr == 1;
		if (current_state != new_state) {
			if (new_state == true) {
				this._body_helper?.make_active(body, this.world!);
			} else {
				this._body_helper?.make_kinematic(body);
			}
			this._bodies_active_state_by_id.set(id, new_state);
		}
	}

	protected _update_kinematic_transform(body: Ammo.btRigidBody, core_object: CoreObject) {
		if (this._body_helper && this._body_helper.is_kinematic(body)) {
			this._body_helper.transform_body_from_core_object(body, core_object);
		}
	}

	private _transform_core_objects_from_bodies() {
		if (!this._body_helper) {
			return;
		}
		for (let i = 0; i < this._objects_with_RBDs.length; i++) {
			this._body_helper.transform_core_object_from_body(this._objects_with_RBDs[i], this.bodies[i]);
		}
	}
	// private check_for_new_RBDs(core_group: CoreGroup) {
	// 	if (!this._body_helper) {
	// 		return;
	// 	}
	// 	for (let core_object of core_group.core_objects()) {
	// 		const id = core_object.attrib_value(RBDAttribute.ID);
	// 		if (CoreType.isString(id)) {
	// 			const body = this._bodies_by_id.get(id);
	// 			if (!body) {
	// 				this._add_rbd_from_object(core_object, this._body_helper, this.world!);
	// 			}
	// 		}
	// 	}
	// }

	private _add_rbd_from_object(
		core_object: CoreObject,
		body_helper: AmmoRBDBodyHelper,
		world: Ammo.btDiscreteDynamicsWorld
	) {
		const id = body_helper.read_object_attribute(core_object, RBDAttribute.ID, NULL_ID);
		if (id == NULL_ID) {
			console.warn('no id for RBD');
		}
		const body = body_helper.create_body(core_object);

		const simulated = body_helper.read_object_attribute(core_object, RBDAttribute.SIMULATED, false);

		if (simulated) {
			world.addRigidBody(body);
			body_helper.finalize_body(body, core_object);
			this._bodies_by_id.set(id, body);
			this.bodies.push(body);
			this._bodies_active_state_by_id.set(id, body_helper.is_active(body));
		}
		const object = core_object.object();
		this._objects_with_RBDs.push(object);
		object.visible = simulated;
	}

	//
	//
	// PARAM CALLBACKS
	//
	//
	static PARAM_CALLBACK_reset(node: PhysicsSolverSopNode) {
		node.reset();
	}
	private reset() {
		if (!this.world) {
			return;
		}
		for (let i = 0; i < this.bodies.length; i++) {
			this.world.removeRigidBody(this.bodies[i]);
		}
		this._bodies_by_id.clear();
		this._bodies_active_state_by_id.clear();
		this.bodies = [];
		this._objects_with_RBDs = [];
		this._input_init = undefined;
		this.scene.setFrame(this.pv.startFrame);
	}
}
