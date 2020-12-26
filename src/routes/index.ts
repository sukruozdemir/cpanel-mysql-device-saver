import { Router } from 'express';

import validate from '../middlewares/validate.middleware';
import { deviceController } from '../controllers';
import { deviceValidation } from '../validations';

const router = Router();

router.post(
  '/createDevice',
  validate(deviceValidation.createDevice),
  deviceController.createDevice,
);

export default router;
