import {BaseSopOperation} from '@polygonjs/polygonjs/dist/src/engine/operations/sop/_Base';
import {DefaultOperationParams} from '@polygonjs/polygonjs/dist/src/engine/operations/_Base';
import {CoreGroup} from '@polygonjs/polygonjs/dist/src/core/geometry/Group';
import {InputCloneMode} from '@polygonjs/polygonjs/dist/src/engine/poly/InputCloneMode';
import {Vector3} from 'three/src/math/Vector3';
import {TimeController} from '@polygonjs/polygonjs/dist/src/engine/scene/utils/TimeController';

export enum RBDAttributeMode {
	OBJECTS = 'objects',
	POINTS = 'points',
}
export const RBD_ATTRIBUTE_MODES: Array<RBDAttributeMode> = [RBDAttributeMode.OBJECTS, RBDAttributeMode.POINTS];

interface PhysicsSolverSopParams extends DefaultOperationParams {
	startFrame: number;
	gravity: Vector3;
	maxSubsteps: number;
}

export class PhysicsSolverSopOperation extends BaseSopOperation {
	static readonly DEFAULT_PARAMS: PhysicsSolverSopParams = {
		startFrame: TimeController.START_FRAME,
		gravity: new Vector3(0, -9.81, 0),
		maxSubsteps: 2,
	};
	static readonly INPUT_CLONED_STATE = [InputCloneMode.ALWAYS, InputCloneMode.NEVER, InputCloneMode.NEVER];
	static type(): Readonly<'physicsSolver'> {
		return 'physicsSolver';
	}
	cook(input_contents: CoreGroup[], params: PhysicsSolverSopParams) {
		// TODO: Operations would require more work for the PhysicsSolver to have one:
		// - init Ammo
		// - update every frame
		// but it's probably okay for now if it does not have a matching operation
		// as few physics solvers are expected to exist withing a scene.
		return input_contents[0];
	}
}
