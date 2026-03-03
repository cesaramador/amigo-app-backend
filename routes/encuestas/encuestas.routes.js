import { Router } from 'express';

const encuestaRouter = Router();

encuestaRouter.get('/', (req, res) => {
    res.send({ title: 'GET all encuestas' });
}   );

encuestaRouter.get('/:id', (req, res) => {
    res.send({ title: 'GET encuesta details endpoint' });
});

encuestaRouter.post('/', (req, res) => {
    res.send({ title: 'CREATE new encuesta endpoint' });
});

encuestaRouter.put('/:id', (req, res) => {
    res.send({ title: 'UPDATE encuesta endpoint' });
});

encuestaRouter.delete('/:id', (req, res) => {
    res.send({ title: 'DELETE encuesta endpoint' });
});

encuestaRouter.get('/user/:id', (req, res) => {
    res.send({ title: 'GET encuesta by id endpoint' });
});

encuestaRouter.put('/:id/cancel', (req, res) => {
    res.send({ title: 'CANCEL encuesta endpoint' });
});

encuestaRouter.get('/upcoming-renewals', (req, res) => {
    res.send({ title: 'GET all upcoming renewals encuesta endpoint' });
});

export default encuestaRouter;