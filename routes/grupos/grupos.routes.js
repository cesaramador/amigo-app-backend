import { Router } from 'express';

const grupoRouter = Router();

grupoRouter.get('/', (req, res) => {
    res.send({ title: 'GET all groups' });
}   );

grupoRouter.get('/:id', (req, res) => {
    res.send({ title: 'GET group details endpoint' });
});

grupoRouter.post('/', (req, res) => {
    res.send({ title: 'CREATE new group endpoint' });
});

grupoRouter.put('/:id', (req, res) => {
    res.send({ title: 'UPDATE group endpoint' });
});

grupoRouter.delete('/:id', (req, res) => {
    res.send({ title: 'DELETE group endpoint' });
});

grupoRouter.get('/user/:id', (req, res) => {
    res.send({ title: 'GET group by id endpoint' });
});

grupoRouter.put('/:id/cancel', (req, res) => {
    res.send({ title: 'CANCEL group endpoint' });
});

grupoRouter.get('/upcoming-renewals', (req, res) => {
    res.send({ title: 'GET all upcoming renewals group endpoint' });
});

export default grupoRouter;