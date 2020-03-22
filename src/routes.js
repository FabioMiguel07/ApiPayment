import { Router } from 'express';
import TokenController from "./app/controllers/TokenController";
import VendaController from "./app/controllers/VendaController";
import Init from "./app/controllers/Init";

const routes = new Router();

/**
 * Recurando token do cartao de credito
 */
routes.post('/token', TokenController.store);
routes.get('/token/:MerchantOrderId', TokenController.index);

routes.post('/venda', VendaController.store);
routes.get('/venda/:PaymentId', VendaController.index);
routes.put('/venda', VendaController.update);

routes.get('/', Init.index);


export default routes;
