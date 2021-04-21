import {PolyScene} from '@polygonjs/polygonjs/dist/src/engine/scene/PolyScene';
import {RBDAttribute, RBDShape, RBD_SHAPES} from '../../../../src/core/physics/ammo/helper/_Base';
import {ExtendedGeoObjNode} from '../../../../src/engine/nodes/obj/ExtendedGeo';

QUnit.test('physics rbd attributes simple for box', async (assert) => {
	const scene = new PolyScene();
	const geo1 = scene.root().createNode('geo') as ExtendedGeoObjNode;

	const box1 = geo1.createNode('box');
	const physicsRbdAttributes = geo1.createNode('physicsRbdAttributes');
	physicsRbdAttributes.setInput(0, box1);
	physicsRbdAttributes.p.shape.set(RBD_SHAPES.indexOf(RBDShape.BOX));

	let container;
	container = await physicsRbdAttributes.compute();
	let core_group = container.coreContent()!;
	let object = core_group.objectsWithGeo()[0];

	const attributes = object.userData.attributes;

	assert.equal(attributes[RBDAttribute.ACTIVE], 1);
	assert.equal(attributes[RBDAttribute.ANGULAR_DAMPING], 0);
	assert.deepEqual(attributes[RBDAttribute.SHAPE_SIZE_BOX].toArray(), [1, 1, 1]);
});

QUnit.test('physics rbd attributes simple for sphere', async (assert) => {
	const scene = new PolyScene();
	const geo1 = scene.root().createNode('geo') as ExtendedGeoObjNode;

	const box1 = geo1.createNode('box');
	const physicsRbdAttributes = geo1.createNode('physicsRbdAttributes');
	physicsRbdAttributes.setInput(0, box1);
	physicsRbdAttributes.p.shape.set(RBD_SHAPES.indexOf(RBDShape.SPHERE));

	let container;
	container = await physicsRbdAttributes.compute();
	let core_group = container.coreContent()!;
	let object = core_group.objectsWithGeo()[0];

	const attributes = object.userData.attributes;

	assert.equal(attributes[RBDAttribute.ACTIVE], 1);
	assert.equal(attributes[RBDAttribute.ANGULAR_DAMPING], 0);
	assert.in_delta(attributes[RBDAttribute.SHAPE_SIZE_SPHERE], 1.73, 0.1);
});
