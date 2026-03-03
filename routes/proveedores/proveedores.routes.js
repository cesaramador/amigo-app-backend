import { Router } from 'express';

const proveedorRouter = Router();

proveedorRouter.get('/', (req, res) => {
    res.send({ title: 'GET all proveedores' });
}   );

proveedorRouter.get('/:id', (req, res) => {
    res.send({ title: 'GET proveedor details endpoint' });
});

proveedorRouter.post('/', (req, res) => {
    res.send({ title: 'CREATE new proveedor endpoint' });
});

proveedorRouter.put('/:id', (req, res) => {
    res.send({ title: 'UPDATE proveedor endpoint' });
});

proveedorRouter.delete('/:id', (req, res) => {
    res.send({ title: 'DELETE proveedor endpoint' });
});

proveedorRouter.get('/user/:id', (req, res) => {
    res.send({ title: 'GET proveedor by id endpoint' });
});

proveedorRouter.put('/:id/cancel', (req, res) => {
    res.send({ title: 'CANCEL proveedor endpoint' });
});

proveedorRouter.get('/upcoming-renewals', (req, res) => {
    res.send({ title: 'GET all upcoming renewals proveedor endpoint' });
});

export default proveedorRouter;