/**
 * Applies physics with the Ammo physics solver
 *
 * @remarks
 * TBD
 *
 *
 */
// https://stackblitz.com/edit/ammojs-typed-falling-cubes?file=simulation.ts
import {TypedSopNode} from '@polygonjs/polygonjs/dist/src/engine/nodes/sop/_Base';
import {CoreGroup} from '@polygonjs/polygonjs/dist/src/core/geometry/Group';
import {RBDAttribute} from '../../../core/physics/ammo/helper/_Base';
import {AmmoRBDBodyHelper} from '../../../core/physics/ammo/helper/RBDBodyHelper';
import {BaseNodeType} from '@polygonjs/polygonjs/dist/src/engine/nodes/_Base';
import {CoreObject} from '@polygonjs/polygonjs/dist/src/core/geometry/Object';
import {CorePoint} from '@polygonjs/polygonjs/dist/src/core/geometry/Point';
import {AmmoForceHelper} from '../../../core/physics/ammo/ForceHelper';
import {PhysicsSolverSopOperation} from '../../operations/sop/PhysicsSolver';
import {NodeParamsConfig, ParamConfig} from '@polygonjs/polygonjs/dist/src/engine/nodes/utils/params/ParamsConfig';
import {Object3D} from 'three';
import {RBDAttributeMode, RBD_ATTRIBUTE_MODES} from '../../operations/sop/PhysicsRbdAttributes';
import {AmmoRBDPointBodyHelper} from '../../../core/physics/ammo/helper/RBDPointBodyHelper';
import {MapUtils} from '@polygonjs/polygonjs/dist/src/core/MapUtils';
import {CoreEntity} from '@polygonjs/polygonjs/dist/src/core/geometry/Entity';
import {Ammo} from '../../../core/physics/ammo/helper/AmmoImport';
const NULL_ID = '';
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

// this queue is needed in case of multiple physics node
// which would each load Ammo at the same time, and therefore
// lead to some solvers not working
type OnPrepareCallback = () => void;
class AmmoPrepareQueue {
	private _loading = false;
	private _loaded = false;
	private _callbacks: OnPrepareCallback[] = [];
	onReady(callback: OnPrepareCallback) {
		if (this._loaded) {
			return callback();
		}
		this._callbacks.push(callback);
		if (!this._loading) {
			this._load();
		}
	}
	private _flush() {
		const callbacksCopy: OnPrepareCallback[] = [];
		let callback: OnPrepareCallback | undefined;
		while ((callback = this._callbacks.pop())) {
			callbacksCopy.push(callback);
		}
		for (let callbackCopy of callbacksCopy) {
			callbackCopy();
		}
	}
	private _load() {
		this._loading = true;
		Ammo(Ammo).then(() => {
			this._loaded = true;
			this._flush();
		});
	}
}
const AMMO_PREPARE_QUEUE = new AmmoPrepareQueue();
export class PhysicsSolverSopNode extends TypedSopNode<AmmoSolverSopParamsConfig> {
	override paramsConfig = ParamsConfig;
	static override type() {
		return 'physicsSolver';
	}
	private config: Ammo.btDefaultCollisionConfiguration | undefined;
	private dispatcher: Ammo.btCollisionDispatcher | undefined;
	private overlappingPairCache: Ammo.btDbvtBroadphase | undefined;
	private solver: Ammo.btSequentialImpulseConstraintSolver | undefined;
	private world: Ammo.btDiscreteDynamicsWorld | undefined;
	private bodies: Ammo.btRigidBody[] = [];
	private _bodyByObject: Map<Object3D, Ammo.btRigidBody> = new Map();
	private _bodyByPoints: Map<Object3D, Ammo.btRigidBody[]> = new Map();
	// private boxShape: Ammo.btBoxShape | undefined;
	// private sphereShape: Ammo.btSphereShape | undefined;
	// private transform: Ammo.btTransform | undefined;
	private _gravity: Ammo.btVector3 | undefined;
	private _singleBodyById: Map<string, Ammo.btRigidBody> = new Map();
	private _pointBodyById: Map<string, Ammo.btRigidBody> = new Map();
	private _bodyActiveStateByBody: WeakMap<Ammo.btRigidBody, boolean> = new WeakMap();
	// helpers
	private _body_helper: AmmoRBDBodyHelper | undefined;
	private _point_helper: AmmoRBDPointBodyHelper | undefined;
	private _force_helper: AmmoForceHelper | undefined;
	// inputs
	private _input_init: CoreObject[] | undefined;
	private _input_force_points: CorePoint[] | undefined;
	private _input_attributes_update: CoreObject[] | undefined;
	private _objects_with_RBDs: Object3D[] = [];

	static override displayedInputNames(): string[] {
		return ['RBDs', 'Forces', 'Updated RBD Attributes'];
	}

	override initializeNode() {
		this.io.inputs.setCount(1, 3);

		// this has to clone for now, to allow for reposition the input core_objects
		// when re-initializing the sim. If we do not clone, the objects will be modified,
		// and therefore the reseting the transform of the RBDs will be based on moved objects, which is wrong. Oh so very wrong.
		// But we also set the cook controller to disallow_inputs_evaluation
		// to ensure it is not cloned on every frame
		this.io.inputs.initInputsClonedState(PhysicsSolverSopOperation.INPUT_CLONED_STATE);
		this.cookController.disallowInputsEvaluation();

		// physics
		this.addGraphInput(this.scene().timeController.graphNode);
		AMMO_PREPARE_QUEUE.onReady(() => {
			this.prepare();
		});
	}

	prepare() {
		this._body_helper = new AmmoRBDBodyHelper();
		this._point_helper = new AmmoRBDPointBodyHelper();
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

	override async cook(input_contents: CoreGroup[]) {
		// either the physics solver node loads faster,
		// due to the recent dependency graph fix in polygonjs,
		// or ammo loads more slowly,
		// but we now have to check if ammo is ready when cooking here
		AMMO_PREPARE_QUEUE.onReady(this._runSimulationBound);
	}
	private _runSimulationBound = this._runSimulation.bind(this);
	private async _runSimulation() {
		if (this.scene().frame() == this.pv.startFrame) {
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
		this.setObjects(this._objects_with_RBDs);
	}

	private async _fetch_input_objects(input_index: number) {
		const input_node = this.io.inputs.input(input_index);
		if (input_node) {
			const container = await this.containerController.requestInputContainer(input_index);
			if (container) {
				const core_group = container.coreContentCloned();
				if (core_group) {
					return core_group.coreObjects();
				}
			}
		}
		return [];
	}
	private async _fetch_input_points(input_index: number) {
		const input_node = this.io.inputs.input(input_index);
		if (input_node) {
			const container = await this.containerController.requestInputContainer(input_index);
			if (container) {
				const core_group = container.coreContentCloned();
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

	// 	this.world.addRigidBody(body);
	// 	// this.bodies.push(body);
	// }
	private init() {
		if (!(this.world && this._gravity && this._input_init && this._body_helper && this._point_helper)) {
			return;
		}
		this._gravity.setValue(this.pv.gravity.x, this.pv.gravity.y, this.pv.gravity.z);
		this.world.setGravity(this._gravity);

		for (let i = 0; i < this._input_init.length; i++) {
			const core_object = this._input_init[i];
			this._add_rbd_from_object(core_object, this._body_helper, this._point_helper, this.world);
		}
		this._transform_core_objects_from_bodies();
		// this._create_constraints();
	}
	protected _create_constraints() {
		const rbd0 = this._singleBodyById.get('/geo1/physics_rbd_attributes1:0')!;
		const rbd1 = this._singleBodyById.get('/geo1/physics_rbd_attributes1:1')!;
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
		if (!(this._input_attributes_update && this._body_helper && this._point_helper)) {
			return;
		}
		for (let core_object of this._input_attributes_update) {
			// for CoreObjects
			const id = this._body_helper.readAttribute(core_object, RBDAttribute.ID, NULL_ID);
			const objectBody = this._singleBodyById.get(id);
			if (objectBody) {
				this._updateCoreEntityActiveState(objectBody, core_object, this._body_helper);
				this._body_helper.updateKinematicTransform(objectBody, core_object);
			} else {
				// for Instances
				const points = core_object.points();
				for (let point of points) {
					const id = this._point_helper.readAttribute(point, RBDAttribute.ID, NULL_ID);
					const pointBody = this._pointBodyById.get(id);
					if (pointBody) {
						this._updateCoreEntityActiveState(pointBody, point, this._point_helper);
						this._point_helper.updateKinematicTransform(pointBody, point);
					}
				}
			}
		}
	}
	private _updateCoreEntityActiveState(
		body: Ammo.btRigidBody,
		entity: CoreEntity,
		helper: AmmoRBDBodyHelper | AmmoRBDPointBodyHelper
	) {
		const current_state = this._bodyActiveStateByBody.get(body);
		const active_attr = entity.attribValue(RBDAttribute.ACTIVE);
		const new_state = active_attr == 1;
		if (current_state != new_state) {
			if (new_state == true) {
				helper.makeActive(body, this.world!);
			} else {
				helper.makeKinematic(body);
			}
			this._bodyActiveStateByBody.set(body, new_state);
		}
	}

	private _transform_core_objects_from_bodies() {
		if (!(this._body_helper && this._point_helper)) {
			return;
		}
		// for (let i = 0; i < this._objects_with_RBDs.length; i++) {
		// 	const body = this._bodyByObject.get()
		// 	this._body_helper.transform_core_object_from_body(this._objects_with_RBDs[i], this.bodies[i]);
		// }
		for (let object of this._objects_with_RBDs) {
			const bodyForObject = this._bodyByObject.get(object);
			if (bodyForObject) {
				this._body_helper.transformEntityFromBody(object, bodyForObject);
			} else {
				const bodiesForPoints = this._bodyByPoints.get(object);
				if (bodiesForPoints) {
					this._point_helper.transformPointsFromBodies(bodiesForPoints);
				}
			}
		}
	}
	// private check_for_new_RBDs(core_group: CoreGroup) {
	// 	if (!this._body_helper) {
	// 		return;
	// 	}
	// 	for (let core_object of core_group.coreObjects()) {
	// 		const id = core_object.attribValue(RBDAttribute.ID);
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
		point_helper: AmmoRBDPointBodyHelper,
		world: Ammo.btDiscreteDynamicsWorld
	) {
		const mode = core_object.attribValue(RBDAttribute.ATTRIBUTE_MODE) as number;
		const attributeMode = RBD_ATTRIBUTE_MODES[mode];
		switch (attributeMode) {
			case RBDAttributeMode.OBJECTS: {
				return this._addRbdFromObjectLevelAttributes(core_object, body_helper, world);
			}
			case RBDAttributeMode.POINTS: {
				return this._addRbdFromPointLevelAttributes(core_object, point_helper, world);
			}
		}
	}
	private _addRbdFromObjectLevelAttributes(
		core_object: CoreObject,
		body_helper: AmmoRBDBodyHelper,
		world: Ammo.btDiscreteDynamicsWorld
	) {
		const id = body_helper.readAttribute(core_object, RBDAttribute.ID, NULL_ID);
		if (id == NULL_ID) {
			console.warn('no id for RBD');
		}
		const body = body_helper.createBody(core_object);

		const simulated = body_helper.readAttribute(core_object, RBDAttribute.SIMULATED, false);

		if (simulated) {
			world.addRigidBody(body);
			body_helper.finalizeBody(body, core_object);
			this._singleBodyById.set(id, body);
			this.bodies.push(body);
			this._bodyByObject.set(core_object.object(), body);
			this._bodyActiveStateByBody.set(body, body_helper.isActive(body));
		}
		const object = core_object.object();
		this._objects_with_RBDs.push(object);
		object.visible = simulated;
	}

	private _addRbdFromPointLevelAttributes(
		core_object: CoreObject,
		point_helper: AmmoRBDPointBodyHelper,
		world: Ammo.btDiscreteDynamicsWorld
	) {
		const object = core_object.object();
		const points = core_object.points();
		for (let corePoint of points) {
			const id = point_helper.readAttribute(corePoint, RBDAttribute.ID, NULL_ID);
			if (id == NULL_ID) {
				console.warn('no id for RBD');
			}
			const body = point_helper.createBody(corePoint);
			const simulated = point_helper.readAttribute(corePoint, RBDAttribute.SIMULATED, false);

			if (simulated) {
				world.addRigidBody(body);
				point_helper.finalizeBody(body, corePoint);

				this.bodies.push(body);
				this._pointBodyById.set(id, body);
				MapUtils.pushOnArrayAtEntry(this._bodyByPoints, object, body);
				this._bodyActiveStateByBody.set(body, point_helper.isActive(body));
			}
		}
		this._objects_with_RBDs.push(object);
		// object.visible = simulated; // TODO: not yet sure what to do with that
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
			console.warn('no world created, aborting reset');
			return;
		}
		for (let i = 0; i < this.bodies.length; i++) {
			this.world.removeRigidBody(this.bodies[i]);
		}
		this._singleBodyById.clear();
		this._pointBodyById.clear();
		this.bodies = [];
		this._bodyByObject.clear();
		this._bodyByPoints.clear();
		this._objects_with_RBDs = [];
		this._input_init = undefined;
		this.scene().setFrame(this.pv.startFrame);
	}
}
