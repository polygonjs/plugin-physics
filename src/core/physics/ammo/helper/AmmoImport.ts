// import ammo here as a central file for others to import it from.
// The new import method now imports from the ammojs-typed that's in src/core
// instead of in node_modules.
// The reason is that when using the one in node_modules unchanged,
// It would not be compiled by esbuild when used in PolyConfig in polygonjs-editor.
// So instead, I've copied all the content of ammojs-typed into src/core/physics/ammo
// and also removed "this.Ammo=b;" at the end of the file.

import Ammo from '../../ammo/ammo';
// import Ammo from 'ammojs-typed';
export {Ammo}