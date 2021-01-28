# Polygonjs Physics Plugin

This adds several nodes to handle physics in the [Polygonjs webgl engine](https://polygonjs.com).

-   Sop/PhysicsSolver: computes the input geometries and attributes and solves the simulation at every frame
-   Sop/PhysicsRbdAttributes: creates attributes necessary for rigid body simulations
-   Sop/PhysicsForceAttributes: creates attributes to define forces
-   Sop/PhysicsConstraintAttributes: create constraints (very early WIP)

See [example scene](https://github.com/polygonjs/example-plugin-physics):

![scene with physics](https://github.com/polygonjs/example-plugin-physics/blob/main/doc/physics_examples.jpg?raw=true)

# Install

Import the plugin:

`yarn add @polygonjs/plugin-physics`

And register the plugin in the function `configurePolygonjs` in the file `PolyConfig.js` so that the physics nodes can be accessible in both the editor and your exported scene:

```js
import {polyPluginPhysics} from '@polygonjs/plugin-physics/dist/src/index';

export function configurePolygonjs(poly) {
	poly.registerPlugin(polyPluginPhysics);
}
```
