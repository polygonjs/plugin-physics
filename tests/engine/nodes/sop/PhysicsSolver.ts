import {TransformTargetType} from '@polygonjs/polygonjs/dist/src/core/Transform';
import {PolyScene} from '@polygonjs/polygonjs/dist/src/engine/scene/PolyScene';
import {RBDShape, RBD_SHAPES} from '../../../../src/core/physics/ammo/RBDBodyHelper';
import {ExtendedGeoObjNode} from '../../../../src/engine/nodes/obj/ExtendedGeo';
import {RBDAttributeMode} from '../../../../src/engine/operations/sop/PhysicsRbdAttributes';

QUnit.test('physics solver for objects', async (assert) => {
	const scene = new PolyScene();
	const geo1 = scene.root().createNode('geo') as ExtendedGeoObjNode;

	const box1 = geo1.createNode('box');
	const transform = geo1.createNode('transform');
	transform.setApplyOn(TransformTargetType.OBJECTS);
	const physicsRbdAttributes = geo1.createNode('physicsRbdAttributes');
	transform.setInput(0, box1);
	physicsRbdAttributes.setInput(0, transform);
	physicsRbdAttributes.p.shape.set(RBD_SHAPES.indexOf(RBDShape.BOX));

	const solver = geo1.createNode('physicsSolver');
	solver.setInput(0, physicsRbdAttributes);
	solver.flags.display.set(true);

	const container = await solver.compute();
	const core_group = container.coreContent()!;
	const object = core_group.objectsWithGeo()[0];

	scene.setFrame(0);
	await solver.compute();

	for (let i = 0; i < 50; i++) {
		scene.setFrame(scene.frame() + 1);
		await solver.compute();
	}
	assert.in_delta(object.position.y, -14.5, 0.5);
});

QUnit.test('physics solver for instances', async (assert) => {
	const scene = new PolyScene();
	const geo1 = scene.root().createNode('geo') as ExtendedGeoObjNode;

	const box1 = geo1.createNode('box');
	const plane1 = geo1.createNode('plane');
	const instance = geo1.createNode('instance');
	instance.setInput(0, box1);
	instance.setInput(1, plane1);
	const physicsRbdAttributes = geo1.createNode('physicsRbdAttributes');
	physicsRbdAttributes.setInput(0, instance);
	physicsRbdAttributes.setMode(RBDAttributeMode.POINTS);
	physicsRbdAttributes.p.shape.set(RBD_SHAPES.indexOf(RBDShape.BOX));

	const solver = geo1.createNode('physicsSolver');
	solver.setInput(0, physicsRbdAttributes);
	solver.flags.display.set(true);

	const container = await solver.compute();
	const core_group = container.coreContent()!;
	const object = core_group.objectsWithGeo()[0];
	const geometry = object.geometry;

	scene.setFrame(0);
	await solver.compute();

	assert.equal(object.position.y, 0);
	assert.in_delta(geometry.getAttribute('instancePosition').array[1], 0, 0.1);
	for (let i = 0; i < 50; i++) {
		scene.setFrame(scene.frame() + 1);
		await solver.compute();
	}
	assert.equal(object.position.y, 0);
	assert.in_delta(geometry.getAttribute('instancePosition').array[1], -14.5, 0.5);
});
