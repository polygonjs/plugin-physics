# RETIRED

This repository is not used anymore, as the physics has been fully integrated into the [core engine](https://polygonjs.com) and [source](https://github.com/polygonjs/polygonjs)

# Polygonjs Physics Plugin

This adds several nodes to handle physics in the [Polygonjs webgl engine](https://polygonjs.com).

-   **Sop/PhysicsSolver**: computes the input geometries and attributes and solves the simulation at every frame
-   **Sop/PhysicsRbdAttributes**: creates attributes necessary for rigid body simulations
-   **Sop/PhysicsForceAttributes**: creates attributes to define forces

This is currently using Ammo from [https://github.com/giniedp/ammojs-typed](https://github.com/giniedp/ammojs-typed).

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
