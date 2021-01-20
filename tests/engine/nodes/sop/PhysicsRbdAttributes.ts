import {PolyScene} from 'polygonjs-engine/src/engine/scene/PolyScene';
import {ExtendedGeoObjNode} from '../../../../src/engine/nodes/obj/ExtendedGeo';

QUnit.test('physics rbd attributes simple', async (assert) => {
	const scene = new PolyScene();
	const geo1 = scene.root().createNode('geo') as ExtendedGeoObjNode;

	const box1 = geo1.createNode('box');
	const physicsRbdAttributes = geo1.createNode('physicsRbdAttributes');
	physicsRbdAttributes.setInput(0, box1);

	let container;
	container = await physicsRbdAttributes.requestContainer();
	let core_group = container.coreContent()!;
	let object = core_group.objectsWithGeo()[0];

	const attributes = object.userData.attributes;
	console.log(attributes);

	assert.equal(attributes.active, 1);
});