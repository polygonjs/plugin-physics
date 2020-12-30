import {AllRegister} from 'polygonjs-engine/src/engine/poly/registers/All';
AllRegister.run();
import {PolygonjsPluginOcclusion} from '../src/index';
import {Poly} from 'polygonjs-engine/src/engine/Poly';
Poly.instance().pluginsRegister.register('polygonjs-plugin-occlusion', PolygonjsPluginOcclusion);

import './helpers/setup';
import './tests';

QUnit.start();
