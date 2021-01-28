import {AllRegister} from '@polygonjs/polygonjs/dist/src/engine/poly/registers/All';
AllRegister.run();
import {polyPluginPhysics} from '../src/index';
import {Poly} from '@polygonjs/polygonjs/dist/src/engine/Poly';
Poly.registerPlugin(polyPluginPhysics);

import './helpers/setup';
import './tests';

QUnit.start();
