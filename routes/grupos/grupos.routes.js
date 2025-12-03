import { Router } from 'express';

const grupoRouter = Router();

grupoRouter.get('/', (req, res) => {
    res.send({ title: 'GET all subscriptions endpoint' });
}   );

grupoRouter.get('/:id', (req, res) => {
    res.send({ title: 'GET subscription details endpoint' });
});

grupoRouter.post('/', (req, res) => {
    res.send({ title: 'CREATE new subscription endpoint' });
});

grupoRouter.put('/:id', (req, res) => {
    res.send({ title: 'UPDATE subscription endpoint' });
});

grupoRouter.delete('/:id', (req, res) => {
    res.send({ title: 'DELETE subscription endpoint' });
});

grupoRouter.get('/user/:id', (req, res) => {
    res.send({ title: 'GET all user subscriptions endpoint' });
});

grupoRouter.put('/:id/cancel', (req, res) => {
    res.send({ title: 'CANCEL subscription endpoint' });
});

grupoRouter.get('/upcoming-renewals', (req, res) => {
    res.send({ title: 'GET all upcoming renewals subscription endpoint' });
});

export default grupoRouter;