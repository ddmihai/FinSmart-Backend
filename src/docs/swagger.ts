import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const specPath = path.resolve(process.cwd(), 'src', 'docs', 'openapi.yaml');
const file = fs.readFileSync(specPath, 'utf8');
const spec = YAML.parse(file);

const router = Router();
router.use('/', swaggerUi.serve, swaggerUi.setup(spec, {
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: false,
    docExpansion: 'list'
  },
  customSiteTitle: 'FinSmart API Docs'
}));
router.get('/json', (_req, res) => res.json(spec));

export default router;
